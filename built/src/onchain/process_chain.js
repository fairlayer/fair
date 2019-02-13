// chain has blocks, block has batches, batch has transactions
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
module.exports = function (args) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, section('onchain', function () { return __awaiter(_this, void 0, void 0, function () {
                    var original_state, end, our_prev_hash, _i, args_1, block, _a, methodId, built_by, total_blocks, prev_hash, timestamp, tx_root, db_hash, s, last_block, shares, precommits, precommit_body, i, startHrtime, _b, args_2, block, final_state, msg, raw;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                if (!argv.nocrypto) return [3 /*break*/, 2];
                                return [4 /*yield*/, onchain_state()];
                            case 1:
                                original_state = _c.sent();
                                _c.label = 2;
                            case 2:
                                end = perf('processChain');
                                our_prev_hash = fromHex(K.prev_hash);
                                for (_i = 0, args_1 = args; _i < args_1.length; _i++) {
                                    block = args_1[_i];
                                    // cast all rounds to integer
                                    if (typeof block[0] != 'number') {
                                        block[0] = readInt(block[0]);
                                    }
                                    _a = r(block[2]), methodId = _a[0], built_by = _a[1], total_blocks = _a[2], prev_hash = _a[3], timestamp = _a[4], tx_root = _a[5], db_hash = _a[6];
                                    if (prev_hash.equals(our_prev_hash)) {
                                        // hash of next header
                                        our_prev_hash = sha3(block[2]);
                                    }
                                    else {
                                        l("Outdated chain: " + K.total_blocks + " " + readInt(total_blocks));
                                        return [2 /*return*/];
                                    }
                                }
                                s = {
                                    missed_validators: [],
                                    dry_run: false
                                };
                                last_block = args[args.length - 1];
                                shares = 0;
                                precommits = last_block[1];
                                precommit_body = [methodMap('precommit'), last_block[2], last_block[0]];
                                for (i = 0; i < K.validators.length; i++) {
                                    if (precommits[i] &&
                                        precommits[i].length == 64 &&
                                        ec.verify(r(precommit_body), precommits[i], K.validators[i].block_pubkey)) {
                                        shares += K.validators[i].shares;
                                    }
                                    else {
                                        s.missed_validators.push(K.validators[i].id);
                                    }
                                }
                                if (shares < K.majority) {
                                    return [2 /*return*/, l("Not enough precommits on entire chain: " + shares + " ", args)];
                                }
                                if (!cached_result.sync_started_at) {
                                    cached_result.sync_started_at = K.total_blocks;
                                    cached_result.sync_tx_started_at = K.total_tx;
                                    cached_result.sync_progress = 0;
                                    startHrtime = hrtime();
                                }
                                _b = 0, args_2 = args;
                                _c.label = 3;
                            case 3:
                                if (!(_b < args_2.length)) return [3 /*break*/, 7];
                                block = args_2[_b];
                                s.round = block[0];
                                s.precommits = block[1];
                                s.header = block[2];
                                s.ordered_tx_body = block[3];
                                return [4 /*yield*/, me.processBlock(s)];
                            case 4:
                                if (!(_c.sent())) {
                                    l('Bad chain?');
                                    return [3 /*break*/, 7];
                                }
                                if (!argv.nocrypto) return [3 /*break*/, 6];
                                if (!(K.total_blocks >= parseInt(argv.stop_blocks))) return [3 /*break*/, 6];
                                return [4 /*yield*/, onchain_state()];
                            case 5:
                                final_state = _c.sent();
                                msg = {
                                    original: trim(original_state, 8),
                                    total_blocks: K.total_blocks,
                                    final: trim(final_state, 8),
                                    benchmark: ((hrtime() - startHrtime) / 1000000).toFixed(6)
                                };
                                Raven.captureMessage('SyncDone', {
                                    level: 'info',
                                    extra: msg,
                                    tags: msg
                                });
                                l('Result: ' + (msg.final == 'b84905fe'));
                                setTimeout(function () {
                                    fatal('done');
                                }, 1000);
                                return [2 /*return*/];
                            case 6:
                                _b++;
                                return [3 /*break*/, 3];
                            case 7:
                                end();
                                cached_result.sync_started_at = false;
                                cached_result.sync_tx_started_at = false;
                                react({});
                                // Ensure our last broadcasted batch was added
                                if (PK.pendingBatchHex) {
                                    raw = fromHex(PK.pendingBatchHex);
                                    if (trace)
                                        l('Rebroadcasting pending tx ', raw.length);
                                    react({
                                        alert: 'Rebroadcasting...',
                                        force: true
                                    });
                                    me.send(nextValidator(true), { method: 'add_batch', data: r([raw]) });
                                    return [2 /*return*/];
                                }
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
