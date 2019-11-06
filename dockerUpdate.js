// const process = require('child_process')
const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa()
const router = new Router()

app.use(router.routes())
// const instruct = [
//   'docker-compose pull',
//   'docker-compose stop',
//   'docker-compose rm',
//   'docker-compose up -d'
// ]

// eslint-disable-next-line handle-callback-err
router.post('/wechat', async ctx => {
  const data = await parsePostData(ctx)
  console.log(
    JSON.parse(data)
  )
  // console.log(Object.getOwnPropertyNames(ctx), Object.getOwnPropertyNames(ctx.request))
})

function parseQueryStr (queryStr) {
  let queryData = {}
  let queryStrList = queryStr.split('&')
  console.log(queryStrList)
  for (let [ index, queryStr ] of queryStrList.entries() ) {
    let itemList = queryStr.split('=')
    queryData[ itemList[0] ] = decodeURIComponent(itemList[1])
  }
  return queryData
}

function parsePostData (ctx) {
  return new Promise((resolve, reject) => {
    try {
      let postdata = ''
      ctx.req.addListener('data', data => {
        postdata += data
      })
      ctx.req.addListener('end', () => {
        // let parseData = parseQueryStr(postdata)  json 暂时不需要key value
        resolve(postdata)
      })
    } catch (err) {
      reject(err)
    }
  })
}

// process.exec('docker-compose pull info', () => {
// })

app.listen('2333')
