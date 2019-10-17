'use strict';

var rds = require('ali-rds');
var fs = require('fs');
var path = require('path');
var result = JSON.parse(fs.readFileSync(path.join(__dirname, '../db.config.json')));

module.exports = rds(result.wechat_supervisory);
//# sourceMappingURL=database.js.map