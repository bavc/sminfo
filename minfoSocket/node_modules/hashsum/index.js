var fs = require('fs');
var Stream = require('stream').Stream;

var hash = require('./lib/hash');

exports = module.exports = hashsum;
exports.sync = hashsumSync;

// Export API methods
for (var key in hash) {
  exports[key] = hash[key];
}

/*
Calculate the hashsum(s) for the given `src` value. Delegates to the appropriate
API method based on `src`'s type and value.

@param {Mixed} src source value
@param {Object} [options={}]
  @param {String} [options.algorithm='sha1'] hashing algorithm to use
  @param {Function} [options.filterFn] A filter function called for each
      directory and file path when processing a directory. The filter function
      takes a single `path` argument, and should return `true` to process the
      path, or `false` to skip it.
  @param {Boolean} [options.recursive=false] Whether to recurse into sub-
      directories.
  @param {Boolean} [options.relativePaths=false] Whether to use relative paths
      in the `hashes` object when processing a directory. If `false`, full paths
      will be used.
@param {Function} cb
  @param {Error|Null} error
  @param {String|Object} hash(es)
*/
function hashsum(src, options, cb) {
  if (!cb) {
    cb = options;
    options = {};
  }

  if (src instanceof Stream) {
    return hash.stream(src, options, cb);
  }

  hashString(src, options, cb);
}

/*
Synchronous version of `hashsum`.

@param {Mixed} src source value
@param {Object} [options={}]
@return {String|Object} hash(es)
*/
function hashsumSync(src, options) {
  options || (options = {});

  if (src instanceof Stream) {
    throw new Error('Streams cannot be hashed synchronously. '+
      'Use `hashsum` or `hashsum.stream` instead.');
  }

  return hashStringSync(src, options);
}


// -- Utility Functions --------------------------------------------------------

/*
Calculate the hashsum for a string `src` value.

If `src` is a path and a file exists at that path, the hashsum of the file's
contents is calculated.

If `src` is a path and a directory exists at that path, the hashsum of the
contents of each file is calculated.

Otherwise, `src` is coerced to a string and its hashsum is calculated.

For best results when calculating the hashsum of an object, you may wish to
implement a custom `toString` method on that object.

@param {String} src source string
@param {Object} [options={}]
@param {Function} cb
  @param {Error|Null} error
  @param {String|Object} hash(es)
*/
function hashString(src, options, cb) {
  src = ('' + src).trim();

  fs.stat(src, function (err, stat) {
    if (err) {
      if (err.code && err.code === 'ENOENT') {
        hash.string(src, options, cb);
      } else {
        cb(err);
      }

      return;
    }

    var method = 'string';

    if (stat.isFile()) {
      method = 'file';
    } else if (stat.isDirectory()) {
      method = 'directory';
    }

    hash[method](src, options, cb);
  });
}

/*
Synchronous version of `hashString`.

@param {String} src source string
@param {Object} [options={}]
@param {Function} cb
  @param {Error|Null} error
  @param {String|Object} hash(es)
*/
function hashStringSync(src, options) {
  src = ('' + src).trim();

  var stat;

  try {
    stat = fs.statSync(src);
  } catch (e) {
    if (e.code && e.code === 'ENOENT') {
      return hash.stringSync(src, options);
    }

    throw e;
  }

  var method = 'stringSync';

  if (stat.isFile()) {
    method = 'fileSync';
  } else if (stat.isDirectory()) {
    method = 'directorySync';
  }

  return hash[method](src, options);
}
