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
var withdraw = require('../offchain/withdraw');
module.exports = function (json) { return __awaiter(_this, void 0, void 0, function () {
    var ch, subch, withdrawal;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Channel.get(json.they_pubkey)];
            case 1:
                ch = _a.sent();
                if (!ch) {
                    l('no channel');
                    return [2 /*return*/];
                }
                subch = ch.d.subchannels.by('asset', json.asset);
                if (!subch) {
                    l('no subch');
                    return [2 /*return*/, false];
                }
                if (!(json.method == 'withdraw')) return [3 /*break*/, 4];
                if (json.amount > ch.derived[json.asset].available) {
                    react({ alert: 'More than you can withdraw from available' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, withdraw(ch, subch, json.amount)];
            case 2:
                // meanwhile ch has been updated
                ch = _a.sent();
                if (!ch)
                    return [2 /*return*/, l('No channel w')];
                subch = ch.d.subchannels.by('asset', json.asset);
                if (subch.withdrawal_amount == 0) {
                    react({
                        alert: 'Failed to get withdrawal. Try later or start a dispute.'
                    });
                    return [2 /*return*/];
                }
                withdrawal = [subch.withdrawal_amount, ch.partner, subch.withdrawal_sig];
                l('Adding withdrawal ', withdrawal);
                me.batchAdd('withdraw', [json.asset, withdrawal]);
                return [4 /*yield*/, subch.save()];
            case 3:
                _a.sent();
                react({ confirm: 'OK' });
                return [2 /*return*/, withdrawal];
            case 4:
                if (!(json.method == 'deposit')) return [3 /*break*/, 5];
                // not used
                me.batchAdd('deposit', [
                    json.asset,
                    [json.amount, me.record.id, ch.partner, 0]
                ]);
                react({ confirm: 'OK' });
                return [3 /*break*/, 12];
            case 5:
                if (!(json.method == 'setLimits')) return [3 /*break*/, 8];
                subch.credit = json.credit;
                subch.rebalance = json.rebalance;
                // nothing happened
                return [4 /*yield*/, subch.save()
                    //l('set limits to ', ch.d.they_pubkey)
                ];
            case 6:
                // nothing happened
                _a.sent();
                //l('set limits to ', ch.d.they_pubkey)
                me.send(ch.d.they_pubkey, {
                    method: 'setLimits',
                    asset: subch.asset,
                    credit: subch.credit,
                    rebalance: subch.rebalance
                });
                return [4 /*yield*/, me.flushChannel(ch.d.they_pubkey, false)
                    //react({confirm: 'OK'})
                ];
            case 7:
                _a.sent();
                return [3 /*break*/, 12];
            case 8:
                if (!(json.method == 'requestCredit')) return [3 /*break*/, 9];
                me.send(ch.d.they_pubkey, {
                    method: 'requestCredit',
                    asset: json.asset,
                    amount: json.amount
                });
                return [3 /*break*/, 12];
            case 9:
                if (!(json.method == 'requestInsurance')) return [3 /*break*/, 11];
                subch.requested_insurance = true;
                return [4 /*yield*/, subch.save()];
            case 10:
                _a.sent();
                me.send(ch.d.they_pubkey, { method: 'requestInsurance', asset: json.asset });
                return [3 /*break*/, 12];
            case 11:
                if (json.method == 'testnet') {
                    me.send(ch.d.they_pubkey, {
                        method: 'testnet',
                        action: json.action,
                        asset: json.asset,
                        amount: json.amount,
                        address: me.getAddress()
                    });
                }
                _a.label = 12;
            case 12: return [2 /*return*/, {}];
        }
    });
}); };
