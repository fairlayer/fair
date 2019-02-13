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
// This method ensures all settled hashlocks were ack on time. If we don't get ack on time,
// the hashlock may expire and we lose the money,
// that's why we must go to blockchain asap to reveal the secret to hashlock
module.exports = function () { return __awaiter(_this, void 0, void 0, function () {
    var deltas, _loop_1, _i, deltas_1, d;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                //l('Checking who has not ack')
                if (PK.pendingBatchHex)
                    return [2 /*return*/, l('Pending batch')];
                return [4 /*yield*/, Channel.findAll()];
            case 1:
                deltas = _a.sent();
                _loop_1 = function (d) {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, section(['use', d.they_pubkey], function () { return __awaiter(_this, void 0, void 0, function () {
                                    var ch, missed_ack, to_reveal, _i, _a, inward, unlocked, _b, _c, _d;
                                    return __generator(this, function (_e) {
                                        switch (_e.label) {
                                            case 0: return [4 /*yield*/, Channel.get(d.they_pubkey)];
                                            case 1:
                                                ch = _e.sent();
                                                if (!ch) {
                                                    return [2 /*return*/];
                                                }
                                                missed_ack = ch.d.ack_requested_at ? Date.now() - ch.d.ack_requested_at : 0;
                                                if (
                                                // already disputed
                                                ch.d.status == 'disputed' ||
                                                    // they still have some time
                                                    missed_ack < K.dispute_if_no_ack) {
                                                    return [2 /*return*/];
                                                }
                                                to_reveal = [];
                                                // TODO: Consider not disputing with people when no funds are at risk i.e. only dispute about unacked settles.
                                                refresh(ch);
                                                _i = 0, _a = ch.payments;
                                                _e.label = 2;
                                            case 2:
                                                if (!(_i < _a.length)) return [3 /*break*/, 5];
                                                inward = _a[_i];
                                                if (!(inward.is_inward &&
                                                    inward.outcome_type == 'outcomeSecret' &&
                                                    inward.status != 'ack')) return [3 /*break*/, 4];
                                                return [4 /*yield*/, Hashlock.findOne({ where: { hash: inward.hash } })];
                                            case 3:
                                                unlocked = _e.sent();
                                                if (!unlocked ||
                                                    unlocked.delete_at <
                                                        K.usable_blocks + K.dispute_delay_for_users + K.hashlock_exp // when we expect resolution of our dispute
                                                ) {
                                                    to_reveal.push(inward.outcome);
                                                }
                                                else {
                                                    l('Already unlocked in ', ch.d);
                                                }
                                                _e.label = 4;
                                            case 4:
                                                _i++;
                                                return [3 /*break*/, 2];
                                            case 5:
                                                if (!(to_reveal.length > 0)) return [3 /*break*/, 7];
                                                l("No ack dispute with " + trim(ch.d.they_pubkey) + " secrets " + to_reveal.length + " missed " + missed_ack + " with " + ch.d.ack_requested_at);
                                                me.batchAdd('revealSecrets', to_reveal);
                                                _c = (_b = me).batchAdd;
                                                _d = ['dispute'];
                                                return [4 /*yield*/, startDispute(ch)];
                                            case 6:
                                                _c.apply(_b, _d.concat([_e.sent()]));
                                                _e.label = 7;
                                            case 7: return [2 /*return*/];
                                        }
                                    });
                                }); })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, deltas_1 = deltas;
                _a.label = 2;
            case 2:
                if (!(_i < deltas_1.length)) return [3 /*break*/, 5];
                d = deltas_1[_i];
                return [5 /*yield**/, _loop_1(d)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/];
        }
    });
}); };
