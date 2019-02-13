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
    var id, sig, state, partner, compared, ins, dispute_nonce, _a, methodId, _b, leftId, rightId, new_dispute_nonce, subchannels, output, delay, ch, our_dispute_nonce, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                id = args[0], sig = args[1], state = args[2];
                return [4 /*yield*/, getUserByIdOrKey(id)];
            case 1:
                partner = _f.sent();
                if (!(!partner || !partner.id)) return [3 /*break*/, 3];
                l('Your partner is not registred');
                return [4 /*yield*/, saveId(partner)];
            case 2:
                _f.sent();
                _f.label = 3;
            case 3:
                compared = Buffer.compare(s.signer.pubkey, partner.pubkey);
                if (compared == 0) {
                    l('Cannot dispute with yourself');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, getInsuranceBetween(s.signer, partner)];
            case 4:
                ins = _f.sent();
                dispute_nonce = 0;
                if (sig) {
                    if (!ec.verify(state, sig, partner.pubkey)) {
                        l('Invalid sig ', state);
                        return [2 /*return*/];
                    }
                    _a = r(state), methodId = _a[0], _b = _a[1], leftId = _b[0], rightId = _b[1], new_dispute_nonce = _b[2], subchannels = _a[2];
                    if (methodMap(readInt(methodId)) != 'dispute' ||
                        !leftId.equals(compared == -1 ? s.signer.pubkey : partner.pubkey) ||
                        !rightId.equals(compared == -1 ? partner.pubkey : s.signer.pubkey)) {
                        l('Invalid dispute');
                        return [2 /*return*/];
                    }
                    // overwrite the above default "let" params
                    dispute_nonce = readInt(new_dispute_nonce);
                }
                else {
                    l('New channel? Split with default values');
                }
                if (ins.dispute_nonce && dispute_nonce <= ins.dispute_nonce) {
                    l("New dispute_nonce in dispute must be higher");
                    return [2 /*return*/];
                }
                if (!ins.dispute_delayed) return [3 /*break*/, 8];
                if (!(ins.dispute_left == (compared == 1))) return [3 /*break*/, 6];
                // TODO: any punishment for cheating for starting party?
                // we don't want to slash everything like in LN, but some fee would help
                ins.dispute_state = r(subchannels);
                ins.dispute_nonce = dispute_nonce;
                return [4 /*yield*/, insuranceResolve(ins)];
            case 5:
                output = _f.sent();
                l('Resolved with counter proof');
                s.parsed_tx.events.push(['disputeResolved', partner.id, 'disputed', ins, output]);
                return [3 /*break*/, 7];
            case 6:
                l('Old dispute_nonce or same counterparty');
                _f.label = 7;
            case 7: return [3 /*break*/, 12];
            case 8:
                // TODO: return to partner their part right away, and our part is delayed
                ins.dispute_nonce = dispute_nonce;
                ins.dispute_state = r(subchannels);
                ins.dispute_left = compared == -1;
                delay = K.banks.find(function (h) { return h.id == partner.id; })
                    ? K.dispute_delay_for_banks
                    : K.dispute_delay_for_users;
                ins.dispute_delayed = K.usable_blocks + delay;
                s.parsed_tx.events.push(['disputeStarted', partner.id, 'started', ins]);
                return [4 /*yield*/, saveId(ins)];
            case 9:
                _f.sent();
                if (!me.is_me(partner.pubkey)) return [3 /*break*/, 12];
                l('Channel with us is disputed');
                return [4 /*yield*/, Channel.get(s.signer.pubkey)];
            case 10:
                ch = _f.sent();
                ch.d.status = 'disputed';
                ch.ins = ins;
                our_dispute_nonce = ch.d.signed_state
                    ? readInt(r(ch.d.signed_state)[1][2])
                    : 0;
                if (!(our_dispute_nonce > ins.dispute_nonce && !me.CHEAT_dontack)) return [3 /*break*/, 12];
                l('Our last signed nonce is higher! ' + our_dispute_nonce);
                _d = (_c = me).batchAdd;
                _e = ['dispute'];
                return [4 /*yield*/, startDispute(ch)];
            case 11:
                _d.apply(_c, _e.concat([_f.sent()]));
                _f.label = 12;
            case 12: return [2 /*return*/];
        }
    });
}); };
