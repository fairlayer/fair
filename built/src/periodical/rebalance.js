/*
The most important job of the bank is to rebalance assets once in a while.
1. the bank finds who wants to insure their uninsured balances. They can learn automatically (given soft limit) or manually (Request Insurance in the wallet)
2. now the bank tries to find the total amount of insurance needed from the net-spenders who are currently online
3. it's up to the alg implementation to start disputes with net-spenders who are offline for too long
4. if bank fails to find enough net-spenders right now, they may drop some low value or high value net-receivers to match the numbers on both sides
5. packs withdrawals and deposits into one large rebalance batch and broadcasts onchain

Current implementation is super simple and straightforward. There's huge room for improvement:
* smart learning based on balances over time not on balance at the time of matching
* use as little withdrawals/deposits to transfer as much as possible volume
* have different schedule for different assets, e.g. rebalance FRD every 1 block but rare assets every 1k blocks
* often bank needs to request insurance from another bank (cross-bank payments).

General recommendations:
1. assets stuck in a dispute is a waste. It's better to do everything by mutual agreement as much as possible, w/o suffering dispute delays and locked up liquidity
2. the bank must store as little funds on their @onchain balances as possible. So once bank withdraw from net-spenders they should immediately deposit it to net-receiver.

*/
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
var withdraw = require('../offchain/withdraw');
module.exports = function () {
    return __awaiter(this, void 0, void 0, function () {
        var deltas, _loop_1, asset;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (PK.pendingBatchHex || me.batch.length > 0) {
                        return [2 /*return*/]; //l('There are pending tx')
                    }
                    return [4 /*yield*/, Channel.findAll()];
                case 1:
                    deltas = _a.sent();
                    _loop_1 = function (asset) {
                        var minRisk, netSpenders, netReceivers, _loop_2, _i, deltas_1, d, weOwn, _a, netSpenders_1, ch, subch, user, debts, _b, debts_1, d, safety, _c, netReceivers_1, ch;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    minRisk = 500;
                                    netSpenders = [];
                                    netReceivers = [];
                                    _loop_2 = function (d) {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, section(['use', d.they_pubkey], function () { return __awaiter(_this, void 0, void 0, function () {
                                                        var ch, derived, subch, _a, _b, _c;
                                                        return __generator(this, function (_d) {
                                                            switch (_d.label) {
                                                                case 0: return [4 /*yield*/, Channel.get(d.they_pubkey)];
                                                                case 1:
                                                                    ch = _d.sent();
                                                                    derived = ch.derived[asset];
                                                                    subch = ch.d.subchannels.by('asset', asset);
                                                                    if (!derived) {
                                                                        l('No derived', ch);
                                                                    }
                                                                    if (!(derived.they_uninsured > 0 &&
                                                                        (subch.they_requested_insurance ||
                                                                            (subch.they_rebalance > 0 &&
                                                                                derived.they_uninsured >= subch.they_rebalance)))) return [3 /*break*/, 2];
                                                                    //l('Adding output for our promise ', ch.d.they_pubkey)
                                                                    netReceivers.push(ch);
                                                                    return [3 /*break*/, 6];
                                                                case 2:
                                                                    if (!(derived.insured >= minRisk)) return [3 /*break*/, 6];
                                                                    if (!me.sockets[ch.d.they_pubkey]) return [3 /*break*/, 3];
                                                                    // they either get added in this rebalance or next one
                                                                    //l('Request withdraw withdraw: ', derived)
                                                                    netSpenders.push(withdraw(ch, subch, derived.insured));
                                                                    return [3 /*break*/, 6];
                                                                case 3:
                                                                    if (!(subch.withdrawal_requested_at == null)) return [3 /*break*/, 4];
                                                                    l('Delayed pull');
                                                                    subch.withdrawal_requested_at = Date.now();
                                                                    return [3 /*break*/, 6];
                                                                case 4:
                                                                    if (!(subch.withdrawal_requested_at + 600000 < Date.now())) return [3 /*break*/, 6];
                                                                    l('User is offline for too long, or tried to cheat');
                                                                    _b = (_a = me).batchAdd;
                                                                    _c = ['dispute'];
                                                                    return [4 /*yield*/, startDispute(ch)];
                                                                case 5:
                                                                    _b.apply(_a, _c.concat([_d.sent()]));
                                                                    _d.label = 6;
                                                                case 6: return [2 /*return*/];
                                                            }
                                                        });
                                                    }); })];
                                                case 1:
                                                    _a.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _i = 0, deltas_1 = deltas;
                                    _d.label = 1;
                                case 1:
                                    if (!(_i < deltas_1.length)) return [3 /*break*/, 4];
                                    d = deltas_1[_i];
                                    return [5 /*yield**/, _loop_2(d)];
                                case 2:
                                    _d.sent();
                                    _d.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4: return [4 /*yield*/, Promise.all(netSpenders)
                                    // 1. how much we own of this asset
                                ];
                                case 5:
                                    // checking on all withdrawals we expected to get, then rebalance
                                    netSpenders = _d.sent();
                                    weOwn = me.record ? userAsset(me.record, asset) : 0;
                                    _a = 0, netSpenders_1 = netSpenders;
                                    _d.label = 6;
                                case 6:
                                    if (!(_a < netSpenders_1.length)) return [3 /*break*/, 10];
                                    ch = netSpenders_1[_a];
                                    subch = ch.derived[asset].subch;
                                    if (!subch.withdrawal_sig) return [3 /*break*/, 8];
                                    weOwn += subch.withdrawal_amount;
                                    return [4 /*yield*/, User.findOne({
                                            where: { pubkey: ch.d.they_pubkey },
                                            include: [Balance]
                                        })];
                                case 7:
                                    user = _d.sent();
                                    me.batchAdd('withdraw', [
                                        subch.asset,
                                        [subch.withdrawal_amount, user.id, subch.withdrawal_sig]
                                    ]);
                                    return [3 /*break*/, 9];
                                case 8:
                                    // offline? dispute
                                    subch.withdrawal_requested_at = Date.now();
                                    _d.label = 9;
                                case 9:
                                    _a++;
                                    return [3 /*break*/, 6];
                                case 10: return [4 /*yield*/, me.record.getDebts({ where: { asset: asset } })];
                                case 11:
                                    debts = _d.sent();
                                    for (_b = 0, debts_1 = debts; _b < debts_1.length; _b++) {
                                        d = debts_1[_b];
                                        weOwn -= d.amount_left;
                                    }
                                    // sort receivers, larger ones are given priority
                                    netReceivers.sort(function (a, b) {
                                        return b.derived[asset].they_uninsured - a.derived[asset].they_uninsured;
                                    });
                                    safety = asset == 1 ? K.bank_standalone_balance : 0;
                                    // 4. now do our best to cover net receivers
                                    for (_c = 0, netReceivers_1 = netReceivers; _c < netReceivers_1.length; _c++) {
                                        ch = netReceivers_1[_c];
                                        weOwn -= ch.derived[asset].they_uninsured;
                                        if (weOwn >= safety) {
                                            me.batchAdd('deposit', [
                                                asset,
                                                [ch.derived[asset].they_uninsured, me.record.id, ch.d.they_pubkey, 0]
                                            ]);
                                            // nullify their insurance request
                                            ch.derived[asset].subch.they_requested_insurance = false;
                                        }
                                        else {
                                            l("Run out of funds for asset " + asset + ", own " + weOwn + " need " + ch.derived[asset].they_uninsured);
                                            break;
                                        }
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    asset = 1;
                    _a.label = 2;
                case 2:
                    if (!(asset <= 2)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(asset)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    asset++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
};
