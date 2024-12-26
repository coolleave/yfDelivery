module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1735183515741, function(require, module, exports) {
// Generated by CoffeeScript 1.10.0
(function() {
  var Netmask, ip2long, long2ip;

  long2ip = function(long) {
    var a, b, c, d;
    a = (long & (0xff << 24)) >>> 24;
    b = (long & (0xff << 16)) >>> 16;
    c = (long & (0xff << 8)) >>> 8;
    d = long & 0xff;
    return [a, b, c, d].join('.');
  };

  ip2long = function(ip) {
    var b, byte, i, j, len;
    b = (ip + '').split('.');
    if (b.length === 0 || b.length > 4) {
      throw new Error('Invalid IP');
    }
    for (i = j = 0, len = b.length; j < len; i = ++j) {
      byte = b[i];
      if (isNaN(parseInt(byte, 10))) {
        throw new Error("Invalid byte: " + byte);
      }
      if (byte < 0 || byte > 255) {
        throw new Error("Invalid byte: " + byte);
      }
    }
    return ((b[0] || 0) << 24 | (b[1] || 0) << 16 | (b[2] || 0) << 8 | (b[3] || 0)) >>> 0;
  };

  Netmask = (function() {
    function Netmask(net, mask) {
      var error, error1, error2, i, j, ref;
      if (typeof net !== 'string') {
        throw new Error("Missing `net' parameter");
      }
      if (!mask) {
        ref = net.split('/', 2), net = ref[0], mask = ref[1];
      }
      if (!mask) {
        switch (net.split('.').length) {
          case 1:
            mask = 8;
            break;
          case 2:
            mask = 16;
            break;
          case 3:
            mask = 24;
            break;
          case 4:
            mask = 32;
            break;
          default:
            throw new Error("Invalid net address: " + net);
        }
      }
      if (typeof mask === 'string' && mask.indexOf('.') > -1) {
        try {
          this.maskLong = ip2long(mask);
        } catch (error1) {
          error = error1;
          throw new Error("Invalid mask: " + mask);
        }
        for (i = j = 32; j >= 0; i = --j) {
          if (this.maskLong === (0xffffffff << (32 - i)) >>> 0) {
            this.bitmask = i;
            break;
          }
        }
      } else if (mask) {
        this.bitmask = parseInt(mask, 10);
        this.maskLong = 0;
        if (this.bitmask > 0) {
          this.maskLong = (0xffffffff << (32 - this.bitmask)) >>> 0;
        }
      } else {
        throw new Error("Invalid mask: empty");
      }
      try {
        this.netLong = (ip2long(net) & this.maskLong) >>> 0;
      } catch (error2) {
        error = error2;
        throw new Error("Invalid net address: " + net);
      }
      if (!(this.bitmask <= 32)) {
        throw new Error("Invalid mask for ip4: " + mask);
      }
      this.size = Math.pow(2, 32 - this.bitmask);
      this.base = long2ip(this.netLong);
      this.mask = long2ip(this.maskLong);
      this.hostmask = long2ip(~this.maskLong);
      this.first = this.bitmask <= 30 ? long2ip(this.netLong + 1) : this.base;
      this.last = this.bitmask <= 30 ? long2ip(this.netLong + this.size - 2) : long2ip(this.netLong + this.size - 1);
      this.broadcast = this.bitmask <= 30 ? long2ip(this.netLong + this.size - 1) : void 0;
    }

    Netmask.prototype.contains = function(ip) {
      if (typeof ip === 'string' && (ip.indexOf('/') > 0 || ip.split('.').length !== 4)) {
        ip = new Netmask(ip);
      }
      if (ip instanceof Netmask) {
        return this.contains(ip.base) && this.contains(ip.broadcast || ip.last);
      } else {
        return (ip2long(ip) & this.maskLong) >>> 0 === (this.netLong & this.maskLong) >>> 0;
      }
    };

    Netmask.prototype.next = function(count) {
      if (count == null) {
        count = 1;
      }
      return new Netmask(long2ip(this.netLong + (this.size * count)), this.mask);
    };

    Netmask.prototype.forEach = function(fn) {
      var index, j, k, len, long, range, ref, ref1, results, results1;
      range = (function() {
        results = [];
        for (var j = ref = ip2long(this.first), ref1 = ip2long(this.last); ref <= ref1 ? j <= ref1 : j >= ref1; ref <= ref1 ? j++ : j--){ results.push(j); }
        return results;
      }).apply(this);
      results1 = [];
      for (index = k = 0, len = range.length; k < len; index = ++k) {
        long = range[index];
        results1.push(fn(long2ip(long), long, index));
      }
      return results1;
    };

    Netmask.prototype.toString = function() {
      return this.base + "/" + this.bitmask;
    };

    return Netmask;

  })();

  exports.ip2long = ip2long;

  exports.long2ip = long2ip;

  exports.Netmask = Netmask;

}).call(this);

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1735183515741);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map