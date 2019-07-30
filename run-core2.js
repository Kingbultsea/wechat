require('babel-register')
const Wechat = require('./src/wechat.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
// const request = require('request')
const axios = require('axios')
const db = require('./src/database.js')

let bot
let url = null
let isLogin = false
let loginTime = 0

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
function start () {
  bot.on('uuid', uuid => {
    qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
      small: true
    })
    url = 'https://login.weixin.qq.com/qrcode/' + uuid
    console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
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

    switch (msg.MsgType) {
      case bot.CONF.MSGTYPE_TEXT:
        sendUrlMesage(msg)
        break
      case 49:
        console.log('公众号文章推送')
        const userId = msg.FromUserName
        bot._getmpData(userId).then(article => {
          try {
            for (let i of article) {
              analyzeContent(i, msg)
            }
          } catch (e) {
            console.log(e)
          }
        })
        break
    }
  })

  function sendUrlMesage (msg) {
    const data = {
      Url: msg.OriginalContent.replace(/&amp;/g, '&'),
      Title: undefined
    }
    // console.log('自主发送消息推送')
    analyzeContent(data, msg)
  }

  function analyzeContent (data, msg) {
    axios.get(data.Url).then(async res => {
      const keyGroups = await db.select('swdata')
      /* ['雪松控股', '张劲', '张主席', '张老板', '创始人', '主席', '董事局主席', '董事长', '政协委员', '总商会副会长',
          '习近平', '李克强', '李希', '马兴瑞', '张硕辅', '温国辉', '周亚伟', '齐翔腾达', '希努尔', '雪松国际信托', '雪松信托', '大金所',
          '大连金融资产交易所', '正勤金融', '雪松普惠', '轻松盈', '广州证行互联网金融信息服务有限公司',
          '三个万亿', '三万亿', '水密舱', '100%誓言', '强根造血', '毕节30亿扶贫', '旅游扶贫', '文旅扶贫', '产业扶贫', '六大产业集团', '供通云', '雪松社区', '雪松系',
          '李克强', '汪洋', '王沪宁', '赵乐际', '韩正', '栗战书'] */ // 抓取推送文章的关键词
      const _content = /<divclass="rich_media_content"id="js_content">(.+?)<\/div>/g.exec(res.data.replace(/\s+/g, ''))
      const content = _content[1].replace(/<\/?.+?>/g, '') // 删除标签

      const _title = /<h2class="rich_media_title"id="activity-name">(.+?)<\/h2>/.exec(res.data.replace(/\s+/g, ''))
      const title = _title[1].replace(/<\/?.+?>/g, '') // 删除标签

      // 从哪推送
      const _from = /<ahref="javascript:void\(0\);"id="js_name">(.+?)<\/a>/.exec(res.data.replace(/\s+/g, ''))
      const from = _from[1].replace(/<\/?.+?>/g, '') // 删除标签
      console.log('自主推送查询主体', from)

      let countKeys = []

      keyGroups.forEach(v => {
        if (content.includes(v.word)) {
          const reg = new RegExp(v.word, 'g')
          let times = 0
          while (true) {
            const r = reg.exec(content)
            if (!r) {
              break
            }
            times += 1
          }
          countKeys.push({ key: v.word, times, count: v.count + times, id: v.id })
        }
      })

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
      db.insert('lsdata', {
        date: +msg.CreateTime,
        user: sentor,
        url: data.Url,
        warning: warningContent
      })

      for (let i in bot.contacts) {
        setTimeout(() => {
          if (bot.contacts[i].OrignalRemarkName === '大佬') {
            // wechat 推送
            bot.sendMsg(`推文标题：\r\n    ${data.Title || title}\r\n\r\n推文主体：\r\n    ${sentor}\r\n\r\n推文警报：\r\n${warningContent}\r\n\r\n推送时间:\r\n    ${date}\r\n\r\n推文链接：${data.Url}`, bot.contacts[i].UserName)
              .catch(err => {
                // bot.emit('error', err)
              })
          }
        }, time)
        time += 1000
      }
    }).catch(() => {
      console.log('不是有效的域名')
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
    console.log(e)
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
  const dbData = await db.select('lsdata')
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
    db.insert('swdata', {
      word: i,
      date: parseInt(new Date().getTime() / 1000),
      count: 0
    })
  }
  ctx.body = { msg: 'success' }
})

router.get('/get/word', async (ctx, next) => {
  const data = await db.select('swdata')
  ctx.body = data
})
console.log('start in 3001')
app.use(router.routes())
app.listen(3001)
