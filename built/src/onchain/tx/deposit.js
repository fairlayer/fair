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
module.exports = function (s, args) { return __awaiter(_this, void 0, void 0, function () {
    var asset, _i, _a, output, amount, original_amount, signer_has, target, withPartner, _b, fee, compared, ins, subins, regfees, ch, subch, public_invoice;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                asset = readInt(args[0]);
                s.parsed_tx.events.push(['setAsset', 'Deposit', asset]);
                return [4 /*yield*/, userPayDebts(s.signer, asset, s.parsed_tx)
                    // there's a tiny bias here, the bank always gets reimbursed more than fee paid
                    // todo: consider splitting txfee based on % in total output volume
                    // const reimburse_txfee = 1 + Math.floor(s.parsed_tx.txfee / args.length)
                ];
            case 1:
                _c.sent();
                _i = 0, _a = args[1];
                _c.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 20];
                output = _a[_i];
                amount = readInt(output[0]);
                original_amount = amount;
                signer_has = userAsset(s.signer, asset);
                if (amount > signer_has) {
                    l(s.signer.id + " Trying to deposit " + amount + " but has " + signer_has);
                    return [2 /*return*/];
                }
                return [4 /*yield*/, getUserByIdOrKey(output[1])];
            case 3:
                target = _c.sent();
                if (!target)
                    return [2 /*return*/];
                if (!(output[2].length == 0)) return [3 /*break*/, 4];
                _b = false;
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, getUserByIdOrKey(output[2])
                // here we ensure both parties are registred (have id), and take needed fees
            ];
            case 5:
                _b = _c.sent();
                _c.label = 6;
            case 6:
                withPartner = _b;
                if (!!target.id) return [3 /*break*/, 8];
                // you must be registered first using asset 1
                if (asset != 1) {
                    l('Not 1 asset');
                    return [2 /*return*/];
                }
                if (!withPartner) {
                    if (amount < K.account_creation_fee)
                        return [2 /*return*/];
                    userAsset(target, asset, amount - K.account_creation_fee);
                    userAsset(s.signer, asset, -amount);
                    if (me.is_me(target.pubkey)) {
                        me.addEvent({
                            type: 'fee',
                            amount: -K.account_creation_fee,
                            asset: asset,
                            desc: "Paid account creation fee"
                        });
                    }
                }
                else {
                    l('Cannot pay to a channel with unregistered user');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, saveId(target)];
            case 7:
                _c.sent();
                K.collected_fees += K.account_creation_fee;
                return [3 /*break*/, 13];
            case 8:
                if (!withPartner) return [3 /*break*/, 11];
                if (!!withPartner.id) return [3 /*break*/, 10];
                fee = K.standalone_balance + K.account_creation_fee;
                if (amount < fee)
                    return [2 /*return*/];
                if (asset != 1) {
                    l('Not 1 asset');
                    return [2 /*return*/];
                }
                userAsset(withPartner, asset, K.standalone_balance);
                amount -= fee;
                //userAsset(s.signer, asset, -fee)
                return [4 /*yield*/, withPartner.save()
                    // now it has id
                    /*
                    if (me.is_me(withPartner.pubkey)) {
                      await me.addHistory(
                        target.pubkey,
                        -K.account_creation_fee,
                        'Account creation fee'
                      )
                      await me.addHistory(
                        target.pubkey,
                        -K.standalone_balance,
                        'Minimum global balance'
                      )
                    }
                    */
                ];
            case 9:
                //userAsset(s.signer, asset, -fee)
                _c.sent();
                _c.label = 10;
            case 10: return [3 /*break*/, 13];
            case 11:
                if (target.id == s.signer.id) {
                    l('Trying to deposit to your onchain balance is pointless');
                    return [2 /*return*/];
                }
                userAsset(target, asset, amount);
                //l('Deposited now: ', target)
                userAsset(s.signer, asset, -amount);
                return [4 /*yield*/, saveId(target)];
            case 12:
                _c.sent();
                _c.label = 13;
            case 13:
                if (!(withPartner && withPartner.id)) return [3 /*break*/, 18];
                compared = Buffer.compare(target.pubkey, withPartner.pubkey);
                if (compared == 0)
                    return [2 /*return*/];
                return [4 /*yield*/, getInsuranceBetween(target, withPartner)];
            case 14:
                ins = _c.sent();
                subins = ins.subinsurances.by('asset', asset);
                if (!subins) {
                    subins = Subinsurance.build({
                        insuranceId: ins.id,
                        asset: asset
                    });
                    ins.subinsurances.push(subins);
                }
                subins.balance += amount;
                if (target.id == ins.leftId)
                    subins.ondelta += amount;
                regfees = original_amount - amount;
                subins.ondelta -= compared * regfees;
                userAsset(s.signer, asset, -amount);
                if (K.banks.find(function (h) { return h.id == s.signer.id; })) {
                    // The bank gets reimbursed for rebalancing users.
                    // Otherwise it would be harder to collect fee from participants
                    // TODO: attack vector, the user may not endorsed this rebalance
                    // reimbures to bank rebalance fees
                    /*
                    subins.balance -= reimburse_txfee
                    subins.ondelta -= compared * reimburse_txfee
                    userAsset(s.signer, 1, reimburse_txfee)
                    */
                    // todo take from onchain balance instead
                }
                return [4 /*yield*/, saveId(ins)
                    //await ins.save()
                    //await saveId(subins)
                ];
            case 15:
                _c.sent();
                if (!(me.is_me(target.pubkey) || me.is_me(withPartner.pubkey))) return [3 /*break*/, 18];
                return [4 /*yield*/, Channel.get(me.is_me(withPartner.pubkey) ? target.pubkey : withPartner.pubkey)
                    // rebalance happened, nullify
                ];
            case 16:
                ch = _c.sent();
                subch = ch.d.subchannels.by('asset', asset);
                subch.requested_insurance = false;
                subch.they_requested_insurance = false;
                return [4 /*yield*/, subch.save()];
            case 17:
                _c.sent();
                _c.label = 18;
            case 18:
                public_invoice = output[3] && output[3].length != 0 ? output[3] : false;
                // we sent onchain
                if (me.is_me(s.signer.pubkey)) {
                    me.record = s.signer;
                    me.addEvent({
                        type: 'sent',
                        amount: -amount,
                        asset: asset,
                        public_invoice: public_invoice.toString(),
                        userId: target.id,
                        desc: "Sent to " + target.id
                    });
                }
                // sent onchain to us
                if (me.is_me(target.pubkey)) {
                    //me.record = target
                    // TODO: hook into SDK
                    me.addEvent({
                        type: 'received',
                        amount: amount,
                        asset: asset,
                        public_invoice: public_invoice.toString(),
                        userId: s.signer.id,
                        desc: "Received from " + s.signer.id
                    });
                }
                s.parsed_tx.events.push([
                    'deposit',
                    amount,
                    target.id,
                    withPartner ? withPartner.id : false,
                    public_invoice ? toHex(public_invoice) : false
                ]);
                s.meta.outputs_volume += amount;
                _c.label = 19;
            case 19:
                _i++;
                return [3 /*break*/, 2];
            case 20: return [2 /*return*/];
        }
    });
}); };
