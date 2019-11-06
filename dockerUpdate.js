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
router.post('/wechat', (err, res) => {
  console.log(res.body)
})

// process.exec('docker-compose pull info', () => {
// })

app.listen('2333')
