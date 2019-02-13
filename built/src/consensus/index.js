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
/*
Consensus Reactor fires up every second and based on Unix Date.now() triggers an action
This is a state machine where each transition is triggered by going to next step (time-based).
Inspired by: https://tendermint.readthedocs.io/en/master/getting-started.html

Unlike tendermint we have no interest in fast 3s blocks and aim for "fat" blocks and low validator sig overhead with blocktime 1-10min. Also "await" step was added when validators are idle.

See external_rpc for other part of consensus.

|====propose====|====prevote====|====precommit====|================await==================|

propose > prevote on proposal or nil > precommit if 2/3+ prevotes or nil > commit if 2/3+ precommits and await.

Long term TODO: redundancy reduced gossip. For now with validators <= 100, everyone sends to everyone.

Byzantine (CHEAT_) scenarios for validator to attack network.

Expected security properties:
1/3- cannot make forks or deadlock consensus
2/3- cannot make forks w/o powerful network partition
1/3+ can attempt fork with partion. can deadlock by going offline
2/3+ can do anything

for all scenarios we use 4 nodes: A B C D each with 25% stake. We must tolerate 1 compromised node (A).

1. A gives all three different blocks.
= no block gains 2/3+ prevotes, next node is honest.

2. A proposes block1 to B C and block2 to D.
= block1 gains 3 prevotes, B and C precommit to block 1. A cheats on them and never gossips its own precommit. This round is failed. Next round B is still locked on block1 and proposes block1 again. B C and D all prevote and precommit on it = block1 is committed.

*/
var await_propose = require('./propose');
var propose_prevote = require('./prevote');
var prevote_precommit = require('./precommit');
var precommit_await = require('./await');
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
                    var phase;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                phase = compute_phase();
                                if (!(me.status == 'await' && phase == 'propose')) return [3 /*break*/, 2];
                                return [4 /*yield*/, await_propose()];
                            case 1:
                                _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                if (me.status == 'propose' && phase == 'prevote') {
                                    propose_prevote();
                                }
                                else if (me.status == 'prevote' && phase == 'precommit') {
                                    prevote_precommit();
                                }
                                else if (me.status == 'precommit' && phase == 'await') {
                                    precommit_await();
                                }
                                _a.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
        }
    });
}); };
