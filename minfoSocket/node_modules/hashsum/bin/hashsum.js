#!/usr/bin/env node
var crypto = require('crypto');
var optimist = require('optimist');

var hashsum = require('..');

var options = optimist.usage('$0 [options] <src> [<src> ...]')

  .options({
    a: {
      alias: 'algorithm',
      default: 'sha1',
      description: 'Hashing algorithm to use',
      type: 'string'
    },

    e: {
      alias: 'filter',
      description: 'RegExp for filtering out unwanted paths',
      type: 'string'
    },

    f: {
      alias: 'format',
      default: 'text',
      description: 'Output format: text|json',
      type: 'string'
    },

    p: {
      alias: 'path',
      description: 'Treat all inputs as paths first, strings second',
      type: 'boolean'
    },

    r: {
      alias: 'recursive',
      description: 'Recurse into sub-directories',
      type: 'boolean'
    },

    t: {
      alias: 'relativePaths',
      description: 'Use relative paths in directory output',
      type: 'boolean'
    },

    h: {
      alias: 'help',
      description: 'Print this help message',
      type: 'boolean'
    },

    v: {
      alias: 'version',
      description: 'Print version information',
      type: 'boolean'
    }
  }).argv;

if (options.help) {
  exit(optimist.help());
}

if (options.version) {
  exit(require('../package.json').version);
}

if (options.filter) {
  var re = new RegExp(options.filter);

  options.filterFn = function (item) {
    return !re.test(item);
  };
}

var numArgs = options._.length;

if (numArgs) {
  nextArg();
  return;
}

var hash = crypto.createHash(options.algorithm);

if (options.path) {
  readStdin(function (err, input) {
    if (err) { exit(err); }

    hashsum(input, options, function (err, hash) {
      if (err) { exit(err); }

      write(format(hash, options, input));
    });
  });
} else {
  if (hash.write) {
    // streaming crypto (node > 0.9)

    hash.setEncoding('hex');
    process.stdin.pipe(hash).pipe(process.stdout);
  } else {
    // non-streaming crypto (node < 0.9)

    process.stdin.on('data', function (chunk) {
      hash.update(chunk);
    });

    process.stdin.on('end', function () {
      write(format(hash.digest('hex'), options));
    });

    process.stdin.resume();
  }
}

// -- Helper Functions --

function exit(err) {
  err && process.stderr.write(err + '\n');
  process.exit(1);
}

function format(hash, options, input) {
  if (!options.format) {
    return dump();
  }

  switch (options.format) {
  case 'json':
    return JSON.stringify(hash, null, 2);
  case 'text':
    return dump();
  default:
    process.stderr.write('Invalid format: ' + options.format + '\n');
    process.exit(1);
  }

  function dump() {
    if (typeof hash === 'string') {
      return input ? hash + ' ' + input : hash;
    }

    var result = [];

    for (var path in hash) {
      result.push(hash[path] + ' ' + path);
    }

    return result.join('\n');
  }
}

function nextArg(index) {
  index || (index = 0);

  var arg = options._[index];
  var method = options.path ? hashsum : hashsum.string;

  method(arg, options, function (err, hash) {
    if (err) { exit(err); }

    write(format(hash, options, arg));

    if (++index < numArgs) {
      nextArg(index);
    }
  });
}

function readStdin(cb) {
  var buffer = [];

  process.stdin.on('data', function (chunk) {
    buffer.push(chunk);
  });

  process.stdin.on('end', function () {
    cb(null, buffer.join(''));
  });

  process.stdin.on('error', function (err) {
    cb(err);
  });

  process.stdin.resume();
}

function write(str) {
  process.stdout.write(str + '\n');
}
