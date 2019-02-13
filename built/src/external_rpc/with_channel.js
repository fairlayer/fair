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
module.exports = function (pubkey, json, ws) { return __awaiter(_this, void 0, void 0, function () {
    var flushable, flushed, _i, flushable_1, fl;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            //todo: ensure no conflicts happen if two parties withdraw from each other at the same time
            return [4 /*yield*/, section(['use', pubkey], function () { return __awaiter(_this, void 0, void 0, function () {
                    var ch, subch, subch, subch, asset, amount, withdrawal_sig, subch, they, pair, withdrawal, subch, amount, asset, available, available, withdrawable, withdrawal, friendly_invoice, pay;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, Channel.get(pubkey)];
                            case 1:
                                ch = _a.sent();
                                if (!(json.method == 'setLimits')) return [3 /*break*/, 3];
                                subch = ch.d.subchannels.by('asset', json.asset);
                                subch.they_credit = json.credit;
                                subch.they_rebalance = json.rebalance;
                                return [4 /*yield*/, subch.save()];
                            case 2:
                                _a.sent();
                                me.textMessage(ch.d.they_pubkey, 'Updated credit limits');
                                return [3 /*break*/, 15];
                            case 3:
                                if (!(json.method == 'requestCredit')) return [3 /*break*/, 6];
                                subch = ch.d.subchannels.by('asset', json.asset);
                                subch.credit = 100000;
                                me.send(ch.d.they_pubkey, {
                                    method: 'setLimits',
                                    asset: json.asset,
                                    credit: subch.credit
                                });
                                return [4 /*yield*/, subch.save()
                                    // forced flush, gives them sig
                                ];
                            case 4:
                                _a.sent();
                                // forced flush, gives them sig
                                return [4 /*yield*/, me.flushChannel(pubkey, false)];
                            case 5:
                                // forced flush, gives them sig
                                _a.sent();
                                me.textMessage(ch.d.they_pubkey, 'Congrats, we opened a credit line for you');
                                return [3 /*break*/, 15];
                            case 6:
                                if (!(json.method == 'requestInsurance')) return [3 /*break*/, 8];
                                subch = ch.d.subchannels.by('asset', json.asset);
                                subch.they_requested_insurance = true;
                                return [4 /*yield*/, subch.save()];
                            case 7:
                                _a.sent();
                                me.textMessage(ch.d.they_pubkey, 'Added to rebalance queue');
                                return [3 /*break*/, 15];
                            case 8:
                                if (!(json.method == 'giveWithdrawal')) return [3 /*break*/, 11];
                                asset = parseInt(json.asset);
                                amount = parseInt(json.amount);
                                withdrawal_sig = fromHex(json.withdrawal_sig);
                                subch = ch.d.subchannels.by('asset', asset);
                                return [4 /*yield*/, User.findOne({
                                        where: { pubkey: ch.d.they_pubkey },
                                        include: [Balance]
                                    })];
                            case 9:
                                they = _a.sent();
                                if (!they || !me.record)
                                    return [2 /*return*/, l('no pair ', they, me.record)];
                                pair = [they.id, me.record.id];
                                if (ch.d.isLeft())
                                    pair.reverse();
                                withdrawal = [
                                    methodMap('withdraw'),
                                    pair[0],
                                    pair[1],
                                    ch.ins ? ch.ins.withdrawal_nonce : 0,
                                    amount,
                                    asset
                                ];
                                if (!ec.verify(r(withdrawal), withdrawal_sig, pubkey)) {
                                    l('Invalid withdrawal given', withdrawal);
                                    return [2 /*return*/, false];
                                }
                                l('Got withdrawal for ' + amount);
                                subch.withdrawal_amount = amount;
                                subch.withdrawal_sig = withdrawal_sig;
                                return [4 /*yield*/, subch.save()];
                            case 10:
                                _a.sent();
                                if (me.withdrawalRequests[subch.id]) {
                                    // returning ch back to requesting function
                                    me.withdrawalRequests[subch.id](ch);
                                }
                                return [3 /*break*/, 15];
                            case 11:
                                if (!(json.method == 'requestWithdrawal')) return [3 /*break*/, 13];
                                if (me.CHEAT_dontwithdraw) {
                                    // if we dont give withdrawal or are offline for too long, the partner starts dispute
                                    return [2 /*return*/, l('CHEAT_dontwithdraw')];
                                }
                                if (ch.d.status != 'master') {
                                    return [2 /*return*/, l('only return withdrawal to master status')];
                                }
                                if (!ch.ins) {
                                    me.textMessage(ch.d.they_pubkey, 'You must be registered');
                                    return [2 /*return*/];
                                }
                                subch = ch.d.subchannels.by('asset', json.asset);
                                amount = parseInt(json.amount);
                                asset = parseInt(json.asset);
                                // TODO: don't forget hold
                                // if we're bank, we let to withdraw from our onchain as well
                                // otherwise we let bank to withdraw only from their insured side
                                if (me.my_bank) {
                                    available = ch.derived[asset].they_available;
                                }
                                else {
                                    available = ch.derived[asset].they_insured - ch.derived[asset].inwards_hold;
                                }
                                if (amount > available) {
                                    me.textMessage(ch.d.they_pubkey, "Sorry, you can only withdraw up to " + available);
                                    return [2 /*return*/, false];
                                }
                                withdrawable = ch.derived[asset].they_insured + userAsset(me.record, asset);
                                if (amount == 0 || amount > withdrawable) {
                                    me.textMessage(ch.d.they_pubkey, "Sorry, you can only withdraw up to " + withdrawable);
                                    return [2 /*return*/, false];
                                }
                                if (amount > subch.they_withdrawal_amount) {
                                    // only keep the highest amount we signed on
                                    subch.they_withdrawal_amount = amount;
                                }
                                withdrawal = r([
                                    methodMap('withdraw'),
                                    ch.ins.leftId,
                                    ch.ins.rightId,
                                    ch.ins.withdrawal_nonce,
                                    amount,
                                    asset
                                ]);
                                return [4 /*yield*/, subch.save()];
                            case 12:
                                _a.sent();
                                me.send(pubkey, {
                                    method: 'giveWithdrawal',
                                    withdrawal_sig: ec(withdrawal, me.id.secretKey),
                                    amount: amount,
                                    asset: asset
                                });
                                return [3 /*break*/, 15];
                            case 13:
                                if (!(json.method == 'testnet')) return [3 /*break*/, 15];
                                if (!(json.action == 'faucet')) return [3 /*break*/, 15];
                                friendly_invoice = [
                                    'You are welcome!',
                                    'Demo',
                                    "It's free money!",
                                    '\'"><'
                                ].randomElement();
                                pay = {
                                    address: json.address,
                                    amount: json.amount,
                                    private_invoice: friendly_invoice,
                                    asset: json.asset
                                };
                                return [4 /*yield*/, me.payChannel(pay)];
                            case 14:
                                _a.sent();
                                _a.label = 15;
                            case 15: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                //todo: ensure no conflicts happen if two parties withdraw from each other at the same time
                _a.sent();
                if (!(json.method == 'update')) return [3 /*break*/, 4];
                return [4 /*yield*/, section(['use', pubkey], function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            //loff(`--- Start update ${trim(pubkey)} - ${transitions.length}`)
                            return [2 /*return*/, me.updateChannel(pubkey, r(fromHex(json.ackState)), fromHex(json.ackSig), json.transitions, json.signedState)];
                        });
                    }); })
                    /*
                  We MUST ack if there were any transitions, otherwise if it was ack w/o transitions
                  to ourselves then do an opportunistic flush (flush if any). Forced ack here would lead to recursive ack pingpong!
                  Flushable are other channels that were impacted by this update
                  Sometimes sender is already included in flushable, so don't flush twice
                  */
                ];
            case 2:
                flushable = _a.sent();
                flushed = [me.flushChannel(pubkey, json.transitions.length == 0)];
                if (flushable) {
                    for (_i = 0, flushable_1 = flushable; _i < flushable_1.length; _i++) {
                        fl = flushable_1[_i];
                        // can be opportunistic also
                        if (!fl.equals(pubkey)) {
                            flushed.push(me.flushChannel(fl, true));
                        }
                        else {
                            //loff('Tried to flush twice')
                        }
                    }
                }
                return [4 /*yield*/, Promise.all(flushed)
                    // use lazy react for external requests
                ];
            case 3:
                _a.sent();
                // use lazy react for external requests
                react({ private: true });
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
