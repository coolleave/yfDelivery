module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1735183514993, function(require, module, exports) {


module.exports = {
    highlight: require('./lib/highlight')
  , highlightFile: require('./lib/highlightFile')
  , highlightFileSync: require('./lib/highlightFileSync')
}

}, function(modId) {var map = {"./lib/highlight":1735183514994,"./lib/highlightFile":1735183514996,"./lib/highlightFileSync":1735183514997}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1735183514994, function(require, module, exports) {


var redeyed =  require('redeyed')
var theme   =  require('../themes/default')
var colors  =  require('ansicolors')

var colorSurround =  colors.brightBlack
var surroundClose =  '\u001b[39m'

function trimEmptyLines(lines) {
  // remove lines from the end until we find a non-empy one
  var line = lines.pop()
  while (!line || !line.length)    {
 line = lines.pop()
}

  // put the non-empty line back
  if (line) lines.push(line)
}

function addLinenos(highlightedCode, firstline) {
  var highlightedLines = highlightedCode.split('\n')

  trimEmptyLines(highlightedLines)

  var linesLen = highlightedLines.length
  var lines = []
  var totalDigits
  var lineno

  function getDigits(n) {
    if (n < 10) return 1
    if (n < 100) return 2
    if (n < 1000) return 3
    if (n < 10000) return 4
    // this works for up to 99,999 lines - any questions?
    return 5
  }

  function pad(n, totalDigits) {
    // not pretty, but simple and should perform quite well
    var padDigits = totalDigits - getDigits(n)
    switch (padDigits) {
      case 0: return '' + n
      case 1: return ' ' + n
      case 2: return '  ' + n
      case 3: return '   ' + n
      case 4: return '    ' + n
      case 5: return '     ' + n
    }
  }

  totalDigits = getDigits(linesLen + firstline - 1)

  for (var i = 0; i < linesLen; i++) {
    // Don't close the escape sequence here in order to not break multi line code highlights like block comments
    lineno = colorSurround(pad(i + firstline, totalDigits) + ': ').replace(surroundClose, '')
    lines.push(lineno + highlightedLines[i])
  }

  return lines.join('\n')
}

module.exports = function highlight(code, opts) {
  opts = opts || { }
  try {
    var result = redeyed(code, opts.theme || theme, { jsx: !!opts.jsx })
    var firstline = opts.firstline && !isNaN(opts.firstline) ? opts.firstline : 1

    return opts.linenos ? addLinenos(result.code, firstline) : result.code
  } catch (e) {
    e.message = 'Unable to perform highlight. The code contained syntax errors: ' + e.message
    throw e
  }
}

}, function(modId) { var map = {"../themes/default":1735183514995}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1735183514995, function(require, module, exports) {
var colors = require('ansicolors')

// Change the below definitions in order to tweak the color theme.
module.exports = {

    'Boolean': {
      'true'   :  undefined
    , 'false'  :  undefined
    , _default :  colors.brightRed
    }

  , 'Identifier': {
      'undefined' :  colors.brightBlack
    , 'self'      :  colors.brightRed
    , 'console'   :  colors.blue
    , 'log'       :  colors.blue
    , 'warn'      :  colors.red
    , 'error'     :  colors.brightRed
    , _default    :  colors.white
    }

  , 'Null': {
      _default: colors.brightBlack
    }

  , 'Numeric': {
      _default: colors.blue
    }

  , 'String': {
      _default: function(s, info) {
        var nextToken = info.tokens[info.tokenIndex + 1]

        // show keys of object literals and json in different color
        return (nextToken && nextToken.type === 'Punctuator' && nextToken.value === ':')
          ? colors.green(s)
          : colors.brightGreen(s)
      }
    }

  , 'Keyword': {
      'break'       :  undefined

    , 'case'        :  undefined
    , 'catch'       :  colors.cyan
    , 'class'       :  undefined
    , 'const'       :  undefined
    , 'continue'    :  undefined

    , 'debugger'    :  undefined
    , 'default'     :  undefined
    , 'delete'      :  colors.red
    , 'do'          :  undefined

    , 'else'        :  undefined
    , 'enum'        :  undefined
    , 'export'      :  undefined
    , 'extends'     :  undefined

    , 'finally'     :  colors.cyan
    , 'for'         :  undefined
    , 'function'    :  undefined

    , 'if'          :  undefined
    , 'implements'  :  undefined
    , 'import'      :  undefined
    , 'in'          :  undefined
    , 'instanceof'  :  undefined
    , 'let'         :  undefined
    , 'new'         :  colors.red
    , 'package'     :  undefined
    , 'private'     :  undefined
    , 'protected'   :  undefined
    , 'public'      :  undefined
    , 'return'      :  colors.red
    , 'static'      :  undefined
    , 'super'       :  undefined
    , 'switch'      :  undefined

    , 'this'        :  colors.brightRed
    , 'throw'       :  undefined
    , 'try'         :  colors.cyan
    , 'typeof'      :  undefined

    , 'var'         :  colors.green
    , 'void'        :  undefined

    , 'while'       :  undefined
    , 'with'        :  undefined
    , 'yield'       :  undefined
    , _default      :  colors.brightBlue
  }
  , 'Punctuator': {
      ';': colors.brightBlack
    , '.': colors.green
    , ',': colors.green

    , '{': colors.yellow
    , '}': colors.yellow
    , '(': colors.brightBlack
    , ')': colors.brightBlack
    , '[': colors.yellow
    , ']': colors.yellow

    , '<': undefined
    , '>': undefined
    , '+': undefined
    , '-': undefined
    , '*': undefined
    , '%': undefined
    , '&': undefined
    , '|': undefined
    , '^': undefined
    , '!': undefined
    , '~': undefined
    , '?': undefined
    , ':': undefined
    , '=': undefined

    , '<=': undefined
    , '>=': undefined
    , '==': undefined
    , '!=': undefined
    , '++': undefined
    , '--': undefined
    , '<<': undefined
    , '>>': undefined
    , '&&': undefined
    , '||': undefined
    , '+=': undefined
    , '-=': undefined
    , '*=': undefined
    , '%=': undefined
    , '&=': undefined
    , '|=': undefined
    , '^=': undefined
    , '/=': undefined
    , '=>': undefined
    , '**': undefined

    , '===': undefined
    , '!==': undefined
    , '>>>': undefined
    , '<<=': undefined
    , '>>=': undefined
    , '...': undefined
    , '**=': undefined

    , '>>>=': undefined

    , _default: colors.brightYellow
  }

    // line comment
  , Line: {
      _default: colors.brightBlack
    }

    /* block comment */
  , Block: {
      _default: colors.brightBlack
    }

  // JSX
  , JSXAttribute: {
      _default: colors.magenta
    }
  , JSXClosingElement: {
      _default: colors.magenta
    }
  , JSXElement: {
      _default: colors.magenta
    }
  , JSXEmptyExpression: {
      _default: colors.magenta
    }
  , JSXExpressionContainer: {
      _default: colors.magenta
    }
  , JSXIdentifier: {
        className: colors.blue
      , _default: colors.magenta
    }
  , JSXMemberExpression: {
      _default: colors.magenta
    }
  , JSXNamespacedName: {
      _default: colors.magenta
    }
  , JSXOpeningElement: {
      _default: colors.magenta
    }
  , JSXSpreadAttribute: {
      _default: colors.magenta
    }
  , JSXText: {
      _default: colors.brightGreen
    }

  , _default: undefined
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1735183514996, function(require, module, exports) {


var fs = require('fs')
var highlight = require('./highlight')

function isFunction(obj) {
  return toString.call(obj) === '[object Function]'
}

module.exports = function highlightFile(fullPath, opts, cb) {
  if (isFunction(opts)) {
    cb = opts
    opts = { }
  }
  opts = opts || { }

  fs.readFile(fullPath, 'utf-8', function(err, code) {
    if (err) return cb(err)
    try {
      cb(null, highlight(code, opts))
    } catch (e) {
      cb(e)
    }
  })
}

}, function(modId) { var map = {"./highlight":1735183514994}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1735183514997, function(require, module, exports) {


var fs = require('fs')
var highlight = require('./highlight')

module.exports = function highlightFileSync(fullPath, opts) {
  var code = fs.readFileSync(fullPath, 'utf-8')
  opts = opts || { }
  return highlight(code, opts)
}

}, function(modId) { var map = {"./highlight":1735183514994}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1735183514993);
})()
//miniprogram-npm-outsideDeps=["redeyed","ansicolors","fs"]
//# sourceMappingURL=index.js.map