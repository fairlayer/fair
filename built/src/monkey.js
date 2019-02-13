// Fairlayer runs e2e tests on itself,
// different nodes acting like "monkeys" and doing different overlapping scenarios
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
var payMonkey = function (on_server, counter) {
    if (counter === void 0) { counter = 1; }
    return __awaiter(_this, void 0, void 0, function () {
        var parsedAddress, reg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parsedAddress = false;
                    _a.label = 1;
                case 1:
                    if (!!parsedAddress) return [3 /*break*/, 3];
                    return [4 /*yield*/, parseAddress(monkeys.randomElement())];
                case 2:
                    parsedAddress = _a.sent();
                    if (me.is_me(parsedAddress.pubkey))
                        parsedAddress = false;
                    return [3 /*break*/, 1];
                case 3: 
                // offchain payment
                return [4 /*yield*/, me.payChannel({
                        address: parsedAddress.address,
                        amount: 100 + Math.round(Math.random() * 200),
                        asset: 1
                    })];
                case 4:
                    // offchain payment
                    _a.sent();
                    return [4 /*yield*/, getUserByIdOrKey(parsedAddress.pubkey)
                        // onchain payment (batched, not sent to validator yet)
                    ];
                case 5:
                    reg = _a.sent();
                    // onchain payment (batched, not sent to validator yet)
                    me.batchAdd('deposit', [
                        1,
                        [
                            Math.round(Math.random() * 1000),
                            reg.id ? reg.id : parsedAddress.pubkey,
                            0
                        ]
                    ]);
                    // run on server infinitely and with longer delays
                    // but for local tests limit requests and run faster
                    if (on_server) {
                        // replenish with testnet faucet once in a while
                        setTimeout(function () {
                            payMonkey(on_server, counter + 1);
                        }, Math.round(500 + Math.random() * 9000));
                    }
                    else if (counter < 6) {
                        setTimeout(function () {
                            payMonkey(on_server, counter + 1);
                        }, 300);
                    }
                    return [2 /*return*/];
            }
        });
    });
};
var run = function () { return __awaiter(_this, void 0, void 0, function () {
    var _i, monkeys_1, dest, _a, pubkey, box_pubkey;
    var _this = this;
    return __generator(this, function (_b) {
        if (base_port > 8000) {
            // add first bank by default and open limit
            //PK.usedBanks.push(1)
            setTimeout(function () { }, 4000);
        }
        // only in monkey mode, not on end user node
        if (base_port != 8008) {
            Periodical.schedule('broadcast', K.blocktime);
        }
        if (base_port > 8000 && base_port < 8500) {
            monkeys.splice(monkeys.indexOf(me.getAddress()), 1); // *except our addr
            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                var ch, withdrawn;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // ensure 1st bank node is up already
                        return [4 /*yield*/, sleep(2000)];
                        case 1:
                            // ensure 1st bank node is up already
                            _a.sent();
                            return [4 /*yield*/, require('../src/internal_rpc/with_channel')({
                                    method: 'setLimits',
                                    they_pubkey: K.banks[0].pubkey,
                                    asset: 1,
                                    rebalance: K.rebalance,
                                    credit: K.credit
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, sleep(3000)];
                        case 3:
                            _a.sent();
                            me.send(K.banks[0].pubkey, {
                                method: 'testnet',
                                action: 'faucet',
                                asset: 1,
                                amount: 500000,
                                address: me.getAddress()
                            });
                            l('Requesting faucet to ' + me.getAddress());
                            if (!(me.record && me.record.id == 2)) return [3 /*break*/, 6];
                            return [4 /*yield*/, Channel.get(K.banks[0].pubkey)];
                        case 4:
                            ch = _a.sent();
                            return [4 /*yield*/, require('../src/internal_rpc/with_channel')({
                                    method: 'withdraw',
                                    they_pubkey: toHex(ch.d.they_pubkey),
                                    asset: 1,
                                    amount: 1234
                                })];
                        case 5:
                            withdrawn = _a.sent();
                            require('../src/internal_rpc/external_deposit')({
                                asset: 1,
                                userId: 3,
                                bank: 1,
                                amount: 1234
                            });
                            _a.label = 6;
                        case 6: return [2 /*return*/];
                    }
                });
            }); }, K.blocktime);
            setTimeout(function () {
                payMonkey(on_server);
                // intended to fail
                me.payChannel({
                    address: 'BummA99ygBEKX5pwxQdjgwLuBWUe1J3y83PgG4UUPRVeBLcq9z1MvbGwCVywazybHj3cazHohFMkhxhako7xmRU4t7cZSSSC#FAIL',
                    amount: 100,
                    asset: 1
                }).then(console.log);
            }, 20000);
        }
        // below go pre-registred users
        if (!me.record || me.record.id > 10) {
            return [2 /*return*/];
        }
        if (me.record.id == 1) {
            l('Scheduling e2e checks');
            // after a while the bank checks environment, db counts etc and test fails if anything is unexpected
            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                var monkey5, monkey5ins, failed, e2e;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // no need to run test on server
                            if (on_server)
                                return [2 /*return*/];
                            return [4 /*yield*/, Periodical.syncChanges()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, getUserByIdOrKey(5)];
                        case 2:
                            monkey5 = _a.sent();
                            return [4 /*yield*/, getInsuranceSumForUser(5)
                                // must be >100 after expected rebalance
                            ];
                        case 3:
                            monkey5ins = _a.sent();
                            failed = [];
                            if (me.metrics.settle.total == 0)
                                failed.push('metrics.settled');
                            if (me.metrics.fail.total == 0)
                                failed.push('metrics.failed');
                            return [4 /*yield*/, Payment.count()];
                        case 4:
                            if ((_a.sent()) == 0)
                                failed.push('payments');
                            // was this entirely new user created since genesis?
                            if (!monkey5)
                                failed.push('monkey5');
                            return [4 /*yield*/, Block.count()];
                        case 5:
                            //if (monkey5ins < 100) failed.push('monkey5insurance')
                            if ((_a.sent()) < 2)
                                failed.push('blocks');
                            return [4 /*yield*/, Channel.count()];
                        case 6:
                            if ((_a.sent()) < 5)
                                failed.push('deltas');
                            e2e = 'e2e: ' + (failed.length == 0 ? 'success' : failed.join(', '));
                            l(e2e);
                            Raven.captureMessage(e2e, {
                                level: 'info'
                            });
                            child_process.exec("osascript -e 'display notification \"" + e2e + "\"'");
                            if (failed.length != 0) {
                                //fatal(0)
                            }
                            return [2 /*return*/];
                    }
                });
            }); }, 80000);
            // adding onchain balances to monkeys
            for (_i = 0, monkeys_1 = monkeys; _i < monkeys_1.length; _i++) {
                dest = monkeys_1[_i];
                _a = r(base58.decode(dest)), pubkey = _a[0], box_pubkey = _a[1];
                if (pubkey.length < 6)
                    pubkey = readInt(pubkey);
                me.batchAdd('deposit', [1, [1000000, pubkey, 0]]);
            }
        }
        if (me.record.id == 4) {
            // trigger the dispute from bank
            //me.CHEAT_dontack = true
            me.CHEAT_dontwithdraw = true;
            setTimeout(function () {
                me.payChannel({
                    amount: 20000,
                    address: monkeys[0],
                    asset: 1
                });
            }, 12000);
        }
        return [2 /*return*/];
    });
}); };
if (argv.monkey) {
    run();
}
