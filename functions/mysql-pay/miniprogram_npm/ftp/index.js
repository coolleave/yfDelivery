module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1735183515666, function(require, module, exports) {
var fs = require('fs'),
    tls = require('tls'),
    zlib = require('zlib'),
    Socket = require('net').Socket,
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    inspect = require('util').inspect;

var Parser = require('./parser');
var XRegExp = require('xregexp').XRegExp;

var REX_TIMEVAL = XRegExp.cache('^(?<year>\\d{4})(?<month>\\d{2})(?<date>\\d{2})(?<hour>\\d{2})(?<minute>\\d{2})(?<second>\\d+)(?:.\\d+)?$'),
    RE_PASV = /([\d]+),([\d]+),([\d]+),([\d]+),([-\d]+),([-\d]+)/,
    RE_EOL = /\r?\n/g,
    RE_WD = /"(.+)"(?: |$)/,
    RE_SYST = /^([^ ]+)(?: |$)/;

var /*TYPE = {
      SYNTAX: 0,
      INFO: 1,
      SOCKETS: 2,
      AUTH: 3,
      UNSPEC: 4,
      FILESYS: 5
    },*/
    RETVAL = {
      PRELIM: 1,
      OK: 2,
      WAITING: 3,
      ERR_TEMP: 4,
      ERR_PERM: 5
    },
    /*ERRORS = {
      421: 'Service not available, closing control connection',
      425: 'Can\'t open data connection',
      426: 'Connection closed; transfer aborted',
      450: 'Requested file action not taken / File unavailable (e.g., file busy)',
      451: 'Requested action aborted: local error in processing',
      452: 'Requested action not taken / Insufficient storage space in system',
      500: 'Syntax error / Command unrecognized',
      501: 'Syntax error in parameters or arguments',
      502: 'Command not implemented',
      503: 'Bad sequence of commands',
      504: 'Command not implemented for that parameter',
      530: 'Not logged in',
      532: 'Need account for storing files',
      550: 'Requested action not taken / File unavailable (e.g., file not found, no access)',
      551: 'Requested action aborted: page type unknown',
      552: 'Requested file action aborted / Exceeded storage allocation (for current directory or dataset)',
      553: 'Requested action not taken / File name not allowed'
    },*/
    bytesNOOP = new Buffer('NOOP\r\n');

var FTP = module.exports = function() {
  if (!(this instanceof FTP))
    return new FTP();

  this._socket = undefined;
  this._pasvSock = undefined;
  this._feat = undefined;
  this._curReq = undefined;
  this._queue = [];
  this._secstate = undefined;
  this._debug = undefined;
  this._keepalive = undefined;
  this._ending = false;
  this._parser = undefined;
  this.options = {
    host: undefined,
    port: undefined,
    user: undefined,
    password: undefined,
    secure: false,
    secureOptions: undefined,
    connTimeout: undefined,
    pasvTimeout: undefined,
    aliveTimeout: undefined
  };
  this.connected = false;
};
inherits(FTP, EventEmitter);

FTP.prototype.connect = function(options) {
  var self = this;
  if (typeof options !== 'object')
    options = {};
  this.connected = false;
  this.options.host = options.host || 'localhost';
  this.options.port = options.port || 21;
  this.options.user = options.user || 'anonymous';
  this.options.password = options.password || 'anonymous@';
  this.options.secure = options.secure || false;
  this.options.secureOptions = options.secureOptions;
  this.options.connTimeout = options.connTimeout || 10000;
  this.options.pasvTimeout = options.pasvTimeout || 10000;
  this.options.aliveTimeout = options.keepalive || 10000;

  if (typeof options.debug === 'function')
    this._debug = options.debug;

  var secureOptions,
      debug = this._debug,
      socket = new Socket();

  socket.setTimeout(0);
  socket.setKeepAlive(true);

  this._parser = new Parser({ debug: debug });
  this._parser.on('response', function(code, text) {
    var retval = code / 100 >> 0;
    if (retval === RETVAL.ERR_TEMP || retval === RETVAL.ERR_PERM) {
      if (self._curReq)
        self._curReq.cb(makeError(code, text), undefined, code);
      else
        self.emit('error', makeError(code, text));
    } else if (self._curReq)
      self._curReq.cb(undefined, text, code);

    // a hack to signal we're waiting for a PASV data connection to complete
    // first before executing any more queued requests ...
    //
    // also: don't forget our current request if we're expecting another
    // terminating response ....
    if (self._curReq && retval !== RETVAL.PRELIM) {
      self._curReq = undefined;
      self._send();
    }

    noopreq.cb();
  });

  if (this.options.secure) {
    secureOptions = {};
    secureOptions.host = this.options.host;
    for (var k in this.options.secureOptions)
      secureOptions[k] = this.options.secureOptions[k];
    secureOptions.socket = socket;
    this.options.secureOptions = secureOptions;
  }

  if (this.options.secure === 'implicit')
    this._socket = tls.connect(secureOptions, onconnect);
  else {
    socket.once('connect', onconnect);
    this._socket = socket;
  }

  var noopreq = {
        cmd: 'NOOP',
        cb: function() {
          clearTimeout(self._keepalive);
          self._keepalive = setTimeout(donoop, self.options.aliveTimeout);
        }
      };

  function donoop() {
    if (!self._socket || !self._socket.writable)
      clearTimeout(self._keepalive);
    else if (!self._curReq && self._queue.length === 0) {
      self._curReq = noopreq;
      debug&&debug('[connection] > NOOP');
      self._socket.write(bytesNOOP);
    } else
      noopreq.cb();
  }

  function onconnect() {
    clearTimeout(timer);
    clearTimeout(self._keepalive);
    self.connected = true;
    self._socket = socket; // re-assign for implicit secure connections

    var cmd;

    if (self._secstate) {
      if (self._secstate === 'upgraded-tls' && self.options.secure === true) {
        cmd = 'PBSZ';
        self._send('PBSZ 0', reentry, true);
      } else {
        cmd = 'USER';
        self._send('USER ' + self.options.user, reentry, true);
      }
    } else {
      self._curReq = {
        cmd: '',
        cb: reentry
      };
    }

    function reentry(err, text, code) {
      if (err && (!cmd || cmd === 'USER' || cmd === 'PASS' || cmd === 'TYPE')) {
        self.emit('error', err);
        return self._socket && self._socket.end();
      }
      if ((cmd === 'AUTH TLS' && code !== 234 && self.options.secure !== true)
          || (cmd === 'AUTH SSL' && code !== 334)
          || (cmd === 'PBSZ' && code !== 200)
          || (cmd === 'PROT' && code !== 200)) {
        self.emit('error', makeError(code, 'Unable to secure connection(s)'));
        return self._socket && self._socket.end();
      }

      if (!cmd) {
        // sometimes the initial greeting can contain useful information
        // about authorized use, other limits, etc.
        self.emit('greeting', text);

        if (self.options.secure && self.options.secure !== 'implicit') {
          cmd = 'AUTH TLS';
          self._send(cmd, reentry, true);
        } else {
          cmd = 'USER';
          self._send('USER ' + self.options.user, reentry, true);
        }
      } else if (cmd === 'USER') {
        if (code !== 230) {
          // password required
          if (!self.options.password) {
            self.emit('error', makeError(code, 'Password required'));
            return self._socket && self._socket.end();
          }
          cmd = 'PASS';
          self._send('PASS ' + self.options.password, reentry, true);
        } else {
          // no password required
          cmd = 'PASS';
          reentry(undefined, text, code);
        }
      } else if (cmd === 'PASS') {
        cmd = 'FEAT';
        self._send(cmd, reentry, true);
      } else if (cmd === 'FEAT') {
        if (!err)
          self._feat = Parser.parseFeat(text);
        cmd = 'TYPE';
        self._send('TYPE I', reentry, true);
      } else if (cmd === 'TYPE')
        self.emit('ready');
      else if (cmd === 'PBSZ') {
        cmd = 'PROT';
        self._send('PROT P', reentry, true);
      } else if (cmd === 'PROT') {
        cmd = 'USER';
        self._send('USER ' + self.options.user, reentry, true);
      } else if (cmd.substr(0, 4) === 'AUTH') {
        if (cmd === 'AUTH TLS' && code !== 234) {
          cmd = 'AUTH SSL';
          return self._send(cmd, reentry, true);
        } else if (cmd === 'AUTH TLS')
          self._secstate = 'upgraded-tls';
        else if (cmd === 'AUTH SSL')
          self._secstate = 'upgraded-ssl';
        socket.removeAllListeners('data');
        socket.removeAllListeners('error');
        socket._decoder = null;
        self._curReq = null; // prevent queue from being processed during
                             // TLS/SSL negotiation
        secureOptions.socket = self._socket;
        secureOptions.session = undefined;
        socket = tls.connect(secureOptions, onconnect);
        socket.setEncoding('binary');
        socket.on('data', ondata);
        socket.once('end', onend);
        socket.on('error', onerror);
      }
    }
  }

  socket.on('data', ondata);
  function ondata(chunk) {
    debug&&debug('[connection] < ' + inspect(chunk.toString('binary')));
    if (self._parser)
      self._parser.write(chunk);
  }

  socket.on('error', onerror);
  function onerror(err) {
    clearTimeout(timer);
    clearTimeout(self._keepalive);
    self.emit('error', err);
  }

  socket.once('end', onend);
  function onend() {
    ondone();
    self.emit('end');
  }

  socket.once('close', function(had_err) {
    ondone();
    self.emit('close', had_err);
  });

  var hasReset = false;
  function ondone() {
    if (!hasReset) {
      hasReset = true;
      clearTimeout(timer);
      self._reset();
    }
  }

  var timer = setTimeout(function() {
    self.emit('error', new Error('Timeout while connecting to server'));
    self._socket && self._socket.destroy();
    self._reset();
  }, this.options.connTimeout);

  this._socket.connect(this.options.port, this.options.host);
};

FTP.prototype.end = function() {
  if (this._queue.length)
    this._ending = true;
  else
    this._reset();
};

FTP.prototype.destroy = function() {
  this._reset();
};

// "Standard" (RFC 959) commands
FTP.prototype.ascii = function(cb) {
  return this._send('TYPE A', cb);
};

FTP.prototype.binary = function(cb) {
  return this._send('TYPE I', cb);
};

FTP.prototype.abort = function(immediate, cb) {
  if (typeof immediate === 'function') {
    cb = immediate;
    immediate = true;
  }
  if (immediate)
    this._send('ABOR', cb, true);
  else
    this._send('ABOR', cb);
};

FTP.prototype.cwd = function(path, cb, promote) {
  this._send('CWD ' + path, function(err, text, code) {
    if (err)
      return cb(err);
    var m = RE_WD.exec(text);
    cb(undefined, m ? m[1] : undefined);
  }, promote);
};

FTP.prototype.delete = function(path, cb) {
  this._send('DELE ' + path, cb);
};

FTP.prototype.site = function(cmd, cb) {
  this._send('SITE ' + cmd, cb);
};

FTP.prototype.status = function(cb) {
  this._send('STAT', cb);
};

FTP.prototype.rename = function(from, to, cb) {
  var self = this;
  this._send('RNFR ' + from, function(err) {
    if (err)
      return cb(err);

    self._send('RNTO ' + to, cb, true);
  });
};

FTP.prototype.logout = function(cb) {
  this._send('QUIT', cb);
};

FTP.prototype.listSafe = function(path, zcomp, cb) {
  if (typeof path === 'string') {
    var self = this;
    // store current path
    this.pwd(function(err, origpath) {
      if (err) return cb(err);
      // change to destination path
      self.cwd(path, function(err) {
        if (err) return cb(err);
        // get dir listing
        self.list(zcomp || false, function(err, list) {
          // change back to original path
          if (err) return self.cwd(origpath, cb);
          self.cwd(origpath, function(err) {
            if (err) return cb(err);
            cb(err, list);
          });
        });
      });
    });
  } else
    this.list(path, zcomp, cb);
};

FTP.prototype.list = function(path, zcomp, cb) {
  var self = this, cmd;

  if (typeof path === 'function') {
    // list(function() {})
    cb = path;
    path = undefined;
    cmd = 'LIST';
    zcomp = false;
  } else if (typeof path === 'boolean') {
    // list(true, function() {})
    cb = zcomp;
    zcomp = path;
    path = undefined;
    cmd = 'LIST';
  } else if (typeof zcomp === 'function') {
    // list('/foo', function() {})
    cb = zcomp;
    cmd = 'LIST ' + path;
    zcomp = false;
  } else
    cmd = 'LIST ' + path;

  this._pasv(function(err, sock) {
    if (err)
      return cb(err);

    if (self._queue[0] && self._queue[0].cmd === 'ABOR') {
      sock.destroy();
      return cb();
    }

    var sockerr, done = false, replies = 0, entries, buffer = '', source = sock;

    if (zcomp) {
      source = zlib.createInflate();
      sock.pipe(source);
    }

    source.on('data', function(chunk) { buffer += chunk.toString('binary'); });
    source.once('error', function(err) {
      if (!sock.aborting)
        sockerr = err;
    });
    source.once('end', ondone);
    source.once('close', ondone);

    function ondone() {
      done = true;
      final();
    }
    function final() {
      if (done && replies === 2) {
        replies = 3;
        if (sockerr)
          return cb(new Error('Unexpected data connection error: ' + sockerr));
        if (sock.aborting)
          return cb();

        // process received data
        entries = buffer.split(RE_EOL);
        entries.pop(); // ending EOL
        var parsed = [];
        for (var i = 0, len = entries.length; i < len; ++i) {
          var parsedVal = Parser.parseListEntry(entries[i]);
          if (parsedVal !== null)
            parsed.push(parsedVal);
        }

        if (zcomp) {
          self._send('MODE S', function() {
            cb(undefined, parsed);
          }, true);
        } else
          cb(undefined, parsed);
      }
    }

    if (zcomp) {
      self._send('MODE Z', function(err, text, code) {
        if (err) {
          sock.destroy();
          return cb(makeError(code, 'Compression not supported'));
        }
        sendList();
      }, true);
    } else
      sendList();

    function sendList() {
      // this callback will be executed multiple times, the first is when server
      // replies with 150 and then a final reply to indicate whether the
      // transfer was actually a success or not
      self._send(cmd, function(err, text, code) {
        if (err) {
          sock.destroy();
          if (zcomp) {
            self._send('MODE S', function() {
              cb(err);
            }, true);
          } else
            cb(err);
          return;
        }

        // some servers may not open a data connection for empty directories
        if (++replies === 1 && code === 226) {
          replies = 2;
          sock.destroy();
          final();
        } else if (replies === 2)
          final();
      }, true);
    }
  });
};

FTP.prototype.get = function(path, zcomp, cb) {
  var self = this;
  if (typeof zcomp === 'function') {
    cb = zcomp;
    zcomp = false;
  }

  this._pasv(function(err, sock) {
    if (err)
      return cb(err);

    if (self._queue[0] && self._queue[0].cmd === 'ABOR') {
      sock.destroy();
      return cb();
    }

    // modify behavior of socket events so that we can emit 'error' once for
    // either a TCP-level error OR an FTP-level error response that we get when
    // the socket is closed (e.g. the server ran out of space).
    var sockerr, started = false, lastreply = false, done = false,
        source = sock;

    if (zcomp) {
      source = zlib.createInflate();
      sock.pipe(source);
      sock._emit = sock.emit;
      sock.emit = function(ev, arg1) {
        if (ev === 'error') {
          if (!sockerr)
            sockerr = arg1;
          return;
        }
        sock._emit.apply(sock, Array.prototype.slice.call(arguments));
      };
    }

    source._emit = source.emit;
    source.emit = function(ev, arg1) {
      if (ev === 'error') {
        if (!sockerr)
          sockerr = arg1;
        return;
      } else if (ev === 'end' || ev === 'close') {
        if (!done) {
          done = true;
          ondone();
        }
        return;
      }
      source._emit.apply(source, Array.prototype.slice.call(arguments));
    };

    function ondone() {
      if (done && lastreply) {
        self._send('MODE S', function() {
          source._emit('end');
          source._emit('close');
        }, true);
      }
    }

    sock.pause();

    if (zcomp) {
      self._send('MODE Z', function(err, text, code) {
        if (err) {
          sock.destroy();
          return cb(makeError(code, 'Compression not supported'));
        }
        sendRetr();
      }, true);
    } else
      sendRetr();

    function sendRetr() {
      // this callback will be executed multiple times, the first is when server
      // replies with 150, then a final reply after the data connection closes
      // to indicate whether the transfer was actually a success or not
      self._send('RETR ' + path, function(err, text, code) {
        if (sockerr || err) {
          sock.destroy();
          if (!started) {
            if (zcomp) {
              self._send('MODE S', function() {
                cb(sockerr || err);
              }, true);
            } else
              cb(sockerr || err);
          } else {
            source._emit('error', sockerr || err);
            source._emit('close', true);
          }
          return;
        }
        // server returns 125 when data connection is already open; we treat it
        // just like a 150
        if (code === 150 || code === 125) {
          started = true;
          cb(undefined, source);
          sock.resume();
        } else {
          lastreply = true;
          ondone();
        }
      }, true);
    }
  });
};

FTP.prototype.put = function(input, path, zcomp, cb) {
  this._store('STOR ' + path, input, zcomp, cb);
};

FTP.prototype.append = function(input, path, zcomp, cb) {
  this._store('APPE ' + path, input, zcomp, cb);
};

FTP.prototype.pwd = function(cb) { // PWD is optional
  var self = this;
  this._send('PWD', function(err, text, code) {
    if (code === 502) {
      return self.cwd('.', function(cwderr, cwd) {
        if (cwderr)
          return cb(cwderr);
        if (cwd === undefined)
          cb(err);
        else
          cb(undefined, cwd);
      }, true);
    } else if (err)
      return cb(err);
    cb(undefined, RE_WD.exec(text)[1]);
  });
};

FTP.prototype.cdup = function(cb) { // CDUP is optional
  var self = this;
  this._send('CDUP', function(err, text, code) {
    if (code === 502)
      self.cwd('..', cb, true);
    else
      cb(err);
  });
};

FTP.prototype.mkdir = function(path, recursive, cb) { // MKD is optional
  if (typeof recursive === 'function') {
    cb = recursive;
    recursive = false;
  }
  if (!recursive)
    this._send('MKD ' + path, cb);
  else {
    var self = this, owd, abs, dirs, dirslen, i = -1, searching = true;

    abs = (path[0] === '/');

    var nextDir = function() {
      if (++i === dirslen) {
        // return to original working directory
        return self._send('CWD ' + owd, cb, true);
      }
      if (searching) {
        self._send('CWD ' + dirs[i], function(err, text, code) {
          if (code === 550) {
            searching = false;
            --i;
          } else if (err) {
            // return to original working directory
            return self._send('CWD ' + owd, function() {
              cb(err);
            }, true);
          }
          nextDir();
        }, true);
      } else {
        self._send('MKD ' + dirs[i], function(err, text, code) {
          if (err) {
            // return to original working directory
            return self._send('CWD ' + owd, function() {
              cb(err);
            }, true);
          }
          self._send('CWD ' + dirs[i], nextDir, true);
        }, true);
      }
    };
    this.pwd(function(err, cwd) {
      if (err)
        return cb(err);
      owd = cwd;
      if (abs)
        path = path.substr(1);
      if (path[path.length - 1] === '/')
        path = path.substring(0, path.length - 1);
      dirs = path.split('/');
      dirslen = dirs.length;
      if (abs)
        self._send('CWD /', function(err) {
          if (err)
            return cb(err);
          nextDir();
        }, true);
      else
        nextDir();
    });
  }
};

FTP.prototype.rmdir = function(path, recursive, cb) { // RMD is optional
  if (typeof recursive === 'function') {
    cb = recursive;
    recursive = false;
  }
  if (!recursive) {
    return this._send('RMD ' + path, cb);
  }
  
  var self = this;
  this.list(path, function(err, list) {
    if (err) return cb(err);
    var idx = 0;
    
    // this function will be called once per listing entry
    var deleteNextEntry;
    deleteNextEntry = function(err) {
      if (err) return cb(err);
      if (idx >= list.length) {
        if (list[0] && list[0].name === path) {
          return cb(null);
        } else {
          return self.rmdir(path, cb);
        }
      }
      
      var entry = list[idx++];
      
      // get the path to the file
      var subpath = null;
      if (entry.name[0] === '/') {
        // this will be the case when you call deleteRecursively() and pass
        // the path to a plain file
        subpath = entry.name;
      } else {
        if (path[path.length - 1] == '/') {
          subpath = path + entry.name;
        } else {
          subpath = path + '/' + entry.name
        }
      }
      
      // delete the entry (recursively) according to its type
      if (entry.type === 'd') {
        if (entry.name === "." || entry.name === "..") {
          return deleteNextEntry();
        }
        self.rmdir(subpath, true, deleteNextEntry);
      } else {
        self.delete(subpath, deleteNextEntry);
      }
    }
    deleteNextEntry();
  });
};

FTP.prototype.system = function(cb) { // SYST is optional
  this._send('SYST', function(err, text) {
    if (err)
      return cb(err);
    cb(undefined, RE_SYST.exec(text)[1]);
  });
};

// "Extended" (RFC 3659) commands
FTP.prototype.size = function(path, cb) {
  var self = this;
  this._send('SIZE ' + path, function(err, text, code) {
    if (code === 502) {
      // Note: this may cause a problem as list() is _appended_ to the queue
      return self.list(path, function(err, list) {
        if (err)
          return cb(err);
        if (list.length === 1)
          cb(undefined, list[0].size);
        else {
          // path could have been a directory and we got a listing of its
          // contents, but here we echo the behavior of the real SIZE and
          // return 'File not found' for directories
          cb(new Error('File not found'));
        }
      }, true);
    } else if (err)
      return cb(err);
    cb(undefined, parseInt(text, 10));
  });
};

FTP.prototype.lastMod = function(path, cb) {
  var self = this;
  this._send('MDTM ' + path, function(err, text, code) {
    if (code === 502) {
      return self.list(path, function(err, list) {
        if (err)
          return cb(err);
        if (list.length === 1)
          cb(undefined, list[0].date);
        else
          cb(new Error('File not found'));
      }, true);
    } else if (err)
      return cb(err);
    var val = XRegExp.exec(text, REX_TIMEVAL), ret;
    if (!val)
      return cb(new Error('Invalid date/time format from server'));
    ret = new Date(val.year + '-' + val.month + '-' + val.date + 'T' + val.hour
                   + ':' + val.minute + ':' + val.second);
    cb(undefined, ret);
  });
};

FTP.prototype.restart = function(offset, cb) {
  this._send('REST ' + offset, cb);
};



// Private/Internal methods
FTP.prototype._pasv = function(cb) {
  var self = this, first = true, ip, port;
  this._send('PASV', function reentry(err, text) {
    if (err)
      return cb(err);

    self._curReq = undefined;

    if (first) {
      var m = RE_PASV.exec(text);
      if (!m)
        return cb(new Error('Unable to parse PASV server response'));
      ip = m[1];
      ip += '.';
      ip += m[2];
      ip += '.';
      ip += m[3];
      ip += '.';
      ip += m[4];
      port = (parseInt(m[5], 10) * 256) + parseInt(m[6], 10);

      first = false;
    }
    self._pasvConnect(ip, port, function(err, sock) {
      if (err) {
        // try the IP of the control connection if the server was somehow
        // misconfigured and gave for example a LAN IP instead of WAN IP over
        // the Internet
        if (self._socket && ip !== self._socket.remoteAddress) {
          ip = self._socket.remoteAddress;
          return reentry();
        }

        // automatically abort PASV mode
        self._send('ABOR', function() {
          cb(err);
          self._send();
        }, true);

        return;
      }
      cb(undefined, sock);
      self._send();
    });
  });
};

FTP.prototype._pasvConnect = function(ip, port, cb) {
  var self = this,
      socket = new Socket(),
      sockerr,
      timedOut = false,
      timer = setTimeout(function() {
        timedOut = true;
        socket.destroy();
        cb(new Error('Timed out while making data connection'));
      }, this.options.pasvTimeout);

  socket.setTimeout(0);

  socket.once('connect', function() {
    self._debug&&self._debug('[connection] PASV socket connected');
    if (self.options.secure === true) {
      self.options.secureOptions.socket = socket;
      self.options.secureOptions.session = self._socket.getSession();
      //socket.removeAllListeners('error');
      socket = tls.connect(self.options.secureOptions);
      //socket.once('error', onerror);
      socket.setTimeout(0);
    }
    clearTimeout(timer);
    self._pasvSocket = socket;
    cb(undefined, socket);
  });
  socket.once('error', onerror);
  function onerror(err) {
    sockerr = err;
  }
  socket.once('end', function() {
    clearTimeout(timer);
  });
  socket.once('close', function(had_err) {
    clearTimeout(timer);
    if (!self._pasvSocket && !timedOut) {
      var errmsg = 'Unable to make data connection';
      if (sockerr) {
        errmsg += '( ' + sockerr + ')';
        sockerr = undefined;
      }
      cb(new Error(errmsg));
    }
    self._pasvSocket = undefined;
  });

  socket.connect(port, ip);
};

FTP.prototype._store = function(cmd, input, zcomp, cb) {
  var isBuffer = Buffer.isBuffer(input);

  if (!isBuffer && input.pause !== undefined)
    input.pause();

  if (typeof zcomp === 'function') {
    cb = zcomp;
    zcomp = false;
  }

  var self = this;
  this._pasv(function(err, sock) {
    if (err)
      return cb(err);

    if (self._queue[0] && self._queue[0].cmd === 'ABOR') {
      sock.destroy();
      return cb();
    }

    var sockerr, dest = sock;
    sock.once('error', function(err) {
      sockerr = err;
    });

    if (zcomp) {
      self._send('MODE Z', function(err, text, code) {
        if (err) {
          sock.destroy();
          return cb(makeError(code, 'Compression not supported'));
        }
        // draft-preston-ftpext-deflate-04 says min of 8 should be supported
        dest = zlib.createDeflate({ level: 8 });
        dest.pipe(sock);
        sendStore();
      }, true);
    } else
      sendStore();

    function sendStore() {
      // this callback will be executed multiple times, the first is when server
      // replies with 150, then a final reply after the data connection closes
      // to indicate whether the transfer was actually a success or not
      self._send(cmd, function(err, text, code) {
        if (sockerr || err) {
          if (zcomp) {
            self._send('MODE S', function() {
              cb(sockerr || err);
            }, true);
          } else
            cb(sockerr || err);
          return;
        }

        if (code === 150 || code === 125) {
          if (isBuffer)
            dest.end(input);
          else if (typeof input === 'string') {
            // check if input is a file path or just string data to store
            fs.stat(input, function(err, stats) {
              if (err)
                dest.end(input);
              else
                fs.createReadStream(input).pipe(dest);
            });
          } else {
            input.pipe(dest);
            input.resume();
          }
        } else {
          if (zcomp)
            self._send('MODE S', cb, true);
          else
            cb();
        }
      }, true);
    }
  });
};

FTP.prototype._send = function(cmd, cb, promote) {
  clearTimeout(this._keepalive);
  if (cmd !== undefined) {
    if (promote)
      this._queue.unshift({ cmd: cmd, cb: cb });
    else
      this._queue.push({ cmd: cmd, cb: cb });
  }
  var queueLen = this._queue.length;
  if (!this._curReq && queueLen && this._socket && this._socket.readable) {
    this._curReq = this._queue.shift();
    if (this._curReq.cmd === 'ABOR' && this._pasvSocket)
      this._pasvSocket.aborting = true;
    this._debug&&this._debug('[connection] > ' + inspect(this._curReq.cmd));
    this._socket.write(this._curReq.cmd + '\r\n');
  } else if (!this._curReq && !queueLen && this._ending)
    this._reset();
};

FTP.prototype._reset = function() {
  if (this._pasvSock && this._pasvSock.writable)
    this._pasvSock.end();
  if (this._socket && this._socket.writable)
    this._socket.end();
  this._socket = undefined;
  this._pasvSock = undefined;
  this._feat = undefined;
  this._curReq = undefined;
  this._secstate = undefined;
  clearTimeout(this._keepalive);
  this._keepalive = undefined;
  this._queue = [];
  this._ending = false;
  this._parser = undefined;
  this.options.host = this.options.port = this.options.user
                    = this.options.password = this.options.secure
                    = this.options.connTimeout = this.options.pasvTimeout
                    = this.options.keepalive = this._debug = undefined;
  this.connected = false;
};

// Utility functions
function makeError(code, text) {
  var err = new Error(text);
  err.code = code;
  return err;
}

}, function(modId) {var map = {"./parser":1735183515667}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1735183515667, function(require, module, exports) {
var WritableStream = require('stream').Writable
                     || require('readable-stream').Writable,
    inherits = require('util').inherits,
    inspect = require('util').inspect;

var XRegExp = require('xregexp').XRegExp;

var REX_LISTUNIX = XRegExp.cache('^(?<type>[\\-ld])(?<permission>([\\-r][\\-w][\\-xstT]){3})(?<acl>(\\+))?\\s+(?<inodes>\\d+)\\s+(?<owner>\\S+)\\s+(?<group>\\S+)\\s+(?<size>\\d+)\\s+(?<timestamp>((?<month1>\\w{3})\\s+(?<date1>\\d{1,2})\\s+(?<hour>\\d{1,2}):(?<minute>\\d{2}))|((?<month2>\\w{3})\\s+(?<date2>\\d{1,2})\\s+(?<year>\\d{4})))\\s+(?<name>.+)$'),
    REX_LISTMSDOS = XRegExp.cache('^(?<month>\\d{2})(?:\\-|\\/)(?<date>\\d{2})(?:\\-|\\/)(?<year>\\d{2,4})\\s+(?<hour>\\d{2}):(?<minute>\\d{2})\\s{0,1}(?<ampm>[AaMmPp]{1,2})\\s+(?:(?<size>\\d+)|(?<isdir>\\<DIR\\>))\\s+(?<name>.+)$'),
    RE_ENTRY_TOTAL = /^total/,
    RE_RES_END = /(?:^|\r?\n)(\d{3}) [^\r\n]*\r?\n/,
    RE_EOL = /\r?\n/g,
    RE_DASH = /\-/g;

var MONTHS = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };

function Parser(options) {
  if (!(this instanceof Parser))
    return new Parser(options);
  WritableStream.call(this);

  this._buffer = '';
  this._debug = options.debug;
}
inherits(Parser, WritableStream);

Parser.prototype._write = function(chunk, encoding, cb) {
  var m, code, reRmLeadCode, rest = '', debug = this._debug;

  this._buffer += chunk.toString('binary');

  while (m = RE_RES_END.exec(this._buffer)) {
    // support multiple terminating responses in the buffer
    rest = this._buffer.substring(m.index + m[0].length);
    if (rest.length)
      this._buffer = this._buffer.substring(0, m.index + m[0].length);

    debug&&debug('[parser] < ' + inspect(this._buffer));

    // we have a terminating response line
    code = parseInt(m[1], 10);

    // RFC 959 does not require each line in a multi-line response to begin
    // with '<code>-', but many servers will do this.
    //
    // remove this leading '<code>-' (or '<code> ' from last line) from each
    // line in the response ...
    reRmLeadCode = '(^|\\r?\\n)';
    reRmLeadCode += m[1];
    reRmLeadCode += '(?: |\\-)';
    reRmLeadCode = new RegExp(reRmLeadCode, 'g');
    var text = this._buffer.replace(reRmLeadCode, '$1').trim();
    this._buffer = rest;

    debug&&debug('[parser] Response: code=' + code + ', buffer=' + inspect(text));
    this.emit('response', code, text);
  }

  cb();
};

Parser.parseFeat = function(text) {
  var lines = text.split(RE_EOL);
  lines.shift(); // initial response line
  lines.pop(); // final response line

  for (var i = 0, len = lines.length; i < len; ++i)
    lines[i] = lines[i].trim();

  // just return the raw lines for now
  return lines;
};

Parser.parseListEntry = function(line) {
  var ret,
      info,
      month, day, year,
      hour, mins;

  if (ret = XRegExp.exec(line, REX_LISTUNIX)) {
    info = {
      type: ret.type,
      name: undefined,
      target: undefined,
      sticky: false,
      rights: {
        user: ret.permission.substr(0, 3).replace(RE_DASH, ''),
        group: ret.permission.substr(3, 3).replace(RE_DASH, ''),
        other: ret.permission.substr(6, 3).replace(RE_DASH, '')
      },
      acl: (ret.acl === '+'),
      owner: ret.owner,
      group: ret.group,
      size: parseInt(ret.size, 10),
      date: undefined
    };

    // check for sticky bit
    var lastbit = info.rights.other.slice(-1);
    if (lastbit === 't') {
      info.rights.other = info.rights.other.slice(0, -1) + 'x';
      info.sticky = true;
    } else if (lastbit === 'T') {
      info.rights.other = info.rights.other.slice(0, -1);
      info.sticky = true;
    }

    if (ret.month1 !== undefined) {
      month = parseInt(MONTHS[ret.month1.toLowerCase()], 10);
      day = parseInt(ret.date1, 10);
      year = (new Date()).getFullYear();
      hour = parseInt(ret.hour, 10);
      mins = parseInt(ret.minute, 10);
      if (month < 10)
        month = '0' + month;
      if (day < 10)
        day = '0' + day;
      if (hour < 10)
        hour = '0' + hour;
      if (mins < 10)
        mins = '0' + mins;
      info.date = new Date(year + '-'
                           + month + '-'
                           + day + 'T'
                           + hour + ':'
                           + mins);
      // If the date is in the past but no more than 6 months old, year
      // isn't displayed and doesn't have to be the current year.
      // 
      // If the date is in the future (less than an hour from now), year
      // isn't displayed and doesn't have to be the current year.
      // That second case is much more rare than the first and less annoying.
      // It's impossible to fix without knowing about the server's timezone,
      // so we just don't do anything about it.
      // 
      // If we're here with a time that is more than 28 hours into the
      // future (1 hour + maximum timezone offset which is 27 hours),
      // there is a problem -- we should be in the second conditional block
      if (info.date.getTime() - Date.now() > 100800000) {
        info.date = new Date((year - 1) + '-'
                             + month + '-'
                             + day + 'T'
                             + hour + ':'
                             + mins);
      }

      // If we're here with a time that is more than 6 months old, there's
      // a problem as well.
      // Maybe local & remote servers aren't on the same timezone (with remote
      // ahead of local)
      // For instance, remote is in 2014 while local is still in 2013. In
      // this case, a date like 01/01/13 02:23 could be detected instead of
      // 01/01/14 02:23 
      // Our trigger point will be 3600*24*31*6 (since we already use 31
      // as an upper bound, no need to add the 27 hours timezone offset)
      if (Date.now() - info.date.getTime() > 16070400000) {
        info.date = new Date((year + 1) + '-'
                             + month + '-'
                             + day + 'T'
                             + hour + ':'
                             + mins);
      }
    } else if (ret.month2 !== undefined) {
      month = parseInt(MONTHS[ret.month2.toLowerCase()], 10);
      day = parseInt(ret.date2, 10);
      year = parseInt(ret.year, 10);
      if (month < 10)
        month = '0' + month;
      if (day < 10)
        day = '0' + day;
      info.date = new Date(year + '-' + month + '-' + day);
    }
    if (ret.type === 'l') {
      var pos = ret.name.indexOf(' -> ');
      info.name = ret.name.substring(0, pos);
      info.target = ret.name.substring(pos+4);
    } else
      info.name = ret.name;
    ret = info;
  } else if (ret = XRegExp.exec(line, REX_LISTMSDOS)) {
    info = {
      name: ret.name,
      type: (ret.isdir ? 'd' : '-'),
      size: (ret.isdir ? 0 : parseInt(ret.size, 10)),
      date: undefined,
    };
    month = parseInt(ret.month, 10),
    day = parseInt(ret.date, 10),
    year = parseInt(ret.year, 10),
    hour = parseInt(ret.hour, 10),
    mins = parseInt(ret.minute, 10);

    if (year < 70)
      year += 2000;
    else
      year += 1900;

    if (ret.ampm[0].toLowerCase() === 'p' && hour < 12)
      hour += 12;
    else if (ret.ampm[0].toLowerCase() === 'a' && hour === 12)
      hour = 0;

    info.date = new Date(year, month - 1, day, hour, mins);

    ret = info;
  } else if (!RE_ENTRY_TOTAL.test(line))
    ret = line; // could not parse, so at least give the end user a chance to
                // look at the raw listing themselves

  return ret;
};

module.exports = Parser;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1735183515666);
})()
//miniprogram-npm-outsideDeps=["fs","tls","zlib","net","events","util","xregexp","stream","readable-stream"]
//# sourceMappingURL=index.js.map