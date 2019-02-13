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
// Defines how payment channels work, based on "insurance" and delta=(ondelta+offdelta)
// There are 3 major scenarios of delta position
// . is 0 point, | is delta, = is insured, - is uninsured
// 4,6  .====--| (left user owns entire insurance, has 2 uninsured)
// 4,2  .==|==   (left and right both have 2 insured)
// 4,-2 |--.==== (right owns entire insurance, 2 in uninsured balance)
// https://codepen.io/anon/pen/wjLGgR visual demo
resolveChannel = function (insurance, delta, is_left) {
    if (is_left === void 0) { is_left = true; }
    var _a;
    if (!Number.isInteger(insurance) || !Number.isInteger(delta)) {
        l(insurance, delta);
        throw 'Not integer';
    }
    var parts = {
        // left user promises only with negative delta, scenario 3
        they_uninsured: delta < 0 ? -delta : 0,
        insured: delta > insurance ? insurance : delta > 0 ? delta : 0,
        they_insured: delta > insurance ? 0 : delta > 0 ? insurance - delta : insurance,
        // right user promises when delta > insurance, scenario 1
        uninsured: delta > insurance ? delta - insurance : 0
    };
    var total = parts.they_uninsured + parts.uninsured + parts.they_insured + parts.insured;
    if (total < 100)
        total = 100;
    var bar = function (amount, symbol) {
        if (amount > 0) {
            return Array(1 + Math.ceil((amount * 100) / total)).join(symbol);
        }
        else {
            return '';
        }
    };
    // visual representations of state in ascii and text
    /*
    if (delta < 0) {
      parts.ascii_channel =
        '|' + bar(parts.they_uninsured, '-') + bar(parts.they_insured, '=')
    } else if (delta < insurance) {
      parts.ascii_channel =
        bar(parts.insured, '=') + '|' + bar(parts.they_insured, '=')
    } else {
      parts.ascii_channel =
        bar(parts.insured, '=') + bar(parts.uninsured, '-') + '|'
    }
    */
    // default view is left. if current user is right, simply reverse
    if (!is_left) {
        ;
        _a = [
            parts.uninsured,
            parts.they_insured,
            parts.insured,
            parts.they_uninsured
        ], parts.they_uninsured = _a[0], parts.insured = _a[1], parts.they_insured = _a[2], parts.uninsured = _a[3];
    }
    return parts;
};
var paymentToLock = function (payment) {
    return [payment.amount, payment.hash, payment.exp];
};
refresh = function (ch) {
    // Canonical state.
    // To be parsed in case of a dispute onchain
    ch.state = [
        methodMap('dispute'),
        [
            ch.d.isLeft() ? me.pubkey : ch.d.they_pubkey,
            ch.d.isLeft() ? ch.d.they_pubkey : me.pubkey,
            ch.d.dispute_nonce
        ],
        // assetId, offdelta, leftlocks, rightlocks
        []
    ];
    for (var _i = 0, _a = ch.d.subchannels; _i < _a.length; _i++) {
        var subch = _a[_i];
        var out = {
            inwards: [],
            outwards: [],
            inwards_hold: subch.they_withdrawal_amount,
            outwards_hold: subch.withdrawal_amount,
            asset: subch.asset,
            credit: subch.credit,
            they_credit: subch.they_credit,
            subch: subch
        };
        // find the according subinsurance for subchannel
        var subins = void 0;
        if (ch.ins && ch.ins.subinsurances) {
            subins = ch.ins.subinsurances.by('asset', subch.asset);
        }
        if (!subins)
            subins = { balance: 0, ondelta: 0 };
        // hashlock creates hold-like assets in limbo. For left and right user:
        for (var i = 0; i < ch.payments.length; i++) {
            var t = ch.payments[i];
            if (t.asset != subch.asset)
                continue;
            var typestatus = t.type + t.status;
            var in_state = [
                'addack',
                'delnew',
                ch.d.rollback_nonce > 0 ? 'delsent' : 'addsent'
            ];
            if (in_state.includes(typestatus)) {
                if (t.is_inward) {
                    out.inwards.push(t);
                    out.inwards_hold += t.amount;
                }
                else {
                    out.outwards.push(t);
                    out.outwards_hold += t.amount;
                }
            }
        }
        // we must "hold" withdrawal proofs on state even before they hit blockchain
        // otherwise the attacker can get a huge withdrawal proof, then send money offchain,
        // then steal the rest with withdrawal proof onchain, doubling their money
        // what we are about to withdraw and they are about to withdraw
        out.insurance = subins.balance;
        // TODO: is it correct?
        //delta minus what Left one is about to withdraw (it's either we or they)
        out.delta = subins.ondelta + subch.offdelta;
        /*
        delta -= ch.d.isLeft()
          ? subch.withdrawal_amount
          : subch.they_withdrawal_amount*/
        Object.assign(out, resolveChannel(out.insurance, out.delta, ch.d.isLeft()));
        // what's left credit
        out.available_credit = out.they_credit - out.they_uninsured;
        out.they_available_credit = out.credit - out.uninsured;
        // inputs are like bearer cheques and can be used any minute, so we deduct them
        out.available =
            out.insured + out.uninsured + out.available_credit - out.outwards_hold;
        out.they_available =
            out.they_insured +
                out.they_uninsured +
                out.they_available_credit -
                out.inwards_hold;
        // total channel capacity: insurance + credit on both sides
        out.capacity = out.insurance + out.credit + out.they_credit;
        if (out.available < 0 || out.they_available < 0) {
            l('Invalid availables', JSON.stringify(out, null, 4));
            fatal('invalid outs');
        }
        // All stuff we show in the progress bar in the wallet
        out.bar =
            out.they_uninsured + out.insured + out.they_insured + out.uninsured;
        var encodeSignedInt = function (i) {
            return Math.abs(i) * 2 + (i < 0 ? 1 : 0);
        };
        ch.state[2].push([
            subch.asset,
            encodeSignedInt(subch.offdelta),
            out[ch.d.isLeft() ? 'inwards' : 'outwards'].map(function (t) { return paymentToLock(t); }),
            out[ch.d.isLeft() ? 'outwards' : 'inwards'].map(function (t) { return paymentToLock(t); })
        ]);
        ch.derived[subch.asset] = out;
    }
    // sort by assed Id
    ch.state[2].sort(function (a, b) { return a[0] - b[0]; });
    ch.ascii_states = ascii_state(ch.state);
    if (ch.d.signed_state) {
        var st = r(ch.d.signed_state);
        prettyState(st);
        st = ascii_state(st);
        if (st != ch.ascii_states) {
            ch.ascii_states += st;
        }
    }
    return ch.state;
};
saveId = function (obj) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, b, _b, _c, b;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: 
                // only save if it has no id now
                //if (!obj.id) {
                return [4 /*yield*/, obj.save()
                    //}
                ];
                case 1:
                    // only save if it has no id now
                    //if (!obj.id) {
                    _d.sent();
                    if (!obj.balances) return [3 /*break*/, 5];
                    _i = 0, _a = obj.balances;
                    _d.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    b = _a[_i];
                    b.userId = obj.id;
                    if (!b.changed()) return [3 /*break*/, 4];
                    return [4 /*yield*/, b.save()];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!obj.subinsurances) return [3 /*break*/, 9];
                    _b = 0, _c = obj.subinsurances;
                    _d.label = 6;
                case 6:
                    if (!(_b < _c.length)) return [3 /*break*/, 9];
                    b = _c[_b];
                    // create ref later
                    b.insuranceId = obj.id;
                    if (!b.changed()) return [3 /*break*/, 8];
                    return [4 /*yield*/, b.save()];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8:
                    _b++;
                    return [3 /*break*/, 6];
                case 9: return [2 /*return*/];
            }
        });
    });
};
