// 云函数入口文件
const cloud = require('wx-server-sdk')
//引入mysql操作模块
const mysql = require('mysql2/promise')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  //链接mysql数据库的test库，这里你可以链接你mysql中的
  let expnum = event.expnum;
  let custrank = event.custrank;
  let braid = event.braid;
  let sender = event.sender;
  let sendphone = event.sendphone;
  let sendidcard = event.sendidcard;
  let sendprovince = event.sendprovince;
  let sendcity = event.sendcity;
  let sendcounty = event.sendcounty;
  let senddetailaddress = event.senddetailaddress;
  let recipient = event.recipient;
  let recphone = event.recphone;
  let recprovince = event.recprovince;
  let reccity = event.reccity;
  let reccounty = event.reccounty;
  let recdetailaddress = event.recdetailaddress;
  let itemtype = event.itemtype;
  let itemweight = event.itemweight;
  let offerprice = event.offerprice;
  let offerprices = event.offerprices;
  let paytype = event.paytype;
  let exptype = event.exptype;
  let expremark = event.expremark;
  let expprice = event.expprice;
  let gogalprice = event.gogalprice;
  let expstate = event.expstate;
  try {
    const connection = await mysql.createConnection({
     host: "211.159.166.14",
      database: "expressproject",
      user: "expressproject",
      password: "8Ypzj7tnhJ5Z4RM4"
    })
    const [rows, fields] = await connection.execute("insert into express(expnum,custrank,braid,sender,sendphone,sendidcard,sendprovince,sendcity,sendcounty,senddetailaddress,recipient,recphone,recprovince,reccity,reccounty,recdetailaddress,itemtype,itemweight,offerprice,offerprices,paytype,exptype,expremark,expprice,gogalprice,exptime,expstate) VALUES ('" + expnum + "','" + custrank + "','" + braid + "','" + sender + "','" + sendphone + "','" + sendidcard + "','" + sendprovince + "','" + sendcity + "','" + sendcounty + "','" + senddetailaddress + "','" + recipient + "','" + recphone + "','" + recprovince + "','" + reccity + "','" + reccounty + "','" + recdetailaddress + "','" + itemtype + "','" + itemweight + "','" + offerprice + "','" + offerprices + "','" + paytype + "','" + exptype + "','" + expremark + "','" + expprice + "','" + gogalprice + "',DATE_FORMAT(NOW(),'%y-%m-%d %H:%i:%s'),'" + expstate + "')")
    return rows;
  } catch (err) {
    console.log("链接错误", err)
    return err
  }
}