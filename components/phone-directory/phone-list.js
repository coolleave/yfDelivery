(global["webpackJsonp"]=global["webpackJsonp"]||[]).push([["components/phone-directory/phone-list"],{234:function(t,e,n){"use strict";n.r(e);var r=n(235),o=n(237);for(var i in o)["default"].indexOf(i)<0&&function(t){n.d(e,t,(function(){return o[t]}))}(i);n(239);var c,u=n(32),l=Object(u["default"])(o["default"],r["render"],r["staticRenderFns"],!1,null,null,null,!1,r["components"],c);l.options.__file="components/phone-directory/phone-list.vue",e["default"]=l.exports},235:function(t,e,n){"use strict";n.r(e);var r=n(236);n.d(e,"render",(function(){return r["render"]})),n.d(e,"staticRenderFns",(function(){return r["staticRenderFns"]})),n.d(e,"recyclableRender",(function(){return r["recyclableRender"]})),n.d(e,"components",(function(){return r["components"]}))},236:function(t,e,n){"use strict";var r;n.r(e),n.d(e,"render",(function(){return o})),n.d(e,"staticRenderFns",(function(){return c})),n.d(e,"recyclableRender",(function(){return i})),n.d(e,"components",(function(){return r}));var o=function(){var t=this,e=t.$createElement;t._self._c},i=!1,c=[];o._withStripped=!0},237:function(t,e,n){"use strict";n.r(e);var r=n(238),o=n.n(r);for(var i in r)["default"].indexOf(i)<0&&function(t){n.d(e,t,(function(){return r[t]}))}(i);e["default"]=o.a},238:function(t,e,n){"use strict";(function(t){Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var n={name:"phone-list",props:{phones:Object,letter:String,scrollAnimationOFF:Boolean},data:function(){return{winHeight:0,scrollTop:0,letterDetails:[],timer:null}},computed:{scrollViewId:function(){return this.letter}},mounted:function(){this.winHeight=t.getSystemInfoSync().windowHeight-49.5},methods:{handleClick:function(t){this.$emit("handleClick",t.target.dataset)},handleScroll:function(e){var n=this;if(0===this.letterDetails.length){var r=t.createSelectorQuery().selectAll(".list-item");r.boundingClientRect((function(t){var e=t[0].top;t.forEach((function(t,r){t.top=t.top-e,t.bottom=t.bottom-e,n.letterDetails.push({id:t.id,top:t.top,bottom:t.bottom})}))})).exec()}var o=e.detail.scrollTop;this.letterDetails.some((function(t,e){if(o>=t.top&&o<=t.bottom-5)return n.$emit("change",t.id),n.$emit("reset",!0),!0}))}}};e.default=n}).call(this,n(2)["default"])},239:function(t,e,n){"use strict";n.r(e);var r=n(240),o=n.n(r);for(var i in r)["default"].indexOf(i)<0&&function(t){n.d(e,t,(function(){return r[t]}))}(i);e["default"]=o.a},240:function(t,e,n){}}]);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/phone-directory/phone-list.js.map
;(global["webpackJsonp"] = global["webpackJsonp"] || []).push([
    'components/phone-directory/phone-list-create-component',
    {
        'components/phone-directory/phone-list-create-component':(function(module, exports, __webpack_require__){
            __webpack_require__('2')['createComponent'](__webpack_require__(234))
        })
    },
    [['components/phone-directory/phone-list-create-component']]
]);
