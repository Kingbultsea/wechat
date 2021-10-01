const axios = require('axios')
axios.get('https://mp.weixin.qq.com/s/o4xn5G40AN33M3LVKz3_sw').then(async (res) => {
  const _content = /<divclass="rich_media_content"id="js_content".*?>(.+?)<\/div>/g.exec(res.data.replace(/\s+/g, ''))
  const _title = /<h1class="rich_media_title"id="activity-name">(.+?)<\/h1>/.exec(res.data.replace(/\s+/g, ''))
  // console.log(/<h1\s*class\=\".*\"\s*id\=\"activity-name\">(.+?)<\/h1>/.exec(res.data.replace(/\s+/g, ''))[1],
  //   /<divclass="rich_media_content"id="js_content".*?>(.+?)<\/div>/g.exec(res.data.replace(/\s+/g, ''))[1])
  let from = ''
  try {
    from = /<ahref="javascript:void\(0\);"class="weui-wa-hotarea"id="js_name">(.+?)<\/a>/.exec(res.data.replace(/\s+/g, ''))[1]
  } catch (e) {
    try {
      from = /<strong.*?class="account_nickname_inner">(.+?)<\/strong>/.exec(res.data.replace(/\s+/g, ''))[1]
    } catch (e) {
      from = '雪松控股'
    }
  }
  console.log(
    from
  )
})
// view-source:https://mp.weixin.qq.com/s/o4xn5G40AN33M3LVKz3_sw
