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
// This method receives set of transitions by another party and applies it
// banks normally pass forward payments, end users normally decode payloads and unlock hashlocks
module.exports = function (pubkey, ackState, ackSig, transitions, theirSignedState) { return __awaiter(_this, void 0, void 0, function () {
    var _a, ch, all, flushable, uniqFlushable, ourSignedState, mismatch, _i, _b, t, _c, transitions_1, t, _d, asset_1, amount, hash_1, exp, unlocker, derived, box_data, inward_hl, nextState, lastState, failure, reveal_until, outward_amount, nextHop, dest_ch, outward_hl, _e, asset, hash, outcome_type, outcome, valid, valid, outward_hl, subch, lastState, inward_ch, pull_hl, profitable, o, subch1, _f, _g, subch;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0: return [4 /*yield*/, Channel.get(pubkey)];
            case 1:
                ch = _h.sent();
                ch.last_used = Date.now();
                all = [];
                if (ch.d.status == 'disputed') {
                    loff('We are in a dispute');
                    return [2 /*return*/];
                }
                flushable = [];
                uniqFlushable = function (add) {
                    if (flushable.find(function (f) { return f.equals(add); })) {
                        //loff('Already scheduled for flush')
                    }
                    else {
                        flushable.push(add);
                    }
                };
                ourSignedState = r(ch.d.signed_state);
                prettyState(ourSignedState);
                // decode from hex and unpack
                theirSignedState = theirSignedState ? r(fromHex(theirSignedState)) : false;
                prettyState(theirSignedState);
                mismatch = function (reason, lastState) {
                    l("=========" + reason + ". Rollback " + ch.d.rollback_nonce + "\n  Current state \n  " + ascii_state(ch.state) + "\n\n  Our signed state\n  " + ascii_state(ourSignedState) + "\n~~~~~\n  Their current state\n  " + (ackState ? ascii_state(ackState) : '-') + "\n  " + (lastState ? ascii_state(lastState) : '-') + "\n\n  Their signed state\n  " + ascii_state(theirSignedState) + "\n~~~~~\n  Transitions\n  " + JSON.stringify(transitions, 2, 2) + "\n~~~~~\n  Pending\n  " + ch.d.pending + "\n=================\n");
                };
                if (!deltaVerify(ch.d, refresh(ch), ackSig)) return [3 /*break*/, 6];
                _i = 0, _b = ch.payments;
                _h.label = 2;
            case 2:
                if (!(_i < _b.length)) return [3 /*break*/, 5];
                t = _b[_i];
                if (!(t.status == 'sent')) return [3 /*break*/, 4];
                t.status = 'ack';
                return [4 /*yield*/, t.save()];
            case 3:
                _h.sent();
                _h.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                ch.d.ack_requested_at = null;
                //l('Nullify ack for ', ch.d.ack_requested_at, trim(pubkey))
                if (trace)
                    l('Received ack on current state, all sent transitions are now ack');
                return [3 /*break*/, 7];
            case 6:
                if (ch.d.status == 'merge') {
                    // we are in merge and yet we just received ackSig that doesnt ack latest state
                    mismatch('Rollback cant rollback');
                    fatal('Rollback cant rollback');
                    return [2 /*return*/];
                }
                if (transitions.length == 0) {
                    mismatch('Empty invalid ack ' + ch.d.status);
                    fatal('Empty invalid ack ' + ch.d.status);
                    return [2 /*return*/];
                }
                /*
                We received an acksig that doesnt match our current state. Apparently the partner sent
                transitions at the same time we did.
            
                Our job is to rollback to last known signed state, check ackSig against it, if true - apply
                partner's transitions, and then reapply the difference we made with OUR transitions
                namely - dispute_nonce and offdelta diffs because hashlocks are already processed.
            
                We hope the partner does the same with our transitions so we both end up on equal states.
            
                */
                if (ch.d.signed_state && ackSig.equals(ch.d.sig)) {
                    //if (trace)
                    ch.d.rollback_nonce = ch.d.dispute_nonce - ourSignedState[1][2];
                    ch.d.dispute_nonce = ourSignedState[1][2];
                    // resetting offdeltas in subchannels back to last signed state
                    ch.d.subchannels.map(function (subch) {
                        var signed_offdelta = ourSignedState[2].find(function (signed) { return signed[0] == subch.asset; })[1];
                        subch.rollback_offdelta = subch.offdelta - signed_offdelta;
                        subch.offdelta = signed_offdelta;
                    });
                    if (trace)
                        l("Start merge with " + trim(pubkey) + ", rollback " + ch.d.rollback_nonce + " to " + ch.d.dispute_nonce);
                }
                else {
                    mismatch('Deadlock');
                    l('Deadlock');
                    fatal('Deadlock?!');
                    //await me.flushChannel(ch, true)
                    return [2 /*return*/];
                }
                _h.label = 7;
            case 7:
                _c = 0, transitions_1 = transitions;
                _h.label = 8;
            case 8:
                if (!(_c < transitions_1.length)) return [3 /*break*/, 25];
                t = transitions_1[_c];
                // t is [method, args, ackSig]
                ackSig = fromHex(t[2]);
                if (!(t[0] == 'add' || t[0] == 'addrisk')) return [3 /*break*/, 16];
                _d = t[1], asset_1 = _d[0], amount = _d[1], hash_1 = _d[2], exp = _d[3], unlocker = _d[4];
                _a = [hash_1, unlocker].map(fromHex), hash_1 = _a[0], unlocker = _a[1];
                derived = ch.derived[asset_1];
                if (!derived) {
                    l('no derived');
                    return [2 /*return*/];
                }
                box_data = open_box_json(unlocker);
                // these things CANT happen, partner is malicious so just ignore and break
                if (amount < K.min_amount || amount > derived.they_available) {
                    l('Bad amount: ', amount, derived.they_available);
                    return [3 /*break*/, 25];
                }
                if (hash_1.length != 32) {
                    return [3 /*break*/, 25];
                }
                if (derived.inwards.length >= K.max_hashlocks) {
                    return [3 /*break*/, 25];
                }
                inward_hl = Payment.build({
                    // we either add add/addrisk or del right away
                    type: 'add',
                    status: 'ack',
                    is_inward: true,
                    amount: amount,
                    hash: hash_1,
                    exp: exp,
                    asset: asset_1,
                    channelId: ch.d.id
                });
                ch.payments.push(inward_hl);
                // check new state and sig, save
                ch.d.dispute_nonce++;
                nextState = refresh(ch);
                if (!deltaVerify(ch.d, nextState, ackSig)) {
                    lastState = r(fromHex(t[3]));
                    prettyState(lastState);
                    mismatch('error: Invalid state sig add', lastState);
                    return [3 /*break*/, 25];
                }
                failure = false;
                // it contains amount/asset you are expected to get
                // ensure to 'del' if there's any problem, or it will hang in your state forever
                // things below can happen even when partner is honest
                if (!box_data) {
                    failure = 'NoBox';
                }
                if (box_data.amount != amount) {
                    failure = 'WrongAmount';
                }
                if (box_data.asset != asset_1) {
                    failure = 'WrongAsset';
                }
                if (!me.my_bank && !box_data.secret) {
                    failure = 'NotBankNotReceiver';
                }
                reveal_until = K.usable_blocks + K.hashlock_exp;
                // safe ranges when we can accept hashlock exp
                if (exp < reveal_until - 2 || exp > reveal_until + 6) {
                    loff("error: exp is out of supported range: " + exp + " vs " + reveal_until);
                    failure = 'BadExp';
                }
                if (!failure) return [3 /*break*/, 9];
                l('Fail: ', failure);
                // go to next transition - we failed this hashlock already
                inward_hl.type = 'del';
                inward_hl.status = 'new';
                inward_hl.outcome_type = 'outcomeCapacity';
                inward_hl.outcome = failure;
                return [3 /*break*/, 14];
            case 9:
                if (!box_data.secret) return [3 /*break*/, 10];
                // we are final destination, no unlocker to pass
                // decode buffers from json
                box_data.secret = fromHex(box_data.secret);
                box_data.private_invoice = fromHex(box_data.private_invoice);
                // optional refund address
                inward_hl.source_address = box_data.source_address;
                inward_hl.private_invoice = box_data.private_invoice;
                // secret doesn't fit?
                if (sha3(box_data.secret).equals(hash_1)) {
                    inward_hl.outcome_type = 'outcomeSecret';
                    inward_hl.outcome = toHex(box_data.secret);
                }
                else {
                    inward_hl.outcome_type = 'outcomeCapacity';
                    inward_hl.outcome = 'BadSecret';
                }
                inward_hl.type = 'del';
                inward_hl.status = 'new';
                if (trace)
                    l("Received and unlocked a payment, changing addack->delnew");
                return [3 /*break*/, 14];
            case 10:
                if (!(me.my_bank && box_data.nextHop)) return [3 /*break*/, 13];
                outward_amount = afterFees(amount, me.my_bank);
                nextHop = fromHex(box_data.nextHop);
                return [4 /*yield*/, Channel.get(nextHop)];
            case 11:
                dest_ch = _h.sent();
                if (!dest_ch) {
                    return [2 /*return*/, l('invalid channel')];
                }
                outward_hl = Payment.build({
                    channelId: dest_ch.d.id,
                    type: t[0],
                    status: 'new',
                    is_inward: false,
                    amount: outward_amount,
                    hash: bin(hash_1),
                    exp: exp,
                    asset: asset_1,
                    // we pass nested unlocker for them
                    unlocker: fromHex(box_data.unlocker),
                    inward_pubkey: bin(pubkey)
                });
                dest_ch.payments.push(outward_hl);
                if (trace)
                    l("Mediating " + outward_amount + " payment to " + trim(nextHop));
                return [4 /*yield*/, outward_hl.save()];
            case 12:
                _h.sent();
                uniqFlushable(dest_ch.d.they_pubkey);
                return [3 /*break*/, 14];
            case 13:
                inward_hl.type = 'del';
                inward_hl.status = 'new';
                inward_hl.outcome_type = 'outcomeCapacity';
                inward_hl.outcome = 'UnknownError';
                _h.label = 14;
            case 14: return [4 /*yield*/, inward_hl.save()];
            case 15:
                _h.sent();
                return [3 /*break*/, 24];
            case 16:
                if (!(t[0] == 'del' || t[0] == 'delrisk')) return [3 /*break*/, 24];
                _e = t[1], asset = _e[0], hash = _e[1], outcome_type = _e[2], outcome = _e[3];
                hash = fromHex(hash);
                // try to parse outcome as secret and check its hash
                if (outcome_type == 'outcomeSecret' &&
                    sha3(fromHex(outcome)).equals(hash)) {
                    valid = true;
                }
                else {
                    valid = false;
                    //l('Failing hashlock ', t)
                }
                refresh(ch);
                outward_hl = ch.derived[asset].outwards.find(function (hl) {
                    return hl.hash.equals(hash);
                });
                if (!outward_hl) {
                    l('No such hashlock ', hash, ch.payments);
                    fatal('no such hashlock');
                    return [2 /*return*/];
                }
                subch = ch.d.subchannels.by('asset', asset);
                if (valid && t[0] == 'del') {
                    // secret was provided - remove & apply hashlock on offdelta
                    subch.offdelta += ch.d.isLeft() ? -outward_hl.amount : outward_hl.amount;
                }
                else if (!valid && t[0] == 'delrisk') {
                    // delrisk fail is refund
                    subch.offdelta += ch.d.isLeft() ? outward_hl.amount : -outward_hl.amount;
                }
                outward_hl.type = t[0];
                outward_hl.status = 'ack';
                // pass same outcome down the chain
                outward_hl.outcome_type = outcome_type;
                outward_hl.outcome = outcome;
                ch.d.dispute_nonce++;
                if (!deltaVerify(ch.d, refresh(ch), ackSig)) {
                    lastState = r(fromHex(t[3]));
                    prettyState(lastState);
                    mismatch('error: Invalid state sig at del', lastState);
                    return [3 /*break*/, 25];
                }
                me.metrics[valid ? 'settle' : 'fail'].current++;
                refresh(ch);
                outward_hl.resulting_balance = ch.derived[asset].available;
                return [4 /*yield*/, outward_hl.save()
                    // if there's an inward channel for this, we are bank
                ];
            case 17:
                _h.sent();
                if (!outward_hl.inward_pubkey) return [3 /*break*/, 22];
                return [4 /*yield*/, Channel.get(outward_hl.inward_pubkey)];
            case 18:
                inward_ch = _h.sent();
                if (!(inward_ch.d.status == 'disputed' && valid)) return [3 /*break*/, 19];
                loff('The inward channel is disputed (pointless to flush), which means we revealSecret - by the time of resultion hashlock will be unlocked');
                me.batchAdd('revealSecrets', outcome);
                return [3 /*break*/, 21];
            case 19:
                pull_hl = inward_ch.derived[asset].inwards.find(function (hl) {
                    return hl.hash.equals(hash);
                });
                if (!pull_hl) {
                    l("error: Not found pull", trim(pubkey), toHex(hash), valid, inward_ch.d.rollback_nonce, ascii_state(inward_ch.state));
                    return [2 /*return*/];
                    //fatal('Not found pull hl')
                }
                // pass same outcome down the chain
                pull_hl.outcome_type = outcome_type;
                pull_hl.outcome = outcome;
                pull_hl.type = 'del';
                pull_hl.status = 'new';
                // todo
                refresh(inward_ch);
                pull_hl.resulting_balance = inward_ch.derived[asset].available;
                return [4 /*yield*/, pull_hl.save()];
            case 20:
                _h.sent();
                if (trace)
                    l("Received a secret from " + trim(pubkey) + ", acking and pulling inward payment");
                uniqFlushable(outward_hl.inward_pubkey);
                // how much fee we just made by mediating the transfer?
                me.metrics.fees.current += pull_hl.amount - outward_hl.amount;
                // add to total volume
                me.metrics.volume.current += pull_hl.amount;
                _h.label = 21;
            case 21: return [3 /*break*/, 23];
            case 22:
                if (valid) {
                    react({ payment_outcome: 'success', confirm: 'Payment completed' }, false);
                }
                else {
                    // if not a bank, we are sender
                    react({
                        payment_outcome: 'fail',
                        alert: 'Payment failed, try another route: ' + outcome_type + outcome
                    }, false);
                }
                _h.label = 23;
            case 23:
                if (me.CHEAT_dontack) {
                    l('CHEAT: not acking the secret, but pulling from inward');
                    ch.d.status = 'CHEAT_dontack';
                    //await ch.d.save()
                    react({ private: true }); // lazy react
                    return [2 /*return*/];
                }
                _h.label = 24;
            case 24:
                _c++;
                return [3 /*break*/, 8];
            case 25:
                // since we applied partner's diffs, all we need is to add the diff of our own transitions
                if (ch.d.rollback_nonce > 0) {
                    // merging and leaving rollback mode
                    ch.d.dispute_nonce += ch.d.rollback_nonce;
                    ch.d.rollback_nonce = 0;
                    ch.d.subchannels.map(function (subch) {
                        subch.offdelta += subch.rollback_offdelta;
                        subch.rollback_offdelta = 0;
                    });
                    refresh(ch);
                    if (trace)
                        l("After merge our state is \n" + ascii_state(ch.state));
                    ch.d.status = 'merge';
                }
                else {
                    ch.d.status = 'master';
                    ch.d.pending = null;
                }
                // CHEAT_: storing most profitable outcome in asset 1
                if (!ch.d.CHEAT_profitable_state) {
                    ch.d.CHEAT_profitable_state = ch.d.signed_state;
                    ch.d.CHEAT_profitable_sig = ch.d.sig;
                }
                profitable = r(ch.d.CHEAT_profitable_state);
                o = readInt(profitable[2][0][1], true);
                subch1 = ch.d.subchannels.by('asset', 1);
                if ((ch.d.isLeft() && subch1.offdelta > o) ||
                    (!ch.d.isLeft() && subch1.offdelta < o)) {
                    ch.d.CHEAT_profitable_state = ch.d.signed_state;
                    ch.d.CHEAT_profitable_sig = ch.d.sig;
                }
                return [4 /*yield*/, ch.d.save()];
            case 26:
                _h.sent();
                _f = 0, _g = ch.d.subchannels;
                _h.label = 27;
            case 27:
                if (!(_f < _g.length)) return [3 /*break*/, 30];
                subch = _g[_f];
                return [4 /*yield*/, subch.save()];
            case 28:
                _h.sent();
                _h.label = 29;
            case 29:
                _f++;
                return [3 /*break*/, 27];
            case 30:
                react({ private: true }, false);
                return [2 /*return*/, flushable
                    // If no transitions received, do opportunistic flush, otherwise give forced ack
                ];
        }
    });
}); };
