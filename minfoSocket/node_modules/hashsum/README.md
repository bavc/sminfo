# hashsum

Calculate the hashsum of various things.


# installation

```sh
npm install hashsum
```

# usage

```js
var hashsum = require('hashsum');
```

### hash an arbitrary value

```js
hashsum(value, function (err, hashOrHashes) {
  console.log(hashOrHashes);
});
```

### hash a file's contents

```js
hashsum.file('/path/to/file', function (err, hash) {
  console.log(hash);
});
```

### hash the contents of each file in a directory

```js
hashsum.directory('/path/to/dir', function (err, hashes) {
  for (var path in hashes) {
    console.log(path, hashes[path]);
  }
});
```

### hash a stream

```js
// Create or obtain a stream of some kind...
var src = fs.createReadStream('/path/to/file');

hashsum.stream(src, function (err, hash) {
  console.log(hash);
});
```


# api

Callbacks receive two arguments `(err, hash)`, unless otherwise noted.

All methods accept an optional `options` object with the following properties:

- `algorithm` - hashing algorithm supported by `crypto.createHash`. Default:
`sha1`

Directory-related methods accept additional properties:

- `filterFn` - function used to filter files or directories out of the results.
Receives the file or directory `path` as an argument. Filter functions should
return `true` to retain the path, or `false` to skip it. Default: `undefined`

- `recursive` - whether to descend into child directories. Default: `false`

- `relativePaths` - whether to use relative paths in the `hashes` object.
Default: `false`

Example `filterFn`:

```js
// Skip paths containing an underscore.
function filter(path) {
  return path.indexOf('_') === -1;
}

var options = { recursive: true, filterFn: filter };

hashsum.directory('/path', options, function (err, hashes) {
  console.log(hashes);
});
```


### hashsum(src, [options], cb)

Calculate the hashsum for the given `src`. Internally, `hashsum` will decide the
best hashsum API method to use based on the value of `src`.


If `src` is a stream, `hashsum.stream` will be used.

If `src` is a string, and it is also a path, and a file or directory exists at
that location, `hashsum.file` or `hashsum.directory` will be used.

If it is not a path, or nothing exists at that location, `hashsum.string` will
be used.

If it is any other type, it will be coerced to string via `'' + src` and
`hashsum.string` will be used.

When hashing an object, consider implementing a custom `toString` method on the
object, or prepare the source data ahead of time and use `hashsum.string`
directly.


### hashsumSync(src, [options])

Synchronous version of `hashsum`. Returns the calculated `hash` or `hashes`.

*Note: Streams cannot be hashed synchronously. Use `hashsum` or `hashsum.stream`
instead.*


### hashsum.file(path, [options], cb)

Calculate the hashsum for the given file.

### hashsum.fileSync(path, [options])

Synchronous version of `hashsum.file`. Returns the calculated `hash`.


### hashsum.directory(path, [options], cb)

Calculate the hashsum for each file in a given directory.

The callback receives two arguments `(err, hashes)`. Hashes are collected as an
object that maps filename to hashsum.

This example:

```js
hashsum.directory('/path/to/dir', function (err, hashes) {
  console.log(hashes);
});
```

Might produce this `hashes` object:

```js
{
  '/path/to/dir/index.html': 'de59a86eea5cc70b3d3c8c27d210eb23d5e34873',
  '/path/to/dir/public/css/reset.css': '82bed1345e375f93cadd5494cac046e8ff80ece3',
  ...
}
```

If the `relativePaths` option is `true`, the `hashes` object might look like the
following (when run from the `/path/to/dir` directory):

```js
{
  'index.html': 'de59a86eea5cc70b3d3c8c27d210eb23d5e34873',
  'public/css/reset.css': '82bed1345e375f93cadd5494cac046e8ff80ece3',
  ...
}
```

### hashsum.directorySync(path, [options])

Synchonrous version of `hashsum.directory`. Returns the calculated `hashes`.


### hashsum.string(str, [options], cb)

Calculate the hashsum for the given string.

### hashsum.stringSync(str, [options])

Synchronous version of `hashsum.string`. Returns the calculated `hash`.


### hashsum.stream(src, [options], cb)

Calculate the hashsum for the given stream.


# cli

```sh
npm install -g hashsum
```

```
hashsum [options] <src-1> [...<src-N>]

Options:
  -a, --algorithm      Hashing algorithm to use                [default: "sha1"]
  -e, --filter         RegExp for filtering out unwanted paths
  -f, --format         Output format: text|json                [default: "text"]
  -p, --path           Treat all inputs as paths first, strings second
  -r, --recursive      Recurse into sub-directories
  -t, --relativePaths  Use relative paths in directory output
  -h, --help           Print this help message
  -v, --version        Print version information
```

### notes

On the command line, hashsum's `filter` option is a bit different than the
`filterFn` option of the module. The hashsum module's `filterFn` option takes a
function, whereas the CLI `filter` option is the pattern of a RegExp. That is,
the string `pattern` you would pass to `new RegExp(pattern)`.

When specifying `--format json`, source keys are mapped to hash values. This is
slightly different than `--format text`, which prints hashes before sources.

### examples

```sh
$ hashsum foo
0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33 foo
```

```sh
$ hashsum foo bar baz
0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33 foo
62cdb7020ff920e5aa642c3d4066950dd1f01f4d bar
bbe960a25ea311d21d40669e93df2003ba9b90a2 baz
```

```sh
$ hashsum /path/to/dir -p
de59a86eea5cc70b3d3c8c27d210eb23d5e34873 /path/to/dir/index.js
```

```sh
$ cd /path/to/dir
$ hashsum /path/to/dir -pt
de59a86eea5cc70b3d3c8c27d210eb23d5e34873 index.js
```

```sh
$ hashsum /path/to/dir -pr
de59a86eea5cc70b3d3c8c27d210eb23d5e34873 /path/to/dir/index.js
82bed1345e375f93cadd5494cac046e8ff80ece3 /path/to/dir/node_modules/.bin/jshint
...
```

```sh
$ hashsum /path/to/dir -pr -e node_modules
de59a86eea5cc70b3d3c8c27d210eb23d5e34873 /path/to/dir/index.js
```

```sh
$ cs /path/to/dir
$ hashsum /path/to/dir -prt -f json
{
  "index.js": "de59a86eea5cc70b3d3c8c27d210eb23d5e34873",
  "node_modules/.bin/jshint": "82bed1345e375f93cadd5494cac046e8ff80ece3",
  ...
}
```

```sh
$ hashsum /path/to/dir -pt -a md5
a1b8790319d43ac420fb25f2b6563887 index.js
```

#### stdin

```sh
$ echo -n foo | hashsum
0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33
```

```sh
$ hashsum < /path/to/dir/index.js
de59a86eea5cc70b3d3c8c27d210eb23d5e34873
```
