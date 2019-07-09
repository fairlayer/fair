"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
// External RPC processes requests to our node coming from outside world.
// Also implements validator and bank functionality
var getChain = require('./get_chain');
var utils_1 = require("../utils");
/*


  'propose',
  'prevote',
  'precommit',


  'authSocket',

  */
module.exports = function (ws, rawMessage) { return __awaiter(_this, void 0, void 0, function () {
    var msg, content, contentType, pubkey, sig, body, json, raw_chain, pubkey_1, msg_1, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                msg = rawMessage instanceof ArrayBuffer ? Buffer.from(Buffer.from(rawMessage)) : rawMessage;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 12, , 13]);
                content = utils_1.rlp.decode(msg);
                contentType = methodMap(readInt(content[0]));
                if (!(contentType == 'JSON')) return [3 /*break*/, 10];
                pubkey = content[1];
                sig = content[2];
                body = content[3];
                json = parse(body.toString());
                if (RPC.requireSig.includes(json.method) &&
                    !ec.verify(body, sig, pubkey)) {
                    l('Invalid sig in external_rpc');
                    return [2 /*return*/, false];
                }
                if (trace)
                    l("From " + trim(pubkey) + ":", json);
                if (!(json.method == 'auth')) return [3 /*break*/, 2];
                require('./auth')(pubkey, json, ws);
                return [3 /*break*/, 9];
            case 2:
                if (!(json.method == 'propose')) return [3 /*break*/, 3];
                require('./propose')(pubkey, json, ws);
                return [3 /*break*/, 9];
            case 3:
                if (!(json.method == 'prevote' || json.method == 'precommit')) return [3 /*break*/, 4];
                require('./prevote_precommit')(pubkey, json, ws);
                return [3 /*break*/, 9];
            case 4:
                if (![
                    'update',
                    'setLimits',
                    'requestInsurance',
                    'requestCredit',
                    'giveWithdrawal',
                    'requestWithdrawal',
                    'testnet'
                ].includes(json.method)) return [3 /*break*/, 5];
                require('./with_channel')(pubkey, json, ws);
                return [3 /*break*/, 9];
            case 5:
                if (!(json.method == 'add_batch')) return [3 /*break*/, 6];
                require('./add_batch')(json, ws);
                return [3 /*break*/, 9];
            case 6:
                if (!(json.method == 'requestChain')) return [3 /*break*/, 8];
                return [4 /*yield*/, getChain(json)
                    //l('Returning chain ', raw_chain.length)
                ];
            case 7:
                raw_chain = _a.sent();
                //l('Returning chain ', raw_chain.length)
                if (raw_chain.length > 0) {
                    ws.send(r([methodMap('returnChain'), raw_chain]));
                }
                else {
                    //me.textMessage()
                    //l('No blocks to sync for ', json)
                }
                return [3 /*break*/, 9];
            case 8:
                if (json.method == 'textMessage') {
                    react({ confirm: json.msg });
                }
                else if (json.method == 'onchainFaucet') {
                    pubkey_1 = fromHex(json.pubkey);
                    msg_1 = 'Unavailable faucet';
                    if (me.batchAdd('deposit', [json.asset, [json.amount, pubkey_1, 0]])) {
                        msg_1 = "Expect onchain faucet soon...";
                    }
                    me.textMessage(pubkey_1, msg_1);
                }
                _a.label = 9;
            case 9: return [2 /*return*/];
            case 10:
                if (contentType == 'returnChain') {
                    // the only method that is not json to avoid serialization overhead
                    return [2 /*return*/, me.processChain(content[1])];
                }
                _a.label = 11;
            case 11: return [3 /*break*/, 13];
            case 12:
                e_1 = _a.sent();
                l('External RPC error', e_1);
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); };
