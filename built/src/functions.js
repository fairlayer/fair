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
var fs = require('fs');
var path = require('path');
// returns validator making block right now, use skip=true to get validator for next slot
var nextValidator = function (skip) {
    if (skip === void 0) { skip = false; }
    var currentIndex = Math.floor(Date.now() / K.blocktime) % K.total_shares;
    var searchIndex = 0;
    for (var i = 0; i < K.validators.length; i++) {
        var current = K.validators[i];
        searchIndex += current.shares;
        if (searchIndex <= currentIndex)
            continue;
        if (skip == false)
            return current;
        // go back to 0
        if (currentIndex + 1 == K.total_shares)
            return K.validators[0];
        // same validator
        if (currentIndex + 1 < searchIndex)
            return current;
        // next validator
        return K.validators[i + 1];
    }
};
function parseAddress(address) {
    var _a;
    //l('Parse ', address)
    var addr = address.toString();
    var invoice = false;
    if (addr.includes('#')) {
        // the invoice is encoded as #hash in destination and takes precedence over manually sent invoice
        ;
        _a = addr.split('#'), addr = _a[0], invoice = _a[1];
    }
    var parts = [];
    try {
        parts = r(base58.decode(addr));
        if (parts[2])
            parts[2] = parts[2].map(function (val) { return readInt(val); });
    }
    catch (e) { }
    if (parts[0] && parts[0].length <= 6) {
        // not pubkey? can be an id and we find out real pubkey
        var u = yield User.findById(readInt(parts[0]), { include: [Balance] });
        if (u) {
            parts[0] = u.pubkey;
        }
    }
    // both pubkeys and bank list must be present
    if (parts[0] && parts[0].length == 32 && parts[1] && parts[1].length == 32) {
        return {
            pubkey: parts[0],
            box_pubkey: parts[1],
            banks: parts[2],
            invoice: invoice,
            address: addr
        };
    }
    else {
        l('bad address: ', stringify(addr));
        return false;
    }
}
exports.parseAddress = parseAddress;
exports.getSubchannel = function (ch, asset) {
    if (asset === void 0) { asset = 1; }
    return __awaiter(this, void 0, void 0, function () {
        var found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    found = ch.d.subchannels.find(function (s) { return s.asset == asset; });
                    if (!found) return [3 /*break*/, 1];
                    return [2 /*return*/, found];
                case 1: return [4 /*yield*/, ch.d.createSubchannel({
                        asset: asset
                    })];
                case 2:
                    found = _a.sent();
                    return [2 /*return*/, found];
            }
        });
    });
};
var getInsuranceBetween = function (user1, user2) {
    return __awaiter(this, void 0, void 0, function () {
        var compared, wh, str, ins;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (user1.pubkey.length != 32 ||
                        user2.pubkey.length != 32 ||
                        !user1.id ||
                        !user2.id) {
                        return [2 /*return*/, false];
                    }
                    compared = Buffer.compare(user1.pubkey, user2.pubkey);
                    if (compared == 0)
                        return [2 /*return*/, false];
                    wh = {
                        leftId: compared == -1 ? user1.id : user2.id,
                        rightId: compared == -1 ? user2.id : user1.id
                    };
                    str = stringify([wh.leftId, wh.rightId]);
                    return [4 /*yield*/, Insurance.findOrBuild({
                            where: wh,
                            defaults: { subinsurances: [] },
                            include: [Subinsurance]
                        })];
                case 1:
                    ins = (_a.sent())[0];
                    return [2 /*return*/, ins];
            }
        });
    });
};
// you cannot really reason about who owns what by looking at onchain db only (w/o offdelta)
// but the banks with higher sum(insurance) locked around them are more trustworthy
// and users probably own most part of insurances around them
var getInsuranceSumForUser = function (id, asset) {
    if (asset === void 0) { asset = 1; }
    return __awaiter(this, void 0, void 0, function () {
        var _a, sum;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [2 /*return*/, 0];
                case 1:
                    sum = _b.sent();
                    return [2 /*return*/, Math.max(sum, 0)];
            }
        });
    });
};
var getUserByIdOrKey = function (id) {
    return __awaiter(this, void 0, void 0, function () {
        var u;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeof id != 'number' && id.length != 32) {
                        id = readInt(id);
                    }
                    u = false;
                    if (!(typeof id == 'number')) return [3 /*break*/, 2];
                    return [4 /*yield*/, User.findById(id, { include: [Balance] })];
                case 1:
                    u = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, User.findOrBuild({
                        where: { pubkey: id },
                        defaults: { balances: [] },
                        include: [Balance]
                    })];
                case 3:
                    // buffer
                    u = (_a.sent())[0];
                    _a.label = 4;
                case 4: return [2 /*return*/, u];
            }
        });
    });
};
var userAsset = function (user, asset, diff) {
    if (!user.balances)
        return 0;
    if (diff) {
        var b = user.balances.by('asset', asset);
        if (b) {
            b.balance += diff;
            return b.balance;
        }
        else {
            // todo is safe to not save now?
            b = Balance.build({
                userId: user.id,
                asset: asset,
                balance: diff
            });
            user.balances.push(b);
            return b.balance;
        }
    }
    else {
        var b = user.balances.by('asset', asset);
        return b ? b.balance : 0;
    }
};
var userPayDebts = function (user, asset, parsed_tx) { return __awaiter(_this, void 0, void 0, function () {
    var debts, _i, debts_1, d, u, chargable;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!user.has_debts)
                    return [2 /*return*/, false];
                return [4 /*yield*/, user.getDebts({ where: { asset: asset } })];
            case 1:
                debts = _a.sent();
                _i = 0, debts_1 = debts;
                _a.label = 2;
            case 2:
                if (!(_i < debts_1.length)) return [3 /*break*/, 10];
                d = debts_1[_i];
                return [4 /*yield*/, User.findById(d.oweTo, { include: [Balance] })
                    // FRD cannot be enforced below safety limit,
                    // otherwise the nodes won't be able to send onchain tx
                ];
            case 3:
                u = _a.sent();
                chargable = asset == 1
                    ? userAsset(user, asset) - K.bank_standalone_balance
                    : userAsset(user, asset);
                if (!(d.amount_left <= userAsset(user, asset))) return [3 /*break*/, 6];
                userAsset(user, asset, -d.amount_left);
                userAsset(u, asset, d.amount_left);
                parsed_tx.events.push(['enforceDebt', d.amount_left, u.id]);
                return [4 /*yield*/, saveId(u)];
            case 4:
                _a.sent();
                return [4 /*yield*/, d.destroy()]; // the debt was paid in full
            case 5:
                _a.sent(); // the debt was paid in full
                return [3 /*break*/, 9];
            case 6:
                d.amount_left -= chargable;
                userAsset(u, asset, chargable);
                userAsset(user, asset, -chargable); // this user's balance is 0 now!
                parsed_tx.events.push(['enforceDebt', chargable, u.id]);
                return [4 /*yield*/, saveId(u)];
            case 7:
                _a.sent();
                return [4 /*yield*/, d.save()];
            case 8:
                _a.sent();
                return [3 /*break*/, 10];
            case 9:
                _i++;
                return [3 /*break*/, 2];
            case 10: return [4 /*yield*/, user.countDebts()];
            case 11:
                // no debts left (including other assets)?
                if ((_a.sent()) == 0) {
                    user.has_debts = false;
                }
                return [4 /*yield*/, saveId(user)];
            case 12:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var findRevealed = function (locks) { return __awaiter(_this, void 0, void 0, function () {
    var final, _i, locks_1, lock, hl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                final = 0;
                _i = 0, locks_1 = locks;
                _a.label = 1;
            case 1:
                if (!(_i < locks_1.length)) return [3 /*break*/, 4];
                lock = locks_1[_i];
                return [4 /*yield*/, Hashlock.findOne({
                        where: {
                            hash: lock[1]
                        }
                    })];
            case 2:
                hl = _a.sent();
                if (hl) {
                    if (hl.revealed_at <= readInt(lock[2])) {
                        final += readInt(lock[0]);
                    }
                    else {
                        l('Revealed too late ', lock);
                    }
                }
                else {
                    l('Failed to unlock: ', lock);
                }
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/, final];
        }
    });
}); };
exports.insuranceResolve = function (ins) { return __awaiter(_this, void 0, void 0, function () {
    var left, right, allResolved, subchannels, _i, subchannels_1, subch, asset, subins, delta, _a, _b, resolved, debtor, payOrDebt, _c, _d, withUs, ch, _e, _f, subch;
    var _this = this;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                if (!ins.dispute_state) {
                    return [2 /*return*/, l("No dispute_state to resolve")];
                }
                return [4 /*yield*/, getUserByIdOrKey(ins.leftId)];
            case 1:
                left = _g.sent();
                return [4 /*yield*/, getUserByIdOrKey(ins.rightId)];
            case 2:
                right = _g.sent();
                allResolved = [];
                subchannels = r(ins.dispute_state);
                _i = 0, subchannels_1 = subchannels;
                _g.label = 3;
            case 3:
                if (!(_i < subchannels_1.length)) return [3 /*break*/, 13];
                subch = subchannels_1[_i];
                asset = readInt(subch[0]);
                subins = ins.subinsurances.by('asset', asset);
                delta = (subins ? subins.ondelta : 0);
                delta += readInt(subch[1], true); //offdelta
                // revealed in time hashlocks are applied to delta
                _a = delta;
                return [4 /*yield*/, findRevealed(subch[2])];
            case 4:
                // revealed in time hashlocks are applied to delta
                delta = _a + _g.sent();
                _b = delta;
                return [4 /*yield*/, findRevealed(subch[3])];
            case 5:
                delta = _b - _g.sent();
                resolved = resolveChannel(subins ? subins.balance : 0, delta, true);
                resolved.asset = asset;
                // splitting insurance between users
                userAsset(left, asset, resolved.insured);
                userAsset(right, asset, resolved.they_insured);
                debtor = false;
                payOrDebt = function (asset, debtor, oweTo, amount_left) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(userAsset(debtor, asset) >= amount_left)) return [3 /*break*/, 1];
                                // pay now
                                userAsset(debtor, asset, -amount_left);
                                userAsset(oweTo, asset, amount_left);
                                return [2 /*return*/, false];
                            case 1:
                                debtor.has_debts = true;
                                return [4 /*yield*/, Debt.create({
                                        asset: asset,
                                        userId: debtor.id,
                                        oweTo: oweTo.id,
                                        amount_left: amount_left
                                    })];
                            case 2: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); };
                if (!(resolved.uninsured > 0)) return [3 /*break*/, 7];
                _c = resolved;
                return [4 /*yield*/, payOrDebt(asset, right, left, resolved.uninsured)];
            case 6:
                _c.debt = _g.sent();
                return [3 /*break*/, 9];
            case 7:
                if (!(resolved.they_uninsured > 0)) return [3 /*break*/, 9];
                _d = resolved;
                return [4 /*yield*/, payOrDebt(asset, left, right, resolved.they_uninsured)];
            case 8:
                _d.they_debt = _g.sent();
                _g.label = 9;
            case 9:
                if (!subins) return [3 /*break*/, 11];
                // zeroify now
                return [4 /*yield*/, subins.destroy()];
            case 10:
                // zeroify now
                _g.sent();
                _g.label = 11;
            case 11:
                allResolved.push(resolved);
                _g.label = 12;
            case 12:
                _i++;
                return [3 /*break*/, 3];
            case 13:
                ins.dispute_delayed = null;
                ins.dispute_state = null;
                ins.dispute_left = null;
                //ins.dispute_nonce = null
                return [4 /*yield*/, saveId(ins)];
            case 14:
                //ins.dispute_nonce = null
                _g.sent();
                return [4 /*yield*/, saveId(left)];
            case 15:
                _g.sent();
                return [4 /*yield*/, saveId(right)];
            case 16:
                _g.sent();
                withUs = me.is_me(left.pubkey)
                    ? right
                    : me.is_me(right.pubkey)
                        ? left
                        : false;
                if (!withUs) return [3 /*break*/, 23];
                return [4 /*yield*/, Channel.get(withUs.pubkey)];
            case 17:
                ch = _g.sent();
                ch.ins = ins;
                _e = 0, _f = ch.d.subchannels;
                _g.label = 18;
            case 18:
                if (!(_e < _f.length)) return [3 /*break*/, 21];
                subch = _f[_e];
                subch.offdelta = 0;
                subch.rebalance = 0;
                subch.credit = 0;
                subch.they_rebalance = 0;
                subch.they_credit = 0;
                return [4 /*yield*/, subch.save()];
            case 19:
                _g.sent();
                _g.label = 20;
            case 20:
                _e++;
                return [3 /*break*/, 18];
            case 21:
                // reset disputed status and ack timestamp
                ch.d.status = 'master';
                ch.d.ack_requested_at = null;
                return [4 /*yield*/, saveId(ch.d)];
            case 22:
                _g.sent();
                me.addEvent({
                    type: 'disputeResolved',
                    ins: ins,
                    outcomes: allResolved
                });
                _g.label = 23;
            case 23: return [2 /*return*/, allResolved];
        }
    });
}); };
exports.proposalExecute = function (proposal) { return __awaiter(_this, void 0, void 0, function () {
    var pr;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!proposal.code) return [3 /*break*/, 2];
                return [4 /*yield*/, eval("(async function() { " + proposal.code + " })()")];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (proposal.patch.length > 0) {
                    me.request_reload = true;
                    try {
                        pr = require('child_process').exec('patch -p1', function (error, stdout, stderr) {
                            console.log(error, stdout, stderr);
                        });
                        pr.stdin.write(proposal.patch);
                        pr.stdin.end();
                    }
                    catch (e) {
                        l(e);
                    }
                }
                return [2 /*return*/];
        }
    });
}); };
exports.startDispute = function (ch) { return __awaiter(_this, void 0, void 0, function () {
    var id;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = ch.partner ? ch.partner : ch.d.they_pubkey;
                ch.d.status = 'disputed';
                ch.d.ack_requested_at = null;
                return [4 /*yield*/, ch.d.save()
                    // the user is not even registered (we'd have to register them first)
                ];
            case 1:
                _a.sent();
                // the user is not even registered (we'd have to register them first)
                return [2 /*return*/, ch.d.sig ? [id, ch.d.sig, ch.d.signed_state] : [id]];
        }
    });
}); };
exports.deltaVerify = function (delta, state, ackSig) {
    // canonical state representation
    var canonical = r(state);
    if (ec.verify(canonical, ackSig, delta.they_pubkey)) {
        if (trace)
            l("Successfully verified sig against state\n" + ascii_state(state));
        delta.sig = ackSig;
        delta.signed_state = canonical;
        return true;
    }
    else {
        return false;
    }
};
