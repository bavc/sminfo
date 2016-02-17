var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var nextTick = (typeof setImmediate === 'function') ? setImmediate : process.nextTick;

/**
Calculate hashsums for the contents of all files in a directory. Hashsums are
provided as a `hashes` object that maps file name to hashsum.


A directory structure like this:

```
[root]
  |- public/
  |   `- css/
  |       `- reset.css
  `- index.html
```

 Might produce a `hashes` object like this:

```js
{
  'index.html': 'de59a86eea5cc70b3d3c8c27d210eb23d5e34873',
  'public/css/reset.css': '82bed1345e375f93cadd5494cac046e8ff80ece3',
  ...
}
```

@param {String} dir directory path
@param {Object} [options={}]
@param {Function} cb
  @param {Error|Null} error
  @param {Object} hashes
*/
exports.dir = exports.directory = function directory (dir, options, cb) {
  if (!cb) {
    cb = options;
    options = {};
  }

  var hashes = {};
  var pending = {};

  fs.readdir(dir, function (err, files) {
    if (err) { return cb(err); }

    files.forEach(function (file) {
      var filePath = path.join(dir, file);

      if (options.filterFn && !options.filterFn(filePath)) { return; }

      pending[filePath] = true;

      fs.stat(filePath, function (err, stat) {
        if (err) { return cb(err); }

        if (stat.isFile()) {
          hashFile(filePath, options);
        } else if (stat.isDirectory()) {
          hashDirectory(filePath, options);
        } else {
          cb(new Error('Path is not a file or directory: %s', filePath));
        }
      });
    });
  });

  /*
  Helper function that invokes the callback function `cb` when there are no
  remaining pending file system operations.
  */
  function checkDone() {
    if (Object.keys(pending).length > 0) {
      return;
    }

    if (options.relativePaths && !options.nested) {
      hashes = relativePaths(dir, hashes);
    }

    cb(null, hashes);
  }

  // Hash a single file.
  function hashFile(path, options) {
    exports.file(path, options, function (err, hash) {
      if (err) { return cb(err); }

      hashes[path] = hash;
      delete pending[path];
      checkDone();
    });
  }

  // Hash a nested directory.
  function hashDirectory(path, options) {
    if (!options.recursive) {
      delete pending[path];
      checkDone();
      return;
    }

    options.nested || (options.nested = 0);
    options.nested += 1;

    exports.directory(path, options, function (err, dirHashes) {
      options.nested -= 1;

      if (err) { return cb(err); }
      hashes = extend(hashes, dirHashes);

      delete pending[path];
      checkDone();
    });
  }
};


/*
Syncrhonous version of `directory`.

@see `directory`
@param {String} dir directory path
@param {Object} [options={}]
@return {Object} hashes
*/
exports.dirSync = exports.directorySync = function directorySync(dir, options) {
  options || (options = {});

  var hashes = {};

  fs.readdirSync(dir).forEach(function (file) {
    if (options.filterFn && !options.filterFn(file)) { return; }

    var filePath = path.join(dir, file);
    var stat = fs.statSync(filePath);

    if (stat.isFile()) {
      hashes[filePath] = exports.fileSync(filePath, options);
    } else if (stat.isDirectory()) {
      options.nested || (options.nested = 0);
      options.nested += 1;
      hashes = extend(hashes, exports.directorySync(filePath, options));
      options.nested -= 1;
    } else {
      throw new Error('Path is not a file or directory: %s', filePath);
    }
  });

  if (options.relativePaths && !options.nested) {
    hashes = relativePaths(dir, hashes);
  }

  return hashes;
};


/*
Calculate the hashsum of the contents of a file.

@param {String} path file path
@param {Object} [options={}]
@param {Function} cb
  @param {Error|Null} error
  @param {String} hash
*/
exports.file = function file (path, options, cb) {
  exports.stream(fs.createReadStream(path), options, cb);
};


/*
Synchronous version of `file`.

@see `file`
@param {String} path file path
@param {Object} [options={}]
@return {String} hash
*/
exports.fileSync = function fileSync(path, options) {
  return exports.stringSync(fs.readFileSync(path, 'utf8'), options);
};


/*
Calculate a hashsum of a readable stream.

@param {ReadableStream} src source stream
@param {Object} [options={}]
@param {Function} cb
  @param {Error|Null} error
  @param {String} hash
*/
exports.stream = function stream (src, options, cb) {
  if (!cb) {
    cb = options;
    options = {};
  }

  var hash = crypto.createHash(options.algorithm || 'sha1');
  var dest = hash;

  if (hash.write) {
    // streaming crypto (>= v0.9)
    hash.setEncoding('hex');

    src.on('end', function () {
      hash.end();
      cb(null, hash.read());
    });
  } else {
    // pre-streaming crypto (< v0.9)
    dest = new (require('stream').Stream)();

    src.on('data', hash.update.bind(hash));

    src.on('end', function () {
      cb(null, hash.digest('hex'));
    });
  }

  src.on('error', cb);

  src.pipe(dest, {end: false});
};


/*
Calculate the hashsum of a string.

@param {String} str
@param {Object} [options={}]
@param {Function} cb
  @param {Error|Null} error
  @param {String} hash
*/
exports.string = function string (str, options, cb) {
  if (!cb) {
    cb = options;
    options = {};
  }

  nextTick(function () {
    try {
      cb(null, exports.stringSync(str, options));
    } catch (e) {
      cb(e);
    }
  });
};

/*
Synchronous version of `string`.

@see `string`
@param {String} str
@param {Object} [options={}]
@return {String} hash
*/
exports.stringSync = function stringSync (str, options) {
  str = ('' + str) || ('' + str.constructor);
  options || (options = {});

  if (!str.length) {
    throw new Error('Unable to hash zero-length strings.');
  }

  var hash = crypto.createHash(options.algorithm || 'sha1');

  if (hash.write) { // streaming crypto (>= v0.9)
    hash.setEncoding('hex');
    hash.end(str);

    return hash.read();
  } else { // pre-streaming crypto (< v0.9)
    hash.update(str);
    return hash.digest('hex');
  }
};

// -- Utilities --

/*
Extend an object with properties from one or more objects. Properties from later
objects will overwrite properties in earlier objects.

@param {Object} o* one or more objects
@return {Object} extended object
*/
function extend(o) {
  [].slice.call(arguments, 1).forEach(function (mixin) {
    for (var key in mixin) {
      if (mixin.hasOwnProperty(key)) {
        o[key] = mixin[key];
      }
    }
  });

  return o;
}

/*
Rewrite each path in `hashes` to be relative to `root`.

@param {String} root root path
@param {Object} hashes
@return {Object} hashes w/relative paths
*/
function relativePaths(root, hashes) {
  for (var key in hashes) {
    var relPath = path.relative(root, key);

    if (relPath !== key) {
      hashes[relPath] = hashes[key];
      delete hashes[key];
    }
  }

  return hashes;
}
