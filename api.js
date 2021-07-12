const request = require('request')

// eslint-disable-next-line handle-callback-err,standard/object-curly-even-spacing
request.post({
  url: 'http://127.0.0.1:2333/wechat',
  body: "{'a': '1'}",
  headers: {
    'Content-Type': 'application/json'
  }
// eslint-disable-next-line handle-callback-err
}, (error, response, body) => {
  console.log(body) // 发生中文乱码情况
})
