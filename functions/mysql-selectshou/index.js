// 云函数入口文件
const cloud = require('wx-server-sdk')
//引入mysql操作模块
const mysql = require('mysql2/promise')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  //链接mysql数据库的test库，这里你可以链接你mysql中的
  let recipient = event.recipient;
  let recphone = event.recphone;
  try {
    const connection = await mysql.createConnection({
     host: "211.159.166.14",
      database: "expressproject",
      user: "expressproject",
      password: "8Ypzj7tnhJ5Z4RM4"
    })
    const [rows, fields] = await connection.execute("select expnum from express where recipient='" + recipient + "' and recphone='" + recphone + "' order by expid desc")
    return rows;
  } catch (err) {
    console.log("链接错误", err)
    return err
  }
}