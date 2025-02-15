module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1735183514755, function(require, module, exports) {


// based on code from Brian White @mscdex mariasql library - https://github.com/mscdex/node-mariasql/blob/master/lib/Client.js#L272-L332
// License: https://github.com/mscdex/node-mariasql/blob/master/LICENSE

const RE_PARAM = /(?:\?)|(?::(\d+|(?:[a-zA-Z][a-zA-Z0-9_]*)))/g,
DQUOTE = 34,
SQUOTE = 39,
BSLASH = 92;

function parse(query) {
  let ppos = RE_PARAM.exec(query);
  let curpos = 0;
  let start = 0;
  let end;
  const parts = [];
  let inQuote = false;
  let escape = false;
  let qchr;
  const tokens = [];
  let qcnt = 0;
  let lastTokenEndPos = 0;
  let i;

  if (ppos) {
    do {
      for (i=curpos,end=ppos.index; i<end; ++i) {
        let chr = query.charCodeAt(i);
        if (chr === BSLASH)
        escape = !escape;
        else {
          if (escape) {
            escape = false;
            continue;
          }
          if (inQuote && chr === qchr) {
            if (query.charCodeAt(i + 1) === qchr) {
              // quote escaped via "" or ''
              ++i;
              continue;
            }
            inQuote = false;
          } else if (chr === DQUOTE || chr === SQUOTE) {
            inQuote = true;
            qchr = chr;
          }
        }
      }
      if (!inQuote) {
        parts.push(query.substring(start, end));
        tokens.push(ppos[0].length === 1 ? qcnt++ : ppos[1]);
        start = end + ppos[0].length;
        lastTokenEndPos = start;
      }
      curpos = end + ppos[0].length;
    } while (ppos = RE_PARAM.exec(query));

    if (tokens.length) {
      if (curpos < query.length) {
        parts.push(query.substring(lastTokenEndPos));
      }
      return [parts, tokens];
    }
  }
  return [query];
};

const EMPTY_LRU_FN = (key, value) => {};

function createCompiler(config) {
  if (!config)
  config = {};
  if (!config.placeholder) {
    config.placeholder = '?';
  }
  let ncache = 100;
  let cache;
  if (typeof config.cache === 'number') {
    ncache = config.cache;
  }
  if (typeof config.cache === 'object') {
    cache = config.cache;
  }
  if (config.cache !== false && !cache) {
    cache = require('lru-cache')({ max: ncache, dispose: EMPTY_LRU_FN });
  }

  function toArrayParams(tree, params) {
    const arr = [];
    if (tree.length == 1) {
      return [tree[0], []];
    }

    if (typeof params == 'undefined')
      throw new Error('Named query contains placeholders, but parameters object is undefined');

    const tokens = tree[1];
    for (let i=0; i < tokens.length; ++i) {
      arr.push(params[tokens[i]]);
    }
    return [tree[0], arr];
  }

  function noTailingSemicolon(s) {
    if (s.slice(-1) == ':') {
      return s.slice(0, -1);
    }
    return s;
  }

  function join(tree) {
    if (tree.length == 1) {
      return tree;
    }

    let unnamed = noTailingSemicolon(tree[0][0]);
    for (let i=1; i < tree[0].length; ++i) {
      if (tree[0][i-1].slice(-1) == ':') {
        unnamed += config.placeholder;
      }
      unnamed += config.placeholder;
      unnamed += noTailingSemicolon(tree[0][i]);
    }

    const last = tree[0][tree[0].length -1];
    if (tree[0].length == tree[1].length) {
      if (last.slice(-1) == ':') {
        unnamed += config.placeholder;
      }
      unnamed += config.placeholder;
    }
    return [unnamed, tree[1]];
  }

  function compile(query, paramsObj) {
    let tree;
    if (cache && (tree = cache.get(query))) {
      return toArrayParams(tree, paramsObj)
    }
    tree = join(parse(query));
    if(cache) {
      cache.set(query, tree);
    }
    return toArrayParams(tree, paramsObj);
  }

  compile.parse = parse;
  return compile;
}

// named :one :two to postgres-style numbered $1 $2 $3
function toNumbered(q, params) {
  const tree = parse(q);
  const paramsArr = [];
  if (tree.length == 1) {
    return [tree[0], paramsArr];
  }

  const pIndexes = {};
  let pLastIndex = 0;
  let qs = '';
  let varIndex;
  const varNames = [];
  for (let i=0; i < tree[0].length; ++i) {
    varIndex = pIndexes[tree[1][i]];
    if (!varIndex) {
      varIndex = ++pLastIndex;
      pIndexes[tree[1][i]] = varIndex;
    }
    if (tree[1][i]) {
      varNames[varIndex - 1] = tree[1][i];
      qs += tree[0][i] + '$' + varIndex;
    } else {
      qs += tree[0][i];
    }
  }
  return [qs, varNames.map(n => params[n])];
}

module.exports = createCompiler;
module.exports.toNumbered = toNumbered;

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1735183514755);
})()
//miniprogram-npm-outsideDeps=["lru-cache"]
//# sourceMappingURL=index.js.map