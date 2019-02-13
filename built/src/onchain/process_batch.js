// Verify and apply transactions to current state.
// Since we aim to be a settlement layer executed on *all* machines, transactions are sent in big signed batches to optimize load - only 1 batch per user per block is allowed
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
// Blockchain consists of blocks, blocks consist of batches sent by users, batches consist of transactions
// some big tx handlers are in separate tx/* files
var Tx = {
    withdraw: require('./tx/withdraw'),
    deposit: require('./tx/deposit'),
    dispute: require('./tx/dispute'),
    createOrder: require('./tx/create_order'),
    createAsset: require('./tx/create_asset'),
    createBank: require('./tx/create_bank'),
    propose: require('./tx/propose'),
    vote: require('./tx/vote')
};
Tx.revealSecrets = function (s, args) { return __awaiter(_this, void 0, void 0, function () {
    var _i, args_1, secret, hash, hl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _i = 0, args_1 = args;
                _a.label = 1;
            case 1:
                if (!(_i < args_1.length)) return [3 /*break*/, 7];
                secret = args_1[_i];
                hash = sha3(secret);
                return [4 /*yield*/, Hashlock.findOne({
                        where: {
                            hash: hash
                        }
                    })];
            case 2:
                hl = _a.sent();
                if (!hl) return [3 /*break*/, 4];
                // make it live longer
                hl.delete_at += K.hashlock_keepalive;
                return [4 /*yield*/, hl.save()];
            case 3:
                _a.sent();
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, Hashlock.create({
                    hash: hash,
                    revealed_at: K.usable_blocks,
                    // we don't want the evidence to be stored forever, obviously
                    delete_at: K.usable_blocks + K.hashlock_keepalive
                })];
            case 5:
                _a.sent();
                s.parsed_tx.events.push(['revealSecrets', hash]);
                _a.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 1];
            case 7: return [2 /*return*/];
        }
    });
}); };
Tx.cancelOrder = function (s, args) { return __awaiter(_this, void 0, void 0, function () {
    var id, order;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = readInt(args);
                return [4 /*yield*/, Order.findOne({ where: { id: id, userId: s.signer.id } })];
            case 1:
                order = _a.sent();
                if (!order) {
                    l('No such order for signer');
                    return [2 /*return*/];
                }
                // credit the order amount back to the creator
                userAsset(s.signer, order.assetId, order.amount);
                return [4 /*yield*/, order.destroy()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
module.exports = function (s, batch) { return __awaiter(_this, void 0, void 0, function () {
    var _a, _b, id, sig, body, _c, _d, methodId, batch_nonce, gaslimit, gasprice, transactions, gas, txfee, _i, transactions_1, _e, methodId_1, args, methodName, end;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _b = r(batch), id = _b[0], sig = _b[1], body = _b[2];
                _c = s;
                return [4 /*yield*/, User.findById(readInt(id), { include: [Balance] })];
            case 1:
                _c.signer = _f.sent();
                if (!s.signer || !s.signer.id) {
                    l(id, s.signer);
                    return [2 /*return*/, { error: "This user doesn't exist" }];
                }
                if (!ec.verify(body, sig, s.signer.pubkey)) {
                    return [2 /*return*/, { error: "Invalid tx signature." }];
                }
                _d = r(body), methodId = _d[0], batch_nonce = _d[1], gaslimit = _d[2], gasprice = _d[3], transactions = _d[4];
                _a = [
                    methodId,
                    batch_nonce,
                    gaslimit,
                    gasprice
                ].map(function (val) { return readInt(val); }), methodId = _a[0], batch_nonce = _a[1], gaslimit = _a[2], gasprice = _a[3];
                if (methodMap(methodId) != 'batch') {
                    return [2 /*return*/, { error: 'Only batched tx are supported' }];
                }
                if (gasprice < K.min_gasprice) {
                    return [2 /*return*/, { error: 'Gasprice offered is below minimum' }];
                }
                gas = batch.length;
                txfee = Math.round(gasprice * gas);
                // only asset=1 balance is used for fees
                if (userAsset(s.signer, 1) < txfee) {
                    return [2 /*return*/, { error: 'Not enough FRD balance to cover tx fee' }];
                }
                // This is just checking, so no need to apply
                if (s.dry_run) {
                    if (s.meta[s.signer.id]) {
                        // Why only 1 tx/block? Two reasons:
                        // * it's an extra hassle to ensure the account has money to cover subsequent w/o applying old ones. It would require fast rollbacks / reorganizations
                        // * The system intends to work as a rarely used layer, so people should batch transactions in one to make them cheaper and smaller anyway
                        return [2 /*return*/, {
                                signer: s.signer,
                                batch_nonce: batch_nonce,
                                error: 'Only 1 tx per block per user allowed'
                            }];
                    }
                    else {
                        if (s.signer.batch_nonce != batch_nonce) {
                            return [2 /*return*/, {
                                    error: "Invalid batch_nonce dry_run " + s.signer.batch_nonce + " vs " + batch_nonce
                                }];
                        }
                        // Mark this user to deny subsequent tx
                        if (!s.meta[s.signer.id])
                            s.meta[s.signer.id] = 1;
                        return [2 /*return*/, { success: true, gas: gas, gasprice: gasprice, txfee: txfee }];
                    }
                }
                else {
                    if (s.signer.batch_nonce != batch_nonce) {
                        return [2 /*return*/, {
                                error: "Invalid batch_nonce " + s.signer.batch_nonce + " vs " + batch_nonce
                            }];
                    }
                }
                // Tx is valid, can take the fee
                userAsset(s.signer, 1, -txfee);
                userAsset(s.meta.proposer, 1, txfee);
                if (me.is_me(s.signer.pubkey)) {
                    me.addEvent({
                        type: 'onchainfee',
                        desc: "Our tx was included and fee taken",
                        amount: txfee
                    });
                }
                K.collected_fees += txfee;
                s.parsed_tx = {
                    signer: s.signer,
                    batch_nonce: batch_nonce,
                    gas: gas,
                    gasprice: gasprice,
                    txfee: txfee,
                    length: batch.length,
                    // valid and executed events
                    events: []
                };
                _i = 0, transactions_1 = transactions;
                _f.label = 2;
            case 2:
                if (!(_i < transactions_1.length)) return [3 /*break*/, 5];
                _e = transactions_1[_i], methodId_1 = _e[0], args = _e[1];
                methodName = methodMap(readInt(methodId_1));
                if (!Tx[methodName]) return [3 /*break*/, 4];
                end = perf(methodName);
                // pass state and tx to apply
                return [4 /*yield*/, Tx[methodName](s, args)];
            case 3:
                // pass state and tx to apply
                _f.sent();
                end();
                _f.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                s.signer.batch_nonce++;
                return [4 /*yield*/, saveId(s.signer)];
            case 6:
                _f.sent();
                s.meta['parsed_tx'].push(s.parsed_tx);
                if (me.is_me(s.signer.pubkey)) {
                    if (PK.pendingBatchHex == toHex(batch)) {
                        //l('Added to chain')
                        //react({confirm: 'Your onchain transaction has been added!'}, false)
                        PK.pendingBatchHex = null;
                        me.pendingBatch = [];
                    }
                }
                return [2 /*return*/, { success: true }];
        }
    });
}); };
