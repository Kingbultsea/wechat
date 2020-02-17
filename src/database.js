const rds = require('ali-rds')
const fs = require('fs')
const path = require('path')
const result = JSON.parse(fs.readFileSync(path.join(__dirname, '../db.config.json')))

module.exports = rds(result.wechat_supervisory)
