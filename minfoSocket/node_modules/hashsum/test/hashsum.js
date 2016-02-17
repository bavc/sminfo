var assert = require('assert');
var fs = require('fs');
var path = require('path');

var hashsum = require('..');

describe('hashsum(src, [options,] cb)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum, 'function');
  });

  it('should hash files in a directory', function (done) {
    hashsum(path.resolve('./'), {filterFn: filter_git}, function (errors, hashes) {
      assert.ok(!errors);
      assert.ok(hashes);
      done();
    });
  });

  it('should hash a file', function (done) {
    hashsum(path.resolve('./README.md'), function (err, hash) {
      assert.ok(!err);
      assert.ok(hash);
      done();
    });
  });

  it('should hash a stream', function (done) {
    hashsum(fs.createReadStream(path.resolve('./README.md')), function (err, hash) {
      assert.ok(!err);
      assert.ok(hash);
      done();
    });
  });

  it('should hash a string', function (done) {
    hashsum('hash me maybe?', function (err, hash) {
      assert.ok(!err);
      assert.ok(hash);
      done();
    });
  });

  it('should coerce non-string values to string', function (done) {
    var pending = 0;

    VALUES.forEach(function (value) {
      pending += 1;

      hashsum(value, function (err, hash) {
        assert.ok(!err);
        assert.ok(hash);

        pending -= 1;

        if (pending === 0) {
          done();
        }
      });
    });

  });
});


describe('hashsum.sync(src, [options])', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.sync, 'function');
  });

  it('should hash files in a directory', function () {
    assert.ok( hashsum.sync(path.resolve('./'), {filterFn: filter_git}) );
  });

  it('should hash a file', function () {
    assert.ok( hashsum.sync(path.resolve('./README.md')) );
  });

  it('should hash a string', function () {
    assert.ok( hashsum.sync('hash me maybe?') );
  });

  it('should coerce non-string values to string', function () {
    VALUES.forEach(function (value) {
      assert.ok( hashsum.sync(value) );
    });
  });

  it('should throw on stream values', function () {
    assert.throws(function () {
      hashsum.sync(fs.createReadStream(path.resolve('./README.md')));
    });
  });
});


describe('hashsum.directory(path, options, cb)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.directory, 'function');
  });

  it('should hash files in a directory', function (done) {
    hashsum.directory(path.resolve('./'), {filterFn: filter_git}, function (err, hashes) {
      assert.ok(!err);
      assert.ok(hashes);

      done();
    });
  });

  it('should hash files recursively', function (done) {
    hashsum.directory(path.resolve('./'), {recursive: true, filterFn: filter_git}, function (err, hashes) {
      assert.ok(!err);
      assert.ok(hashes);

      done();
    });
  });

  it('should hash files recursively, filtering out unwanted paths', function (done) {
    var options = { filterFn: filter, recursive: true };

    hashsum.directory(path.resolve('./'), options, function (err, hashes) {
      assert.ok(!err);
      assert.ok(hashes);

      done();
    });
  });

  it('should hash files in a directory, and write relative paths', function (done) {
    hashsum.directory(path.resolve('./'), { relativePaths: true, filterFn: filter_git }, function (errors, hashes) {
      assert.ok(!errors);
      assert.ok(hashes);

      done();
    });
  });

  it('should error on an invalid path', function (done) {
    hashsum.directory('/nonexistant', function (err, hashes) {
      assert.ok(err);
      assert.ok(err.code);
      assert.equal(err.code, 'ENOENT');

      assert.ok(!hashes);

      done();
    });
  });
});


describe('hashsum.directorySync(path, options)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.directorySync, 'function');
  });

  it('should hash files in a directory', function () {
    var hashes = hashsum.directorySync(path.resolve('./'));
    assert.ok(hashes);
  });

  it('should hash files in a directory, recursively', function () {
    var hashes = hashsum.directorySync(path.resolve('./'), {recursive: true, filterFn: filter_git});
    assert.ok(hashes);
  });

  it('should hash files in a directoy, recursively, filtering out unwanted paths', function () {
    var hashes = hashsum.directorySync(path.resolve('./'), { filterFn: filter, recursive: true });
    assert.ok(hashes);
  });

  it('should hash files in a directory, and write relative paths', function () {
    var hashes = hashsum.directorySync(path.resolve('./'), { relativePaths: true, filterFn: filter_git });
    assert.ok(hashes);
  });

  it('should throw on invalid path', function () {
    assert.throws(function () {
      hashsum.directorySync('/nonexistant');
    });
  });
});


describe('hashsum.file(path, options, cb)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.file, 'function');
  });

  it('should hash a file', function (done) {
    hashsum.file(path.resolve('./README.md'), function (err, hash) {
      assert.ok(!err);
      assert.ok(hash);
      done();
    });
  });

  it('should error on invalid path', function (done) {
    hashsum.file('/nonexistant', function (err, hash) {
      assert.ok(err);
      assert.ok(err.code);
      assert.equal(err.code, 'ENOENT');

      assert.ok(!hash);

      done();
    });
  });
});


describe('hashsum.fileSync(path, options)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.fileSync, 'function');
  });

  it('should hash a file', function () {
    var hash = hashsum.fileSync(path.resolve('./README.md'));
    assert.ok(hash);
  });

  it('should throw on invalid path', function () {
    assert.throws(function () {
      hashsum.fileSync('/nonexistant');
    });
  });
});


describe('hashsum.stream(stream, options, cb)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.stream, 'function');
  });

  it('should hash a stream', function (done) {
    hashsum.stream(fs.createReadStream(path.resolve('./README.md')), function (err, hash) {
      assert.ok(!err);
      assert.ok(hash);
      done();
    });
  });

  it('should error on stream errors', function (done) {
    hashsum.stream(fs.createReadStream('/nonexistant'), function (err, hash) {
      assert.ok(err);
      assert.ok(err.code);
      assert.equal(err.code, 'ENOENT');

      assert.ok(!hash);

      done();
    });
  });
});


describe('hashsum.string(str, options, cb)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.string, 'function');
  });

  it('should hash a string', function (done) {
    hashsum.string('Hash me maybe.', function (err, hash) {
      assert.ok(!err);
      assert.ok(hash);
      done();
    });
  });

  it('should coerce non-string values to string', function (done) {
    var pending = 0;

    VALUES.forEach(function (value) {
      pending += 1;

      hashsum.string(value, function (err, hash) {
        assert.ok(!err);
        assert.ok(hash);

        pending -= 1;

        if (pending === 0) {
          done();
        }
      });
    });

  });
});


describe('hashsum.stringSync(str, options)', function () {
  it('should be a function', function () {
    assert.equal(typeof hashsum.stringSync, 'function');
  });

  it('should hash a string', function () {
    var hash = hashsum.stringSync('Hash me maybe.');
    assert.ok(hash);
  });

  it('should coerce non-string values to string', function () {
    VALUES.forEach(function (value) {
      assert.ok( hashsum.stringSync(value) );
    });
  });
});


// -- Fixtures --

var VALUES = [
  '',
  42,
  new Date(),
  {},
  [],
  /bob/i,
  new Error('Ouch!'),
  function test (str) { return str; },
  true,
  null,
  undefined,
  Infinity,
  NaN
];

// -- Helper Functions --

// Returns `false` if `str` contains the substring `"node_modules"`, and `true`
// if it does not.
function filter(str) {
  return !(/node_modules/).test(str) && filter_git(str);
}

function filter_git(str) {
  return !(/\.git/).test(str);
}
