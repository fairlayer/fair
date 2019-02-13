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
    var asset, _i, _a, withdrawal, amount, they_pubkey, withdrawal_sig, partner, compared, available, ins, subins, body, take_from_insurance, take_from_onchain, ch, subch;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                asset = readInt(args[0]);
                s.parsed_tx.events.push(['setAsset', 'Withdraw', asset]);
                _i = 0, _a = args[1];
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 9];
                withdrawal = _a[_i];
                amount = withdrawal[0], they_pubkey = withdrawal[1], withdrawal_sig = withdrawal[2];
                amount = readInt(amount);
                return [4 /*yield*/, getUserByIdOrKey(they_pubkey)];
            case 2:
                partner = _b.sent();
                if (!partner || !partner.id) {
                    l('Cant withdraw from nonexistent partner');
                    return [2 /*return*/];
                }
                compared = Buffer.compare(s.signer.pubkey, partner.pubkey);
                if (compared == 0)
                    return [2 /*return*/];
                available = userAsset(partner, asset);
                return [4 /*yield*/, getInsuranceBetween(s.signer, partner)];
            case 3:
                ins = _b.sent();
                subins = ins.subinsurances.by('asset', asset);
                if (subins) {
                    available += subins.balance;
                }
                else {
                    subins = Subinsurance.build({
                        insuranceId: ins.id,
                        asset: asset
                    });
                    ins.subinsurances.push(subins);
                }
                // todo, dont let to withdraw too much native asset
                if (!ins || amount > available) {
                    l("Invalid withdrawal: " + available + " but requests " + amount);
                    return [2 /*return*/];
                }
                body = r([
                    methodMap('withdraw'),
                    ins.leftId,
                    ins.rightId,
                    ins.withdrawal_nonce,
                    amount,
                    asset
                ]);
                if (!ec.verify(body, withdrawal_sig, partner.pubkey)) {
                    l('Invalid withdrawal sig by partner ', asset, ins.withdrawal_nonce, amount, withdrawal_sig, partner.pubkey);
                    return [2 /*return*/];
                }
                take_from_insurance = amount;
                // not enough in insurance? take the rest from partner's onchain balance
                if (amount > subins.balance) {
                    take_from_insurance = subins.balance;
                    take_from_onchain = amount - take_from_insurance;
                    userAsset(partner, asset, -take_from_onchain);
                    // ondelta must also be modified to represent onchain deduction
                    if (partner.id == ins.leftId) {
                        subins.ondelta += take_from_onchain;
                    }
                    else {
                        subins.ondelta -= take_from_onchain;
                    }
                }
                if (take_from_insurance > 0) {
                    subins.balance -= take_from_insurance;
                    // if signer is left and reduces insurance, move ondelta to the left too
                    // .====| reduce insurance .==--| reduce ondelta .==|
                    if (s.signer.id == ins.leftId)
                        subins.ondelta -= take_from_insurance;
                }
                // giving signer amount to their onchain balance
                userAsset(s.signer, asset, amount);
                // preventing double spend with same withdrawal
                ins.withdrawal_nonce++;
                if (!(me.record && [partner.id, s.signer.id].includes(me.record.id))) return [3 /*break*/, 6];
                return [4 /*yield*/, Channel.get(me.record.id == partner.id ? s.signer.pubkey : partner.pubkey)];
            case 4:
                ch = _b.sent();
                subch = ch.d.subchannels.by('asset', asset);
                //l('Updating withdrawal amounts! ', subch)
                // they planned to withdraw and they did. Nullify hold amount
                subch.they_withdrawal_amount = 0;
                // already used, nullify
                subch.withdrawal_amount = 0;
                subch.withdrawal_sig = null;
                return [4 /*yield*/, subch.save()];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6: 
            // do it AFTER removing they_withdrawal_amount
            return [4 /*yield*/, saveId(ins)
                // for blockchain explorer
            ];
            case 7:
                // do it AFTER removing they_withdrawal_amount
                _b.sent();
                // for blockchain explorer
                s.parsed_tx.events.push(['withdraw', amount, partner.id]);
                s.meta.inputs_volume += amount; // todo: asset-specific
                _b.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 1];
            case 9: return [2 /*return*/];
        }
    });
}); };
