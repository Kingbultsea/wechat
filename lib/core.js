'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AlreadyLogoutError = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bl = require('bl');

var _bl2 = _interopRequireDefault(_bl);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _formData = require('form-data');

var _formData2 = _interopRequireDefault(_formData);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug3.default)('core');

var AlreadyLogoutError = exports.AlreadyLogoutError = function (_Error) {
  _inherits(AlreadyLogoutError, _Error);

  function AlreadyLogoutError() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'already logout';

    _classCallCheck(this, AlreadyLogoutError);

    // fuck the babel
    var _this = _possibleConstructorReturn(this, (AlreadyLogoutError.__proto__ || Object.getPrototypeOf(AlreadyLogoutError)).call(this, message));

    _this.constructor = AlreadyLogoutError;
    _this.__proto__ = AlreadyLogoutError.prototype;
    return _this;
  }

  return AlreadyLogoutError;
}(Error);

var WechatCore = function () {
  function WechatCore(data) {
    _classCallCheck(this, WechatCore);

    this.PROP = {
      uuid: '',
      uin: '',
      sid: '',
      skey: '',
      passTicket: '',
      formatedSyncKey: '',
      webwxDataTicket: '',
      syncKey: {
        List: []
      }
    };
    this.CONF = (0, _util.getCONF)();
    this.COOKIE = {};
    this.user = {};
    if (data) {
      this.botData = data;
    }

    this.request = new _util.Request({
      Cookie: this.COOKIE
    });
  }

  _createClass(WechatCore, [{
    key: 'getUUID',
    value: function getUUID() {
      var _this2 = this;

      return Promise.resolve().then(function () {
        return _this2.request({
          method: 'POST',
          url: _this2.CONF.API_jsLogin
        }).then(function (res) {
          var window = {
            QRLogin: {}
            // res.data: "window.QRLogin.code = xxx; ..."
            // eslint-disable-next-line
          };eval(res.data);
          _util.assert.equal(window.QRLogin.code, 200, res);

          _this2.PROP.uuid = window.QRLogin.uuid;
          return window.QRLogin.uuid;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取UUID失败';
        throw err;
      });
    }
  }, {
    key: 'checkLogin',
    value: function checkLogin() {
      var _this3 = this;

      return Promise.resolve().then(function () {
        var params = {
          'tip': 0,
          'uuid': _this3.PROP.uuid,
          'loginicon': true
        };
        return _this3.request({
          method: 'GET',
          url: _this3.CONF.API_login,
          params: params
        }).then(function (res) {
          var window = {};

          // eslint-disable-next-line
          eval(res.data);

          _util.assert.notEqual(window.code, 400, res);

          if (window.code === 200) {
            _this3.CONF = (0, _util.getCONF)(window.redirect_uri.match(/(?:\w+\.)+\w+/)[0]);
            _this3.rediUri = window.redirect_uri;
          } else if (window.code === 201 && window.userAvatar) {
            // this.user.userAvatar = window.userAvatar
          }
          return window;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取手机确认登录信息失败';
        throw err;
      });
    }
  }, {
    key: 'login',
    value: function login() {
      var _this4 = this;

      return Promise.resolve().then(function () {
        return _this4.request({
          method: 'GET',
          url: _this4.rediUri,
          params: {
            fun: 'new'
          }
        }).then(function (res) {
          var pm = res.data.match(/<ret>(.*)<\/ret>/);
          if (pm && pm[1] === '0') {
            _this4.PROP.skey = res.data.match(/<skey>(.*)<\/skey>/)[1];
            _this4.PROP.sid = res.data.match(/<wxsid>(.*)<\/wxsid>/)[1];
            _this4.PROP.uin = res.data.match(/<wxuin>(.*)<\/wxuin>/)[1];
            console.log(res.data, '登陆的时候会拥有');
            _this4.PROP.passTicket = res.data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1];
          }
          if (res.headers['set-cookie']) {
            res.headers['set-cookie'].forEach(function (item) {
              if (/webwx.*?data.*?ticket/i.test(item)) {
                _this4.PROP.webwxDataTicket = item.match(/=(.*?);/)[1];
              } else if (/wxuin/i.test(item)) {
                _this4.PROP.uin = item.match(/=(.*?);/)[1];
              } else if (/wxsid/i.test(item)) {
                _this4.PROP.sid = item.match(/=(.*?);/)[1];
              }
            });
          }
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '登录失败';
        throw err;
      });
    }
  }, {
    key: 'init',
    value: function init() {
      var _this5 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this5.PROP.passTicket,
          'skey': _this5.PROP.skey,
          'r': ~new Date()
        };
        var data = {
          BaseRequest: _this5.getBaseRequest()
        };
        return _this5.request({
          method: 'POST',
          url: _this5.CONF.API_webwxinit,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          if (data.BaseResponse.Ret == _this5.CONF.SYNCCHECK_RET_LOGOUT) {
            throw new AlreadyLogoutError();
          }
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          _this5.PROP.skey = data.SKey || _this5.PROP.skey;
          _this5.updateSyncKey(data);
          Object.assign(_this5.user, data.User);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '微信初始化失败';
        throw err;
      });
    }
  }, {
    key: 'getmpData',
    value: function getmpData() {
      var _this6 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this6.PROP.passTicket,
          'skey': _this6.PROP.skey,
          'r': ~new Date()
        };
        var data = {
          BaseRequest: _this6.getBaseRequest()
        };
        return _this6.request({
          method: 'POST',
          url: _this6.CONF.API_webwxinit,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          /* console.log(
            data.MPSubscribeMsgList, '我想要的mp信息init'
          ) */
          return data.MPSubscribeMsgList;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '微信初始化失败';
        throw err;
      });
    }
  }, {
    key: 'notifyMobile',
    value: function notifyMobile(to) {
      var _this7 = this;

      return Promise.resolve().then(function () {
        var params = {
          pass_ticket: _this7.PROP.passTicket,
          lang: 'zh_CN'
        };
        var data = {
          'BaseRequest': _this7.getBaseRequest(),
          'Code': to ? 1 : 3,
          'FromUserName': _this7.user['UserName'],
          'ToUserName': to || _this7.user['UserName'],
          'ClientMsgId': (0, _util.getClientMsgId)()
        };
        return _this7.request({
          method: 'POST',
          url: _this7.CONF.API_webwxstatusnotify,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '手机状态通知失败';
        throw err;
      });
    }
  }, {
    key: 'getContact',
    value: function getContact() {
      var _this8 = this;

      var seq = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      return Promise.resolve().then(function () {
        var params = {
          'lang': 'zh_CN',
          'pass_ticket': _this8.PROP.passTicket,
          'seq': seq,
          'skey': _this8.PROP.skey,
          'r': +new Date()
        };
        return _this8.request({
          method: 'POST',
          url: _this8.CONF.API_webwxgetcontact,
          params: params
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);

          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取通讯录失败';
        throw err;
      });
    }
  }, {
    key: 'batchGetContact',
    value: function batchGetContact(contacts) {
      var _this9 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this9.PROP.passTicket,
          'type': 'ex',
          'r': +new Date(),
          'lang': 'zh_CN'
        };
        var data = {
          'BaseRequest': _this9.getBaseRequest(),
          'Count': contacts.length,
          'List': contacts
        };
        return _this9.request({
          method: 'POST',
          url: _this9.CONF.API_webwxbatchgetcontact,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);

          return data.ContactList;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '批量获取联系人失败';
        throw err;
      });
    }
  }, {
    key: 'statReport',
    value: function statReport(text) {
      var _this10 = this;

      return Promise.resolve().then(function () {
        text = text || {
          'type': '[action-record]',
          'data': {
            'actions': [{
              'type': 'click',
              'action': '发送框',
              'time': +new Date()
            }]
          }
        };
        text = JSON.stringify(text);
        var params = {
          'pass_ticket': _this10.PROP.passTicket,
          'fun': 'new',
          'lang': 'zh_CN'
        };
        var data = {
          'BaseRequest': _this10.getBaseRequest(),
          'Count': 1,
          'List': [{
            'Text': text,
            'Type': 1
          }]
        };
        return _this10.request({
          method: 'POST',
          url: _this10.CONF.API_webwxreport,
          params: params,
          data: data
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '状态报告失败';
        throw err;
      });
    }
  }, {
    key: 'syncCheck',
    value: function syncCheck() {
      var _this11 = this;

      return Promise.resolve().then(function () {
        var params = {
          'r': +new Date(),
          'sid': _this11.PROP.sid,
          'uin': _this11.PROP.uin,
          'skey': _this11.PROP.skey,
          'deviceid': (0, _util.getDeviceID)(),
          'synckey': _this11.PROP.formatedSyncKey
        };
        return _this11.request({
          method: 'GET',
          url: _this11.CONF.API_synccheck,
          params: params
        }).then(function (res) {
          var window = {
            synccheck: {}
          };

          try {
            // eslint-disable-next-line
            eval(res.data);
          } catch (ex) {
            window.synccheck = { retcode: '0', selector: '0' };
          }
          if (window.synccheck.retcode == _this11.CONF.SYNCCHECK_RET_LOGOUT) {
            throw new AlreadyLogoutError();
          }
          _util.assert.equal(window.synccheck.retcode, _this11.CONF.SYNCCHECK_RET_SUCCESS, res);
          return window.synccheck.selector;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '同步失败';
        throw err;
      });
    }
  }, {
    key: 'sync',
    value: function sync() {
      var _this12 = this;

      return Promise.resolve().then(function () {
        var params = {
          'sid': _this12.PROP.sid,
          'skey': _this12.PROP.skey,
          'pass_ticket': _this12.PROP.passTicket,
          'lang': 'zh_CN'
        };
        var data = {
          'BaseRequest': _this12.getBaseRequest(),
          'SyncKey': _this12.PROP.syncKey,
          'rr': ~new Date()
        };
        return _this12.request({
          method: 'POST',
          url: _this12.CONF.API_webwxsync,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          if (data.BaseResponse.Ret == _this12.CONF.SYNCCHECK_RET_LOGOUT) {
            throw new AlreadyLogoutError();
          }
          _util.assert.equal(data.BaseResponse.Ret, 0, res);

          _this12.updateSyncKey(data);
          _this12.PROP.skey = data.SKey || _this12.PROP.skey;
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取新信息失败';
        throw err;
      });
    }
  }, {
    key: 'updateSyncKey',
    value: function updateSyncKey(data) {
      if (data.SyncKey) {
        this.PROP.syncKey = data.SyncKey;
      }
      if (data.SyncCheckKey) {
        var synckeylist = [];
        for (var e = data.SyncCheckKey.List, o = 0, n = e.length; n > o; o++) {
          synckeylist.push(e[o]['Key'] + '_' + e[o]['Val']);
        }
        this.PROP.formatedSyncKey = synckeylist.join('|');
      } else if (!this.PROP.formatedSyncKey && data.SyncKey) {
        var _synckeylist = [];
        for (var _e = data.SyncKey.List, _o = 0, _n = _e.length; _n > _o; _o++) {
          _synckeylist.push(_e[_o]['Key'] + '_' + _e[_o]['Val']);
        }
        this.PROP.formatedSyncKey = _synckeylist.join('|');
      }
    }
  }, {
    key: 'logout',
    value: function logout() {
      var _this13 = this;

      return Promise.resolve().then(function () {
        var params = {
          redirect: 1,
          type: 0,
          skey: _this13.PROP.skey,
          lang: 'zh_CN'

          // data加上会出错，不加data也能登出
          // let data = {
          //   sid: this.PROP.sid,
          //   uin: this.PROP.uin
          // }
        };return _this13.request({
          method: 'POST',
          url: _this13.CONF.API_webwxlogout,
          params: params
        }).then(function (res) {
          return '登出成功';
        }).catch(function (err) {
          debug(err);
          return '可能登出成功';
        });
      });
    }
  }, {
    key: 'sendText',
    value: function sendText(msg, to) {
      var _this14 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this14.PROP.passTicket,
          'lang': 'zh_CN'
        };
        var clientMsgId = (0, _util.getClientMsgId)();
        var data = {
          'BaseRequest': _this14.getBaseRequest(),
          'Scene': 0,
          'Msg': {
            'Type': _this14.CONF.MSGTYPE_TEXT,
            'Content': msg,
            'FromUserName': _this14.user['UserName'],
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
          }
        };
        return _this14.request({
          method: 'POST',
          url: _this14.CONF.API_webwxsendmsg,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '发送文本信息失败';
        throw err;
      });
    }
  }, {
    key: 'sendEmoticon',
    value: function sendEmoticon(id, to) {
      var _this15 = this;

      return Promise.resolve().then(function () {
        var params = {
          'fun': 'sys',
          'pass_ticket': _this15.PROP.passTicket,
          'lang': 'zh_CN'
        };
        var clientMsgId = (0, _util.getClientMsgId)();
        var data = {
          'BaseRequest': _this15.getBaseRequest(),
          'Scene': 0,
          'Msg': {
            'Type': _this15.CONF.MSGTYPE_EMOTICON,
            'EmojiFlag': 2,
            'FromUserName': _this15.user['UserName'],
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
          }
        };

        if (id.indexOf('@') === 0) {
          data.Msg.MediaId = id;
        } else {
          data.Msg.EMoticonMd5 = id;
        }

        return _this15.request({
          method: 'POST',
          url: _this15.CONF.API_webwxsendemoticon,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '发送表情信息失败';
        throw err;
      });
    }

    // file: Stream, Buffer, File, Blob

  }, {
    key: 'uploadMedia',
    value: function uploadMedia(file, filename, toUserName) {
      var _this16 = this;

      return Promise.resolve().then(function () {
        var name = void 0,
            type = void 0,
            size = void 0,
            ext = void 0,
            mediatype = void 0,
            data = void 0;
        return new Promise(function (resolve, reject) {
          if (typeof File !== 'undefined' && file.constructor == File || typeof Blob !== 'undefined' && file.constructor == Blob) {
            name = file.name || 'file';
            type = file.type;
            size = file.size;
            data = file;
            return resolve();
          } else if (Buffer.isBuffer(file)) {
            if (!filename) {
              return reject(new Error('文件名未知'));
            }
            name = filename;
            type = _mime2.default.lookup(name);
            size = file.length;
            data = file;
            return resolve();
          } else if (file.readable) {
            if (!file.path && !filename) {
              return reject(new Error('文件名未知'));
            }
            name = _path2.default.basename(file.path || filename);
            type = _mime2.default.lookup(name);
            file.pipe((0, _bl2.default)(function (err, buffer) {
              if (err) {
                return reject(err);
              }
              size = buffer.length;
              data = buffer;
              return resolve();
            }));
          }
        }).then(function () {
          ext = name.match(/.*\.(.*)/);
          if (ext) {
            ext = ext[1].toLowerCase();
          } else {
            ext = '';
          }

          switch (ext) {
            case 'bmp':
            case 'jpeg':
            case 'jpg':
            case 'png':
              mediatype = 'pic';
              break;
            case 'mp4':
              mediatype = 'video';
              break;
            default:
              mediatype = 'doc';
          }

          var clientMsgId = (0, _util.getClientMsgId)();

          var uploadMediaRequest = JSON.stringify({
            BaseRequest: _this16.getBaseRequest(),
            ClientMediaId: clientMsgId,
            TotalLen: size,
            StartPos: 0,
            DataLen: size,
            MediaType: 4,
            UploadType: 2,
            FromUserName: _this16.user.UserName,
            ToUserName: toUserName || _this16.user.UserName
          });

          var form = new _formData2.default();
          form.append('name', name);
          form.append('type', type);
          form.append('lastModifiedDate', new Date().toGMTString());
          form.append('size', size);
          form.append('mediatype', mediatype);
          form.append('uploadmediarequest', uploadMediaRequest);
          form.append('webwx_data_ticket', _this16.PROP.webwxDataTicket);
          form.append('pass_ticket', encodeURI(_this16.PROP.passTicket));
          form.append('filename', data, {
            filename: name,
            contentType: type,
            knownLength: size
          });
          return new Promise(function (resolve, reject) {
            if (_util.isStandardBrowserEnv) {
              return resolve({
                data: form,
                headers: {}
              });
            } else {
              form.pipe((0, _bl2.default)(function (err, buffer) {
                if (err) {
                  return reject(err);
                }
                return resolve({
                  data: buffer,
                  headers: form.getHeaders()
                });
              }));
            }
          });
        }).then(function (data) {
          var params = {
            f: 'json'
          };

          return _this16.request({
            method: 'POST',
            url: _this16.CONF.API_webwxuploadmedia,
            headers: data.headers,
            params: params,
            data: data.data
          });
        }).then(function (res) {
          var data = res.data;
          var mediaId = data.MediaId;
          _util.assert.ok(mediaId, res);

          return {
            name: name,
            size: size,
            ext: ext,
            mediatype: mediatype,
            mediaId: mediaId
          };
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '上传媒体文件失败';
        throw err;
      });
    }
  }, {
    key: 'sendPic',
    value: function sendPic(mediaId, to) {
      var _this17 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this17.PROP.passTicket,
          'fun': 'async',
          'f': 'json',
          'lang': 'zh_CN'
        };
        var clientMsgId = (0, _util.getClientMsgId)();
        var data = {
          'BaseRequest': _this17.getBaseRequest(),
          'Scene': 0,
          'Msg': {
            'Type': _this17.CONF.MSGTYPE_IMAGE,
            'MediaId': mediaId,
            'FromUserName': _this17.user.UserName,
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
          }
        };
        return _this17.request({
          method: 'POST',
          url: _this17.CONF.API_webwxsendmsgimg,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '发送图片失败';
        throw err;
      });
    }
  }, {
    key: 'sendVideo',
    value: function sendVideo(mediaId, to) {
      var _this18 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this18.PROP.passTicket,
          'fun': 'async',
          'f': 'json',
          'lang': 'zh_CN'
        };
        var clientMsgId = (0, _util.getClientMsgId)();
        var data = {
          'BaseRequest': _this18.getBaseRequest(),
          'Scene': 0,
          'Msg': {
            'Type': _this18.CONF.MSGTYPE_VIDEO,
            'MediaId': mediaId,
            'FromUserName': _this18.user.UserName,
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
          }
        };
        return _this18.request({
          method: 'POST',
          url: _this18.CONF.API_webwxsendmsgvedio,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '发送视频失败';
        throw err;
      });
    }
  }, {
    key: 'sendDoc',
    value: function sendDoc(mediaId, name, size, ext, to) {
      var _this19 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this19.PROP.passTicket,
          'fun': 'async',
          'f': 'json',
          'lang': 'zh_CN'
        };
        var clientMsgId = (0, _util.getClientMsgId)();
        var data = {
          'BaseRequest': _this19.getBaseRequest(),
          'Scene': 0,
          'Msg': {
            'Type': _this19.CONF.APPMSGTYPE_ATTACH,
            'Content': '<appmsg appid=\'wxeb7ec651dd0aefa9\' sdkver=\'\'><title>' + name + '</title><des></des><action></action><type>6</type><content></content><url></url><lowurl></lowurl><appattach><totallen>' + size + '</totallen><attachid>' + mediaId + '</attachid><fileext>' + ext + '</fileext></appattach><extinfo></extinfo></appmsg>',
            'FromUserName': _this19.user.UserName,
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
          }
        };
        return _this19.request({
          method: 'POST',
          url: _this19.CONF.API_webwxsendappmsg,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '发送文件失败';
        throw err;
      });
    }
  }, {
    key: 'forwardMsg',
    value: function forwardMsg(msg, to) {
      var _this20 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this20.PROP.passTicket,
          'fun': 'async',
          'f': 'json',
          'lang': 'zh_CN'
        };
        var clientMsgId = (0, _util.getClientMsgId)();
        var data = {
          'BaseRequest': _this20.getBaseRequest(),
          'Scene': 2,
          'Msg': {
            'Type': msg.MsgType,
            'MediaId': '',
            'Content': msg.Content.replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
            'FromUserName': _this20.user.UserName,
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
          }
        };
        var url = void 0,
            pm = void 0;
        switch (msg.MsgType) {
          case _this20.CONF.MSGTYPE_TEXT:
            url = _this20.CONF.API_webwxsendmsg;
            if (msg.SubMsgType === _this20.CONF.MSGTYPE_LOCATION) {
              data.Msg.Type = _this20.CONF.MSGTYPE_LOCATION;
              data.Msg.Content = msg.OriContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            }
            break;
          case _this20.CONF.MSGTYPE_IMAGE:
            url = _this20.CONF.API_webwxsendmsgimg;
            break;
          case _this20.CONF.MSGTYPE_EMOTICON:
            url = _this20.CONF.API_webwxsendemoticon;
            params.fun = 'sys';
            data.Msg.EMoticonMd5 = msg.Content.replace(/^[\s\S]*?md5\s?=\s?"(.*?)"[\s\S]*?$/, '$1');
            if (!data.Msg.EMoticonMd5) {
              throw new Error('商店表情不能转发');
            }
            data.Msg.EmojiFlag = 2;
            data.Scene = 0;
            delete data.Msg.MediaId;
            delete data.Msg.Content;
            break;
          case _this20.CONF.MSGTYPE_MICROVIDEO:
          case _this20.CONF.MSGTYPE_VIDEO:
            url = _this20.CONF.API_webwxsendmsgvedio;
            data.Msg.Type = _this20.CONF.MSGTYPE_VIDEO;
            break;
          case _this20.CONF.MSGTYPE_APP:
            url = _this20.CONF.API_webwxsendappmsg;
            data.Msg.Type = msg.AppMsgType;
            data.Msg.Content = data.Msg.Content.replace(/^[\s\S]*?(<appmsg[\s\S]*?<attachid>)[\s\S]*?(<\/attachid>[\s\S]*?<\/appmsg>)[\s\S]*?$/, '$1' + msg.MediaId + '$2');
            break;
          default:
            throw new Error('该消息类型不能直接转发');
        }
        return _this20.request({
          method: 'POST',
          url: url,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '转发消息失败';
        throw err;
      });
    }
  }, {
    key: 'getMsgImg',
    value: function getMsgImg(msgId) {
      var _this21 = this;

      return Promise.resolve().then(function () {
        var params = {
          MsgID: msgId,
          skey: _this21.PROP.skey,
          type: 'big'
        };

        return _this21.request({
          method: 'GET',
          url: _this21.CONF.API_webwxgetmsgimg,
          params: params,
          responseType: 'arraybuffer'
        }).then(function (res) {
          return {
            data: res.data,
            type: res.headers['content-type']
          };
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取图片或表情失败';
        throw err;
      });
    }
  }, {
    key: 'getVideo',
    value: function getVideo(msgId) {
      var _this22 = this;

      return Promise.resolve().then(function () {
        var params = {
          MsgID: msgId,
          skey: _this22.PROP.skey
        };

        return _this22.request({
          method: 'GET',
          url: _this22.CONF.API_webwxgetvideo,
          headers: {
            'Range': 'bytes=0-'
          },
          params: params,
          responseType: 'arraybuffer'
        }).then(function (res) {
          return {
            data: res.data,
            type: res.headers['content-type']
          };
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取视频失败';
        throw err;
      });
    }
  }, {
    key: 'getVoice',
    value: function getVoice(msgId) {
      var _this23 = this;

      return Promise.resolve().then(function () {
        var params = {
          MsgID: msgId,
          skey: _this23.PROP.skey
        };

        return _this23.request({
          method: 'GET',
          url: _this23.CONF.API_webwxgetvoice,
          params: params,
          responseType: 'arraybuffer'
        }).then(function (res) {
          return {
            data: res.data,
            type: res.headers['content-type']
          };
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取声音失败';
        throw err;
      });
    }
  }, {
    key: 'getHeadImg',
    value: function getHeadImg(HeadImgUrl) {
      var _this24 = this;

      return Promise.resolve().then(function () {
        var url = _this24.CONF.origin + HeadImgUrl;
        return _this24.request({
          method: 'GET',
          url: url,
          responseType: 'arraybuffer'
        }).then(function (res) {
          return {
            data: res.data,
            type: res.headers['content-type']
          };
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取头像失败';
        throw err;
      });
    }
  }, {
    key: 'getDoc',
    value: function getDoc(FromUserName, MediaId, FileName) {
      var _this25 = this;

      return Promise.resolve().then(function () {
        var params = {
          sender: FromUserName,
          mediaid: MediaId,
          filename: FileName,
          fromuser: _this25.user.UserName,
          pass_ticket: _this25.PROP.passTicket,
          webwx_data_ticket: _this25.PROP.webwxDataTicket
        };
        return _this25.request({
          method: 'GET',
          url: _this25.CONF.API_webwxdownloadmedia,
          params: params,
          responseType: 'arraybuffer'
        }).then(function (res) {
          return {
            data: res.data,
            type: res.headers['content-type']
          };
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '获取文件失败';
        throw err;
      });
    }
  }, {
    key: 'verifyUser',
    value: function verifyUser(UserName, Ticket) {
      var _this26 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this26.PROP.passTicket,
          'lang': 'zh_CN'
        };
        var data = {
          'BaseRequest': _this26.getBaseRequest(),
          'Opcode': 3,
          'VerifyUserListSize': 1,
          'VerifyUserList': [{
            'Value': UserName,
            'VerifyUserTicket': Ticket
          }],
          'VerifyContent': '',
          'SceneListCount': 1,
          'SceneList': [33],
          'skey': _this26.PROP.skey
        };
        return _this26.request({
          method: 'POST',
          url: _this26.CONF.API_webwxverifyuser,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '通过好友请求失败';
        throw err;
      });
    }

    /**
     * 添加好友
     * @param UserName 待添加用户的UserName
     * @param content
     * @returns {Promise.<TResult>}
     */

  }, {
    key: 'addFriend',
    value: function addFriend(UserName) {
      var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '我是' + this.user.NickName;

      var params = {
        'pass_ticket': this.PROP.passTicket,
        'lang': 'zh_CN'
      };

      var data = {
        'BaseRequest': this.getBaseRequest(),
        'Opcode': 2,
        'VerifyUserListSize': 1,
        'VerifyUserList': [{
          'Value': UserName,
          'VerifyUserTicket': ''
        }],
        'VerifyContent': content,
        'SceneListCount': 1,
        'SceneList': [33],
        'skey': this.PROP.skey
      };

      return this.request({
        method: 'POST',
        url: this.CONF.API_webwxverifyuser,
        params: params,
        data: data
      }).then(function (res) {
        var data = res.data;
        _util.assert.equal(data.BaseResponse.Ret, 0, res);
        return data;
      }).catch(function (err) {
        debug(err);
        err.tips = '添加好友失败';
        throw err;
      });
    }

    // Topic: Chatroom name
    // MemberList format:
    // [
    //   {"UserName":"@250d8d156ad9f8b068c2e3df3464ecf2"},
    //   {"UserName":"@42d725733741de6ac53cbe3738d8dd2e"}
    // ]

  }, {
    key: 'createChatroom',
    value: function createChatroom(Topic, MemberList) {
      var _this27 = this;

      return Promise.resolve().then(function () {
        var params = {
          'pass_ticket': _this27.PROP.passTicket,
          'lang': 'zh_CN',
          'r': ~new Date()
        };
        var data = {
          BaseRequest: _this27.getBaseRequest(),
          MemberCount: MemberList.length,
          MemberList: MemberList,
          Topic: Topic
        };
        return _this27.request({
          method: 'POST',
          url: _this27.CONF.API_webwxcreatechatroom,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '创建群失败';
        throw err;
      });
    }

    // fun: 'addmember' or 'delmember' or 'invitemember'

  }, {
    key: 'updateChatroom',
    value: function updateChatroom(ChatRoomUserName, MemberList, fun) {
      var _this28 = this;

      return Promise.resolve().then(function () {
        var params = {
          fun: fun
        };
        var data = {
          BaseRequest: _this28.getBaseRequest(),
          ChatRoomName: ChatRoomUserName
        };
        if (fun === 'addmember') {
          data.AddMemberList = MemberList.toString();
        } else if (fun === 'delmember') {
          data.DelMemberList = MemberList.toString();
        } else if (fun === 'invitemember') {
          data.InviteMemberList = MemberList.toString();
        }
        return _this28.request({
          method: 'POST',
          url: _this28.CONF.API_webwxupdatechatroom,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '邀请或踢出群成员失败';
        throw err;
      });
    }

    // OP: 1 联系人置顶 0 取消置顶
    // 若不传RemarkName，则会覆盖以设置的联系人备注名

  }, {
    key: 'opLog',
    value: function opLog(UserName, OP, RemarkName) {
      var _this29 = this;

      return Promise.resolve().then(function () {
        var params = {
          pass_ticket: _this29.PROP.passTicket
        };
        var data = {
          BaseRequest: _this29.getBaseRequest(),
          CmdId: 3,
          OP: OP,
          RemarkName: RemarkName,
          UserName: UserName
        };
        return _this29.request({
          method: 'POST',
          url: _this29.CONF.API_webwxoplog,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '置顶或取消置顶失败';
        throw err;
      });
    }
  }, {
    key: 'updateRemarkName',
    value: function updateRemarkName(UserName, RemarkName) {
      var _this30 = this;

      return Promise.resolve().then(function () {
        var params = {
          pass_ticket: _this30.PROP.passTicket,
          'lang': 'zh_CN'
        };
        var data = {
          BaseRequest: _this30.getBaseRequest(),
          CmdId: 2,
          RemarkName: RemarkName,
          UserName: UserName
        };
        return _this30.request({
          method: 'POST',
          url: _this30.CONF.API_webwxoplog,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        err.tips = '设置用户标签失败';
        throw err;
      });
    }
  }, {
    key: 'updateChatRoomName',
    value: function updateChatRoomName(ChatRoomUserName, NewName) {
      var _this31 = this;

      return Promise.resolve().then(function () {
        var params = {
          'fun': 'modtopic'
        };
        var data = {
          BaseRequest: _this31.getBaseRequest(),
          ChatRoomName: ChatRoomUserName,
          NewTopic: NewName
        };
        return _this31.request({
          method: 'POST',
          url: _this31.CONF.API_webwxupdatechatroom,
          params: params,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
        });
      }).catch(function (err) {
        debug(err);
        throw new Error('更新群名失败');
      });
    }
  }, {
    key: 'revokeMsg',
    value: function revokeMsg(msgId, toUserName) {
      var _this32 = this;

      return Promise.resolve().then(function () {
        var data = {
          BaseRequest: _this32.getBaseRequest(),
          SvrMsgId: msgId,
          ToUserName: toUserName,
          ClientMsgId: (0, _util.getClientMsgId)()
        };
        return _this32.request({
          method: 'POST',
          url: _this32.CONF.API_webwxrevokemsg,
          data: data
        }).then(function (res) {
          var data = res.data;
          _util.assert.equal(data.BaseResponse.Ret, 0, res);
          return data;
        });
      }).catch(function (err) {
        debug(err);
        throw new Error('撤回消息失败');
      });
    }
  }, {
    key: 'getBaseRequest',
    value: function getBaseRequest() {
      return {
        Uin: parseInt(this.PROP.uin),
        Sid: this.PROP.sid,
        Skey: this.PROP.skey,
        DeviceID: (0, _util.getDeviceID)()
      };
    }
  }, {
    key: 'botData',
    get: function get() {
      return {
        PROP: this.PROP,
        CONF: this.CONF,
        COOKIE: this.COOKIE,
        user: this.user
      };
    },
    set: function set(data) {
      var _this33 = this;

      Object.keys(data).forEach(function (key) {
        Object.assign(_this33[key], data[key]);
      });
    }
  }]);

  return WechatCore;
}();

exports.default = WechatCore;
//# sourceMappingURL=core.js.map