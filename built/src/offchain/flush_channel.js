// Flush all new transitions to state channel. Types:
/*
Payment lifecycles:
outward payments: addnew > addsent > addack > delack
inward payments: addack > delnew > delsent > delack

add - add outward hashlock
del - remove inward hashlock by providing secret or reason of failure

This module has 3 types of behavior:
regular flush: flushes ack with or without transitions
opportunistic flush: flushes only if there are any transitions (used after receiving empty ack response)
during merge: no transitions can be applied, otherwise deadlock could happen.

Always flush opportunistically, unless you are acking your direct partner who sent tx to you.
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
var _this = this;
module.exports = function (pubkey, opportunistic) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, section(['use', pubkey], function () { return __awaiter(_this, void 0, void 0, function () {
                    var ch, flushable, uniqFlushable, all, _loop_1, _i, _a, t, ackState, ackSig, transitions, _loop_2, args, inward_ch, pull_hl, _b, _c, t, data, _d, _e, subch;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                if (trace)
                                    l("Started Flush " + trim(pubkey) + " " + opportunistic);
                                return [4 /*yield*/, Channel.get(pubkey)];
                            case 1:
                                ch = _f.sent();
                                ch.last_used = Date.now();
                                flushable = [];
                                uniqFlushable = function (add) {
                                    if (flushable.find(function (f) { return f.equals(add); })) {
                                        //loff('Already scheduled for flush')
                                    }
                                    else {
                                        flushable.push(add);
                                    }
                                };
                                all = [];
                                if (!(!me.sockets[ch.d.they_pubkey] || ch.d.status == 'disputed')) return [3 /*break*/, 6];
                                _loop_1 = function (t) {
                                    var to_fail;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(t.type + t.status == 'addnew')) return [3 /*break*/, 4];
                                                t.type = 'del';
                                                t.status = 'ack';
                                                t.outcome_type = 'fail';
                                                return [4 /*yield*/, t.save()];
                                            case 1:
                                                _a.sent();
                                                if (!t.inward_pubkey) return [3 /*break*/, 4];
                                                return [4 /*yield*/, Channel.get(t.inward_pubkey)];
                                            case 2:
                                                inward_ch = _a.sent();
                                                to_fail = inward_ch.payments.find(function (p) { return p.hash.equals(t.hash); });
                                                to_fail.type = 'del';
                                                to_fail.status = 'new';
                                                to_fail.outcome_type = 'outcomeCapacity';
                                                to_fail.outcome = 'outcomeCapacity';
                                                return [4 /*yield*/, to_fail.save()];
                                            case 3:
                                                _a.sent();
                                                me.metrics.fail.current++;
                                                _a.label = 4;
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                };
                                _i = 0, _a = ch.payments;
                                _f.label = 2;
                            case 2:
                                if (!(_i < _a.length)) return [3 /*break*/, 5];
                                t = _a[_i];
                                return [5 /*yield**/, _loop_1(t)];
                            case 3:
                                _f.sent();
                                _f.label = 4;
                            case 4:
                                _i++;
                                return [3 /*break*/, 2];
                            case 5: return [2 /*return*/, l('this channel is offline')];
                            case 6:
                                if (ch.d.status == 'sent') {
                                    if (trace)
                                        l("End flush " + trim(pubkey) + ", in sent");
                                    if (ch.d.ack_requested_at < Date.now() - 4000) {
                                        //me.send(ch.d.they_pubkey, 'update', ch.d.pending)
                                    }
                                    return [2 /*return*/];
                                }
                                if (ch.d.status == 'CHEAT_dontack') {
                                    return [2 /*return*/];
                                }
                                // todo move this logic into the iteration
                                if (ch.d.status == 'disputed') {
                                    return [2 /*return*/];
                                }
                                ackState = r(refresh(ch));
                                ackSig = ec(ackState, me.id.secretKey);
                                transitions = [];
                                if (!(ch.d.status == 'master')) return [3 /*break*/, 11];
                                _loop_2 = function (t) {
                                    var derived, subch, reason, nextState;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (t.status != 'new')
                                                    return [2 /*return*/, "continue"];
                                                derived = ch.derived[t.asset];
                                                subch = ch.d.subchannels.by('asset', t.asset);
                                                if (!(t.type == 'del')) return [3 /*break*/, 1];
                                                // remove a hashlock and provide either secret or reason of failure
                                                if (me.CHEAT_dontreveal) {
                                                    loff('CHEAT: not revealing our secret to inward');
                                                    return [2 /*return*/, "continue"];
                                                }
                                                if (t.outcome_type == 'outcomeSecret') {
                                                    subch.offdelta += ch.d.isLeft() ? t.amount : -t.amount;
                                                }
                                                args = [t.asset, t.hash, t.outcome_type, t.outcome];
                                                return [3 /*break*/, 8];
                                            case 1:
                                                if (!(t.type == 'delrisk')) return [3 /*break*/, 2];
                                                // works like refund
                                                //if (!t.secret) {
                                                subch.offdelta += ch.d.isLeft() ? -t.amount : t.amount;
                                                return [3 /*break*/, 8];
                                            case 2:
                                                if (!(t.type == 'add' || t.type == 'addrisk')) return [3 /*break*/, 8];
                                                if (t.lazy_until &&
                                                    t.lazy_until > Date.now() &&
                                                    t.amount > derived.uninsured) {
                                                    l('Still lazy, wait');
                                                    return [2 /*return*/, "continue"];
                                                }
                                                if (!(t.amount < K.min_amount ||
                                                    t.amount > K.max_amount ||
                                                    t.amount > derived.available ||
                                                    derived.outwards.length >= K.max_hashlocks)) return [3 /*break*/, 7];
                                                if (trace)
                                                    loff("error cannot transit " + t.amount + "/" + derived.available + ". Locks " + derived.outwards.length + ".");
                                                if (me.my_bank && t.amount > derived.available) {
                                                    me.textMessage(ch.d.they_pubkey, "Cant send " + t.amount + " available " + derived.available + ", extend credit");
                                                }
                                                me.metrics.fail.current++;
                                                t.type = 'del';
                                                t.status = 'ack';
                                                return [4 /*yield*/, t.save()];
                                            case 3:
                                                _a.sent();
                                                if (!t.inward_pubkey) return [3 /*break*/, 6];
                                                return [4 /*yield*/, Channel.get(t.inward_pubkey)];
                                            case 4:
                                                inward_ch = _a.sent();
                                                pull_hl = inward_ch.derived[t.asset].inwards.find(function (hl) {
                                                    return hl.hash.equals(t.hash);
                                                });
                                                pull_hl.type = 'del';
                                                pull_hl.status = 'new';
                                                reason = me.my_bank.id + " to " + trim(ch.d.they_pubkey);
                                                pull_hl.outcome_type = 'outcomeCapacity';
                                                pull_hl.outcome = reason;
                                                return [4 /*yield*/, pull_hl.save()];
                                            case 5:
                                                _a.sent();
                                                uniqFlushable(inward_ch.d.they_pubkey);
                                                _a.label = 6;
                                            case 6: return [2 /*return*/, "continue"];
                                            case 7:
                                                if (derived.outwards.length >= K.max_hashlocks) {
                                                    loff('error Cannot set so many hashlocks now, try later');
                                                    //continue
                                                }
                                                // set exp right before flushing to keep it fresh
                                                t.exp = K.usable_blocks + K.hashlock_exp;
                                                args = [t.asset, t.amount, t.hash, t.exp, t.unlocker];
                                                _a.label = 8;
                                            case 8:
                                                t.status = 'sent';
                                                refresh(ch);
                                                t.resulting_balance = ch.derived[t.asset].available;
                                                return [4 /*yield*/, t.save()];
                                            case 9:
                                                _a.sent();
                                                if (t.status != 'sent') {
                                                    fatal('Gotcha error! ', t);
                                                }
                                                // increment nonce after each transition
                                                ch.d.dispute_nonce++;
                                                nextState = r(refresh(ch));
                                                transitions.push([
                                                    t.type,
                                                    args,
                                                    ec(nextState, me.id.secretKey),
                                                    nextState
                                                ]);
                                                if (trace)
                                                    l("Adding a new " + t.type + ", resulting state: \n" + ascii_state(ch.state));
                                                return [2 /*return*/];
                                        }
                                    });
                                };
                                _b = 0, _c = ch.payments;
                                _f.label = 7;
                            case 7:
                                if (!(_b < _c.length)) return [3 /*break*/, 10];
                                t = _c[_b];
                                return [5 /*yield**/, _loop_2(t)];
                            case 8:
                                _f.sent();
                                _f.label = 9;
                            case 9:
                                _b++;
                                return [3 /*break*/, 7];
                            case 10:
                                if (opportunistic && transitions.length == 0) {
                                    if (trace)
                                        l("End flush " + trim(pubkey) + ": Nothing to flush");
                                    return [2 /*return*/];
                                }
                                return [3 /*break*/, 12];
                            case 11:
                                if (ch.d.status == 'merge') {
                                    // important trick: only merge flush once to avoid bombing with equal acks
                                    if (opportunistic)
                                        return [2 /*return*/];
                                    if (trace)
                                        l('In merge, no transactions can be added');
                                }
                                _f.label = 12;
                            case 12:
                                data = {
                                    method: 'update',
                                    ackState: ackState,
                                    ackSig: ackSig,
                                    signedState: ch.d.signed_state,
                                    transitions: transitions
                                };
                                if (transitions.length > 0) {
                                    // if there were any transitions, we need an ack on top
                                    ch.d.ack_requested_at = Date.now();
                                    //l('Set ack request ', ch.d.ack_requested_at, trim(pubkey))
                                    //ch.d.pending = stringify(data)
                                    ch.d.status = 'sent';
                                    if (trace)
                                        l("Flushing " + transitions.length + " to " + trim(pubkey));
                                }
                                return [4 /*yield*/, ch.d.save()];
                            case 13:
                                _f.sent();
                                _d = 0, _e = ch.d.subchannels;
                                _f.label = 14;
                            case 14:
                                if (!(_d < _e.length)) return [3 /*break*/, 17];
                                subch = _e[_d];
                                return [4 /*yield*/, subch.save()];
                            case 15:
                                _f.sent();
                                _f.label = 16;
                            case 16:
                                _d++;
                                return [3 /*break*/, 14];
                            case 17:
                                me.send(ch.d.they_pubkey, data);
                                return [2 /*return*/, Promise.all(flushable.map(function (fl) { return me.flushChannel(fl, true); }))];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
