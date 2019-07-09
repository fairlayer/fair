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
var compute_phase = function () {
    var second = Date.now() % K.blocktime;
    if (second < K.step_latency) {
        return 'propose';
    }
    else if (second < K.step_latency * 2) {
        return 'prevote';
    }
    else if (second < K.step_latency * 3) {
        return 'precommit';
    }
    else {
        return 'await';
    }
};
module.exports = function () { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, section('onchain', function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a, phase, epoch, header, ordered_tx_body, total_size, ordered_tx, s, _i, _b, candidate, result, propose, proof_1, shares_1, proof_2, shares_2, precommits_1;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                phase = compute_phase();
                                if (!(me.status == 'await' && phase == 'propose')) return [3 /*break*/, 7];
                                me.status = 'propose';
                                epoch = function (i) { return Math.floor(i / K.blocktime); };
                                // this is protection from a prevote replay attack
                                me.current_round = epoch(Date.now()) - epoch(K.ts) - 1;
                                //l('Next round', nextValidator().id)
                                if (me.my_validator != nextValidator()) {
                                    return [2 /*return*/];
                                }
                                else {
                                    //l('Our turn to propose')
                                }
                                //l(`it's our turn to propose, gossip new block`)
                                if (K.ts < Date.now() - K.blocktime * 3) {
                                    l('Danger: No previous block exists');
                                }
                                header = false;
                                ordered_tx_body = void 0;
                                if (!PK.locked_block) return [3 /*break*/, 1];
                                l("We precommited to previous block, keep proposing it");
                                (_a = PK.locked_block, header = _a.header, ordered_tx_body = _a.ordered_tx_body);
                                return [3 /*break*/, 6];
                            case 1:
                                total_size = 0;
                                ordered_tx = [];
                                s = { dry_run: true, meta: {} };
                                _i = 0, _b = me.mempool;
                                _c.label = 2;
                            case 2:
                                if (!(_i < _b.length)) return [3 /*break*/, 5];
                                candidate = _b[_i];
                                if (total_size + candidate.length >= K.blocksize) {
                                    l("The block is out of space, stop adding tx");
                                    return [3 /*break*/, 5];
                                }
                                return [4 /*yield*/, me.processBatch(s, candidate)];
                            case 3:
                                result = _c.sent();
                                if (result.success) {
                                    ordered_tx.push(candidate);
                                    total_size += candidate.length;
                                }
                                else {
                                    l("Bad tx in mempool", result, candidate);
                                    // punish submitter ip
                                }
                                _c.label = 4;
                            case 4:
                                _i++;
                                return [3 /*break*/, 2];
                            case 5:
                                //l(`Mempool ${me.mempool.length} vs ${ordered_tx.length}`)
                                // flush it or pass leftovers to next validator
                                me.mempool = [];
                                // Propose no blocks if mempool is empty
                                //if (ordered_tx.length > 0 || K.ts < Date.now() - K.skip_empty_blocks) {
                                ordered_tx_body = r(ordered_tx);
                                header = r([
                                    methodMap('propose'),
                                    me.record.id,
                                    K.total_blocks,
                                    Buffer.from(K.prev_hash, 'hex'),
                                    Date.now(),
                                    sha3(ordered_tx_body),
                                    current_db_hash()
                                ]);
                                _c.label = 6;
                            case 6:
                                if (!header) {
                                    l('No header to propose');
                                    return [2 /*return*/];
                                }
                                propose = r([
                                    bin(me.block_keypair.publicKey),
                                    bin(ec(header, me.block_keypair.secretKey)),
                                    header,
                                    ordered_tx_body
                                ]);
                                if (me.CHEAT_dontpropose) {
                                    l('CHEAT_dontpropose');
                                    return [2 /*return*/];
                                }
                                //l('Gossiping header ', toHex(header))
                                setTimeout(function () {
                                    me.sendAllValidators({ method: 'propose', propose: propose });
                                }, K.gossip_delay);
                                return [3 /*break*/, 8];
                            case 7:
                                if (me.status == 'propose' && phase == 'prevote') {
                                    me.status = 'prevote';
                                    proof_1 = me.block_envelope(methodMap('prevote'), me.proposed_block ? me.proposed_block.header : 0, me.current_round);
                                    setTimeout(function () {
                                        me.sendAllValidators({
                                            method: 'prevote',
                                            proof: proof_1
                                        });
                                    }, K.gossip_delay);
                                }
                                else if (me.status == 'prevote' && phase == 'precommit') {
                                    me.status = 'precommit';
                                    shares_1 = 0;
                                    K.validators.map(function (c, index) {
                                        if (PK['prevote_' + c.id]) {
                                            shares_1 += c.shares;
                                        }
                                    });
                                    // lock on this block. Unlock only if another block gets 2/3+
                                    if (shares_1 >= K.majority) {
                                        PK.locked_block = me.proposed_block;
                                    }
                                    proof_2 = me.block_envelope(methodMap('precommit'), PK.locked_block ? PK.locked_block.header : 0, me.current_round);
                                    if (me.CHEAT_dontprecommit) {
                                        l('We are in CHEAT and dont precommit ever');
                                        return [2 /*return*/];
                                    }
                                    setTimeout(function () {
                                        me.sendAllValidators({
                                            method: 'precommit',
                                            proof: proof_2
                                        });
                                    }, K.gossip_delay);
                                }
                                else if (me.status == 'precommit' && phase == 'await') {
                                    me.status = 'await';
                                    shares_2 = 0;
                                    precommits_1 = [];
                                    K.validators.map(function (c, index) {
                                        if (PK['precommit_' + c.id]) {
                                            shares_2 += c.shares;
                                            precommits_1[index] = PK['precommit_' + c.id];
                                        }
                                        else {
                                            precommits_1[index] = 0;
                                        }
                                        // flush sigs for next round
                                        delete PK['prevote_' + c.id];
                                        delete PK['precommit_' + c.id];
                                    });
                                    //me.current_round++
                                    if (shares_2 < K.majority) {
                                        l("Failed to commit #" + K.total_blocks + ", " + shares_2 + "/" + K.majority, K.total_blocks);
                                        // go sync immediately, went out of sync?
                                        //Periodical.syncChain()
                                    }
                                    else if (me.proposed_block.header) {
                                        //l('Commit block')
                                        // adding to our external queue to avoid race conditions
                                        // we don't call processBlock directly to avoid races
                                        me.processChain([
                                            [
                                                me.current_round,
                                                precommits_1,
                                                me.proposed_block.header,
                                                me.proposed_block.ordered_tx_body
                                            ]
                                        ]);
                                        //me.current_round = 0
                                    }
                                    me.proposed_block = null;
                                }
                                _c.label = 8;
                            case 8: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
        }
    });
}); };
