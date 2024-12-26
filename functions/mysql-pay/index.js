//云开发实现支付
const cloud = require('wx-server-sdk')
cloud.init()

//1，引入支付的三方依赖2
const tenpay = require('tenpay');
//2，配置支付信息
const config = {
  appid: 'wxe4203b34c2a75e89',
  mchid: '1473426802',
  partnerKey: 'T6m9iK73b0kn9g5v426MKfHQH7X8rKwb ',
  notify_url: 'https://mp.weixin.qq.com',
  spbill_create_ip: '127.0.0.1' //这里填这个就可以
};

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let {
    orderid,
    money
  } = event;
  //3，初始化支付
  const api = tenpay.init(config);

  let result = await api.getPayParams({
    out_trade_no: orderid,
    body: '商品简单描述',
    total_fee: money, //订单金额(分),
    openid: wxContext.OPENID //付款用户的openid
  });
  return result;
}