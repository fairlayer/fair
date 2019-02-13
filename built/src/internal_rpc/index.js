// Internal RPC serves requests made by the user's browser or by the merchant server app
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var Router = require('../router');
var withdraw = require('../offchain/withdraw');
/*
let setBrowser = (ws) => {
  // new window replaces old one
  if (me.browser && me.browser.readyState == 1) {
    me.browser.send(JSON.stringify({already_opened: true}))
  }

  me.browser = ws
}
*/
module.exports = function (ws, json) { return __awaiter(_this, void 0, void 0, function () {
    var resp, result, _a, ch, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                // prevents all kinds of CSRF and DNS rebinding
                // strong coupling between the console and the browser client
                // public RPC, return cached_result only
                if (json.auth_code != PK.auth_code && ws != 'admin') {
                    resp = json.method == 'login'
                        ? { alert: 'Invalid auth_code, restart node' }
                        : cached_result;
                    ws[ws.end ? 'end' : 'send'](JSON.stringify(resp));
                    return [2 /*return*/];
                }
                if (ws.send && json.is_wallet && !me.browsers.includes(ws)) {
                    me.browsers.push(ws);
                    //setBrowser(ws)
                }
                result = {};
                _a = json.method;
                switch (_a) {
                    case 'load': return [3 /*break*/, 1];
                    case 'login': return [3 /*break*/, 2];
                    case 'logout': return [3 /*break*/, 4];
                    case 'sendOffchain': return [3 /*break*/, 5];
                    case 'startDispute': return [3 /*break*/, 7];
                    case 'withChannel': return [3 /*break*/, 10];
                    case 'onchainFaucet': return [3 /*break*/, 11];
                    case 'externalDeposit': return [3 /*break*/, 12];
                    case 'broadcast': return [3 /*break*/, 13];
                    case 'getRoutes': return [3 /*break*/, 14];
                    case 'clearBatch': return [3 /*break*/, 17];
                    case 'getinfo': return [3 /*break*/, 18];
                    case 'propose': return [3 /*break*/, 19];
                    case 'vote': return [3 /*break*/, 20];
                    case 'sync': return [3 /*break*/, 21];
                    case 'receivedAndFailed': return [3 /*break*/, 22];
                }
                return [3 /*break*/, 24];
            case 1: 
            // triggered by frontend to update
            // public + private info
            //react({public: true, private: true, force: true})
            //return
            return [3 /*break*/, 25];
            case 2: return [4 /*yield*/, require('./login')(json.params)];
            case 3:
                _g.sent();
                return [2 /*return*/];
            case 4:
                result = require('./logout')();
                return [3 /*break*/, 25];
            case 5: return [4 /*yield*/, me.payChannel(json.params)];
            case 6:
                _g.sent();
                return [3 /*break*/, 25];
            case 7: return [4 /*yield*/, Channel.get(json.params.they_pubkey)];
            case 8:
                ch = _g.sent();
                _c = (_b = me).batchAdd;
                _d = ['dispute'];
                return [4 /*yield*/, startDispute(ch)];
            case 9:
                _c.apply(_b, _d.concat([_g.sent()]));
                react({ confirm: 'OK' });
                return [3 /*break*/, 25];
            case 10:
                require('./with_channel')(json.params);
                return [3 /*break*/, 25];
            case 11:
                json.params.pubkey = me.pubkey;
                json.params.method = 'onchainFaucet';
                me.send(K.banks[0], json.params);
                return [3 /*break*/, 25];
            case 12:
                require('./external_deposit')(json.params);
                return [3 /*break*/, 25];
            case 13:
                Periodical.broadcast(json.params);
                react({ force: true });
                return [2 /*return*/, false];
            case 14:
                _e = result;
                return [4 /*yield*/, parseAddress(json.params.address)];
            case 15:
                _e.parsedAddress = _g.sent();
                _f = result;
                return [4 /*yield*/, Router.bestRoutes(json.params.address, json.params)];
            case 16:
                _f.bestRoutes = _g.sent();
                return [3 /*break*/, 25];
            case 17:
                me.batch = [];
                react({ confirm: 'Batch cleared' });
                return [3 /*break*/, 25];
            case 18:
                result = require('./get_info')();
                return [3 /*break*/, 25];
            case 19:
                result = require('./propose')(json.params);
                return [3 /*break*/, 25];
            case 20:
                result = require('./vote')(json.params);
                return [3 /*break*/, 25];
            case 21:
                result = require('./sync')(json.params);
                return [3 /*break*/, 25];
            case 22: return [4 /*yield*/, require('./received_and_failed')(ws)];
            case 23:
                result = _g.sent();
                return [3 /*break*/, 25];
            case 24:
                result.alert = 'No method provided';
                _g.label = 25;
            case 25:
                result.authorized = true;
                react({ public: true, private: true, force: json.method == 'load' });
                // http or websocket?
                if (ws.end) {
                    ws.end(JSON.stringify(result));
                }
                else if (ws == 'admin') {
                    return [2 /*return*/, result];
                }
                else {
                    ws.send(JSON.stringify(result));
                    //react(result)
                }
                return [2 /*return*/];
        }
    });
}); };
