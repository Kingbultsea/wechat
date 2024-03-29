require('babel-register')
const Wechat = require('./src/wechat.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
// const request = require('request')
// const superAgent = require('superagent')
const axios = require('axios')
const db = require('./src/database.js')

let bot
let url = null
let isLogin = false
let loginTime = 0

function AWAIT () {
  return new Promise(resolve => {
    setTimeout(resolve, 5000)
  })
}

let reload
// fs.unlinkSync('./sync-data.json')
// try {
//   bot = new Wechat()
// } catch (e) {
// }
// bot.lg = isLogin
// console.log(bot.PROP.uin == true)
// bot = new Wechat()
// if (bot.PROP.uin) {
//   // 存在登录数据时，可以随时调用restart进行重启
//   bot.restart()
// } else {
//   bot.start()
// }
// bot.start()
console.log(2)
const unionAccpeter = [
  { name: ['供通云', '雪松大宗'], accepter: ['大宗'] },
  { name: ['雪松地产', '松赢宝', '雪松灵水小镇', '中山君华硅谷', '君华朝阳花地'], accepter: ['地产'] },
  { name: ['齐翔腾达'], accepter: ['化工'] },
  { name: ['松果财富微资讯', '雪松财富', '中江国际信托', '雪松国际信托', '大连金融资产交易所', '雪松普惠', '雪松普惠服务平台', 'CedarTrust'], accepter: ['金融'] },
  { name: ['雪松控股', '雪松招聘'], accepter: ['控股'] },
  { name: ['雪松文旅', '独克宗花巷', '大研花巷', '西塘花巷', '雪松旅行', '松旅网'], accepter: ['文旅'] },
  { name: ['雪松社区', '君华物业', '湖南华庭物业管理有限公司', '苏州易通亚信物业管理有限公司', '君华新城物业服务中心', '广州市庆德物业管理有限公司', '永和物业管理', '苏州依士达物业', '福田物业昆山分公司', '雪松庆德', '湖南家园南宁分公司'], accepter: ['社区'] },
  { name: ['雪松国际信托',
    '大连金融资产交易所',
    '雪松普惠', '雪松普惠服务平台',
    '雪松产投',
    'IN天府',
    '松赢宝', '雪松灵水小镇', '雪松社区', '君华物业',	'湖南家园南宁分公司', '广州市庆德物业管理有限公司', '君华新城物业服务中心',	'雪松文旅',	'独克宗花巷',	'大研花巷',	'西塘花巷',	'雪松大宗',	'齐翔腾达',	'雪松招聘', '君华朝阳花地', '中山君华硅谷'], accepter: ['雪松新媒体监测'] }
]

function start () {
  reload = setInterval(() => {
  }, 1000 * 60 * 20)

  bot.on('uuid', uuid => {
    qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
      small: true
    })
    url = 'https://login.weixin.qq.com/qrcode/' + uuid
    console.log('qrBlock link：', 'https://login.weixin.qq.com/qrcode/' + uuid)
  })

  bot.on('login', () => {
    console.log('登录成功')
    loginTime = parseInt(new Date().getTime() / 1000)
    isLogin = true
    // 保存数据，将数据序列化之后保存到任意位置
    fs.writeFileSync('./sync-data.json', JSON.stringify(bot.botData))
  })

  bot.on('logout', () => {
    console.log('登出成功')
    // 清除数据
    loginTime = parseInt(new Date().getTime() / 1000)
    isLogin = false
    try {
      fs.unlinkSync('./sync-data.json')
    } catch (e) {
    }
    // bot.start()
  })

  bot.on('error', err => {
    console.error('错误：', err)
  })

  bot.on('message', msg => {
    console.log(`----------${msg.getDisplayTime()}----------`)
    isLogin = true
    console.log('message check ---')
    switch (msg.MsgType) {
      case bot.CONF.MSGTYPE_TEXT:
        sendUrlMesage(msg)
        break
      case 49:
        console.log('Public number article push')
        const userId = msg.FromUserName
        bot._getmpData(userId).then(article => {
          console.log(article.length, ' - lengthArticle')
          try {
            let time = 1000
            for (let i of article) {
              // console.log(i.Url.length.slice(-10), Object.keys(i))
              setTimeout(() => {
                analyzeContent(i, msg)
              }, time)
              time += 2000
            }
          } catch (e) {
            console.log(e)
          }
        })
        break
    }
  })

  function sendUrlMesage (msg) {
    console.log(
      msg.OriginalContent.replace(/&amp;/g, '&').replace(/.+\>/, ''), 'well'
    )
    const data = {
      Url: msg.OriginalContent.replace(/&amp;/g, '&').replace(/.+\>/, ''),
      Title: undefined
    }
    // console.log('自主发送消息推送')
    analyzeContent(data, msg)
  }

  function analyzeContent (data, msg) {
    axios.get(data.Url).then(async res => {
      // const keyGroups = await db.select('swdata')
      /* ['雪松控股', '张劲', '张主席', '张老板', '创始人', '主席', '董事局主席', '董事长', '政协委员', '总商会副会长',
          '习近平', '李克强', '李希', '马兴瑞', '张硕辅', '温国辉', '周亚伟', '齐翔腾达', '希努尔', '雪松国际信托', '雪松信托', '大金所',
          '大连金融资产交易所', '正勤金融', '雪松普惠', '轻松盈', '广州证行互联网金融信息服务有限公司',
          '三个万亿', '三万亿', '水密舱', '100%誓言', '强根造血', '毕节30亿扶贫', '旅游扶贫', '文旅扶贫', '产业扶贫', '六大产业集团', '供通云', '雪松社区', '雪松系',
          '李克强', '汪洋', '王沪宁', '赵乐际', '韩正', '栗战书'] */ // 抓取推送文章的关键词

      // const content = /<divclass="rich_media_content"id="js_content".*?>(.+?)<\/div>/g.exec(res.data.replace(/\s+/g, ''))[1]
      const _title =  /<h1\s*class\=\".*\"\s*id\=\"activity-name\">(.+?)<\/h1>/.exec(res.data.replace(/\s+/g, ''))
      const title = (_title && _title[1]) ? _title[1] : '无标题'

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

      // 从哪推送
      console.log('push', from)
      // let accepter = ''

      let countKeys = []

      // keyGroups.forEach(v => {
      //   if (content.includes(v.word)) {
      //     const reg = new RegExp(v.word, 'g')
      //     let times = 0
      //     while (true) {
      //       const r = reg.exec(content)
      //       if (!r) {
      //         break
      //       }
      //       times += 1
      //     }
      //     countKeys.push({ key: v.word, times, count: v.count + times, id: v.id })
      //   }
      // })

      let time = 1000
      const date = dateFormat(+(msg.CreateTime + '000'), 'yy年MM月d日hh时mm分s秒')
      const _sentor = /<nickname><!\[CDATA\[(.+?)\]\]><\/nickname>/.exec(msg.Content)
      const sentor = _sentor ? _sentor[1] : from

      if (countKeys.length >= 1) {
        countKeys.sort((a, b) => {
          return b.times - a.times
        }) // [0]

        countKeys = countKeys.map(v => {
          db.update('swdata', { count: v.count }, { where: { id: v.id } })
          const _key = parseKeyEasyToSend(v.key) // 修饰关键词再发送
          return `    敏感词：${_key}  出现次数：${v.times}`
        })

        console.log(countKeys)
      }

      let warningContent = countKeys.length === 0 ? '    敏感词：无' : countKeys.join('\r\n')

      // 数据库插入
      // db.insert('lsdata', {
      //   date: +msg.CreateTime,
      //   user: sentor,
      //   url: data.Url,
      //   warning: warningContent
      // })

      for (let i in bot.contacts) {
        for (let i2 of unionAccpeter) {
          // console.log(i2, bot.contacts[i].OrignalNickName, i2.accepter[0])
          for (let i3 of i2.accepter) {
            if (i2.name.includes(from) && bot.contacts[i].OrignalNickName === i3) { // .OrignalRemarkName 是人的名称
              console.log('push to users')
              bot.sendMsg(`推文标题：\r\n    ${data.Title || title}\r\n\r\n推文主体：\r\n    ${sentor}\r\n\r\n推文警报：\r\n${warningContent}\r\n\r\n推送时间:\r\n    ${date}\r\n\r\n推文链接：${data.Url}`, bot.contacts[i].UserName)
                .catch(err => {
                  // bot.emit('error', err)
                })
              await AWAIT()
            }
          }
        }
        // if (bot.contacts[i].OrignalRemarkName === accepter) {
        //   // wechat 推送
        //   bot.sendMsg(`推文标题：\r\n    ${data.Title || title}\r\n\r\n推文主体：\r\n    ${sentor}\r\n\r\n推文警报：\r\n${warningContent}\r\n\r\n推送时间:\r\n    ${date}\r\n\r\n推文链接：${data.Url}`, bot.contacts[i].UserName)
        //     .catch(err => {
        //       // bot.emit('error', err)
        //     })
        // }
      }
    }).catch(e => {
      console.log('not url', e)
    })
  }
}

