(global["webpackJsonp"]=global["webpackJsonp"]||[]).push([["components/xuan-popup/xuan-popup"],{156:function(t,n,e){"use strict";e.r(n);var i=e(157),u=e(159);for(var p in u)["default"].indexOf(p)<0&&function(t){e.d(n,t,(function(){return u[t]}))}(p);e(161);var o,r=e(32),s=Object(r["default"])(u["default"],i["render"],i["staticRenderFns"],!1,null,null,null,!1,i["components"],o);s.options.__file="components/xuan-popup/xuan-popup.vue",n["default"]=s.exports},157:function(t,n,e){"use strict";e.r(n);var i=e(158);e.d(n,"render",(function(){return i["render"]})),e.d(n,"staticRenderFns",(function(){return i["staticRenderFns"]})),e.d(n,"recyclableRender",(function(){return i["recyclableRender"]})),e.d(n,"components",(function(){return i["components"]}))},158:function(t,n,e){"use strict";var i;e.r(n),e.d(n,"render",(function(){return u})),e.d(n,"staticRenderFns",(function(){return o})),e.d(n,"recyclableRender",(function(){return p})),e.d(n,"components",(function(){return i}));var u=function(){var t=this,n=t.$createElement;t._self._c},p=!1,o=[];u._withStripped=!0},159:function(t,n,e){"use strict";e.r(n);var i=e(160),u=e.n(i);for(var p in i)["default"].indexOf(p)<0&&function(t){e.d(n,t,(function(){return i[t]}))}(p);n["default"]=u.a},160:function(t,n,e){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.default=void 0;var i={data:function(){return{popup_list:[],distance:65}},props:{isdistance:{type:Boolean,default:!0}},methods:{init:function(t){return"success"==t.type?(t.icon="../../static/xuan-popup/success.png",t.typeClass="mpopup-success",t):"warn"==t.type?(t.icon="../../static/xuan-popup/warn.png",t.typeClass="mpopup-warn",t):"info"==t.type?(t.icon="../../static/xuan-popup/info.png",t.typeClass="mpopup-info",t):"err"==t.type?(t.icon="../../static/xuan-popup/err.png",t.typeClass="mpopup-err",t):"loading"==t.type?(t.icon="../../static/xuan-popup/loading.png",t.typeClass="mpopup-loading",t):void 0},open:function(t){this.isdistance||(this.distance=0);var n=this.guid();t.uuid=n,t.animator="fade_Down","boolean"!=typeof t.isClick&&(t.isClick=!1);var e=this.init(t);this.popup_list.push(e),e.isClick?this.$emit("uuidCallback",e.uuid):this.disappear(e.uuid,e.timeout)},disappear:function(t,n){var e=this;this.fade_out_animator(t,n).then((function(t){setTimeout((function(){for(var n=0;n<e.popup_list.length;n++)e.popup_list[n].uuid==t&&(e.popup_list.splice(n,1),e.$forceUpdate())}),250)}))},fade_out_animator:function(t,n){var e=this;return n&&"number"==typeof n||(n=3e3),new Promise((function(i){setTimeout((function(){for(var n=0;n<e.popup_list.length;n++)e.popup_list[n].uuid==t&&(e.popup_list[n].animator="fade_Top",i(t))}),n)}))},close:function(t,n){var e=this;n&&!this.popup_list[n].isClick||this.remove_element(t).then((function(n){setTimeout((function(){for(var i=0;i<e.popup_list.length;i++)e.popup_list[i].uuid==n&&(e.popup_list.splice(i,1),e.$emit("closeCallback",t),e.$forceUpdate())}),250)}))},remove_element:function(t){var n=this;return new Promise((function(e){for(var i=0;i<n.popup_list.length;i++)if(n.popup_list[i].uuid==t){n.popup_list[i].animator="fade_Top",e(t);break}}))},update:function(t){for(var n=0;n<this.popup_list.length;n++)if(this.popup_list[n].uuid==t.uuid){this.popup_list[n].type=t.type,this.init(this.popup_list[n]),this.popup_list[n].content=t.content;break}},guid:function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(t){var n=16*Math.random()|0,e="x"==t?n:3&n|8;return e.toString(16)}))}}};n.default=i},161:function(t,n,e){"use strict";e.r(n);var i=e(162),u=e.n(i);for(var p in i)["default"].indexOf(p)<0&&function(t){e.d(n,t,(function(){return i[t]}))}(p);n["default"]=u.a},162:function(t,n,e){}}]);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/xuan-popup/xuan-popup.js.map
;(global["webpackJsonp"] = global["webpackJsonp"] || []).push([
    'components/xuan-popup/xuan-popup-create-component',
    {
        'components/xuan-popup/xuan-popup-create-component':(function(module, exports, __webpack_require__){
            __webpack_require__('2')['createComponent'](__webpack_require__(156))
        })
    },
    [['components/xuan-popup/xuan-popup-create-component']]
]);
