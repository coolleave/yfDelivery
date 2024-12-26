// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  return sendTemplateMessage(event)
}

//小程序模版消息推送5
async function sendTemplateMessage(event) {
  const {
    OPENID
  } = cloud.getWXContext()

  // 接下来将新增模板、发送模板消息、然后删除模板
  const addResult = await cloud.openapi.templateMessage.addTemplate({
    id: 'AT0142',
    keywordIdList: [1, 2, 3, 11, 21, 4]
  })

  const templateId = addResult.templateId //新增的模版id

  const sendResult = await cloud.openapi.templateMessage.send({
    touser: OPENID,
    templateId,
    formId: event.formId,
    page: 'pages/index/index',
    data: {
      keyword1: {
        value: '远方快递公司',
      },
      keyword2: {
        value: event.shifa,
      },
      keyword3: {
        value: event.mudi,
      },
      keyword4: {
        value: event.yundanhao,
      },
      keyword5: {
        value: '等待快递员揽收',
      },
      keyword6: {
        value: event.yunf,
      },
    }
  })

  return sendResult
}