function dateFormat (date, format) { // yy:mm:ss  yyyy年mmmm分sss秒
  if (!format || typeof format !== 'string') {
    console.error('format is undefiend or type is Error')
    return ''
  }

  date = date instanceof Date ? date : (typeof date === 'number' || typeof date === 'string') ? new Date(date) : new Date()

  // 解析
  let formatReg = {
    'y+': date.getFullYear(),
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }
  for (let reg in formatReg) {
    if (new RegExp(reg).test(format)) {
      let match = RegExp.lastMatch // 上一次的匹配到的字符串
      format = format.replace(match, formatReg[reg].toString()) // formatReg[reg]< 10 ? '0'+formatReg[reg]:  这段代码不知道有什么作用 暂时删除
    }
  }
  return format
}

function parseKeyEasyToSend (key) {
  key = key.replace(/习近平/, 'xjp')
  return key
}

const bodyParser = require('koa-bodyparser')

let Koa = require('koa')
let Router = require('koa-router')
let app = new Koa()
let router = new Router()

app.use(bodyParser())

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE')
  ctx.set('Access-Control-Request-Method', 'OPTIONS, GET, PUT, POST, DELETE')
  ctx.set('Access-Control-Request-Headers', 'X-Custom-Header')
  ctx.set('Access-Control-Allow-Headers', 'x-requested-with, accept, origin, content-type')
  // ctx.set('Content-Type', 'application/json;charset=utf-8')
  ctx.set('Access-Control-Max-Age', 300)
  if (ctx.request.method === 'OPTIONS') {
    ctx.response.status = 204
  }
  await next()
})

