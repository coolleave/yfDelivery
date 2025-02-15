module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1735183515597, function(require, module, exports) {

/**
 * Module dependencies.
 */

var types = require('ast-types');
var esprima = require('esprima');
var escodegen = require('escodegen');

/**
 * Helper functions.
 */

var n = types.namedTypes;
var b = types.builders;

/**
 * Module exports.
 */

module.exports = degenerator;

/**
 * Turns sync JavaScript code into an JavaScript with async Generator Functions.
 *
 * @param {String} jsStr JavaScript string to convert
 * @param {Array} names Array of function names to add `yield` operators to
 * @return {String} Converted JavaScript string with Generator functions injected
 * @api public
 */

function degenerator (jsStr, names) {
  if (!Array.isArray(names)) {
    throw new TypeError('an array of async function "names" is required');
  }

  var ast = esprima.parse(jsStr);

  // duplicate the `names` array since it's rude to augment the user-provided
  // array
  names = names.slice(0);


  // first pass is to find the `function` nodes and turn them into `function *`
  // generator functions. We also add the names of the functions to the `names`
  // array
  types.visit(ast, {
    visitFunction: function(path) {
      if (path.node.id) {
        // got a "function" expression/statement,
        // convert it into a "generator function"
        path.node.generator = true;

        // add function name to `names` array
        names.push(path.node.id.name);
      }

      this.traverse(path);
    }
  });

  // second pass is for adding `yield` statements to any function
  // invocations that match the given `names` array.
  types.visit(ast, {
    visitCallExpression: function(path) {
      if (checkNames(path.node, names)) {
        // a "function invocation" expression,
        // we need to inject a `YieldExpression`
        var name = path.name;
        var parent = path.parent.node;

        var delegate = false;
        var expr = b.yieldExpression(path.node, delegate);
        if (parent['arguments']) {
          // parent is a `CallExpression` type
          parent['arguments'][name] = expr;
        } else {
          parent[name] = expr;
        }
      }

      this.traverse(path);
    }
  });

  return escodegen.generate(ast);
}

/**
 * Returns `true` if `node` has a matching name to one of the entries in the
 * `names` array.
 *
 * @param {types.Node} node
 * @param {Array} names Array of function names to return true for
 * @return {Boolean}
 * @api private
 */

function checkNames (node, names) {
  var name;
  var callee = node.callee;
  if ('Identifier' == callee.type) {
    name = callee.name;
  } else if ('MemberExpression' == callee.type) {
    name = callee.object.name + '.' + (callee.property.name || callee.property.raw);
  } else if ('FunctionExpression' == callee.type) {
    if (callee.id) {
      name = callee.id.name;
    } else {
      return false;
    }
  } else {
    throw new Error('don\'t know how to get name for: ' + callee.type);
  }

  // now that we have the `name`, check if any entries match in the `names` array
  var n;
  for (var i = 0; i < names.length; i++) {
    n = names[i];
    if (n.test) {
      // regexp
      if (n.test(name)) return true;
    } else {
      if (name == n) return true;
    }
  }

  return false;
}

}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1735183515597);
})()
//miniprogram-npm-outsideDeps=["ast-types","esprima","escodegen"]
//# sourceMappingURL=index.js.map