router.get('/qrblock', async (ctx, next) => {
  console.log(url, '---url')
  try {
    isLogin = false
    bot.stop ? bot.stop() : ''
  } catch (e) {
    // console.log(e)
  }
  try {
    // fs.unlinkSync('./sync-data.json')
  } catch (e) {
  }
  setTimeout(() => {
    bot = new Wechat()
    start()
    bot.start()
  }, 1500)
  await new Promise(resolve => {
    setTimeout(() => {
      const data = {
        url: url,
        isLogin: isLogin,
        loginTime: loginTime
      }
      ctx.body = data
      resolve()
    }, 5000)
  })
})

router.get('/nowdata', (ctx, next) => {
  const data = {
    url: url,
    isLogin: isLogin,
    loginTime: loginTime
  }
  ctx.body = data
})

router.get('/lsdata', async (ctx, next) => {
  let dbData = []
  try {
    // dbData = await db.select('lsdata')
  } catch (e) {
    console.log(e)
    ctx.body = {
      status: 5,
      data: e,
      mesg: 'database error'
    }
    return
  }
  const submitData = []
  for (let i of dbData) {
    submitData.push({
      id: i.id,
      date: i.date,
      user: i.user,
      url: i.url,
      warning: i.warning
    })
  }
  ctx.body = submitData
})

router.post('/add/word', async (ctx, next) => {
  const data = ctx.request.body.content.split(',')
  for (let i of data) {
    // db.insert('swdata', {
    //   word: i,
    //   date: parseInt(new Date().getTime() / 1000),
    //   count: 0
    // })
  }
  ctx.body = { msg: 'success' }
})

router.get('/get/word', async (ctx, next) => {
  // const data = await db.select('swdata')
  ctx.body = 'null' // data
})
console.log('start in 8080')
app.use(router.routes())
app.listen(8080)

try {
  bot = new Wechat(require('./sync-data.json'))
} catch (e) {
  bot = new Wechat()
}
start()
bot.start()

