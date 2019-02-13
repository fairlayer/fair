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
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var Context = /** @class */ (function () {
    function Context() {
        this.status = 'await';
        this.mempool = [];
        this.batch = [];
        this.sockets = {};
        this.browsers = [];
        this.busyPorts = [];
        this.withdrawalRequests = {};
        this.proposedBlock = null;
        this.lockedBlock = null;
        this.section = utils_1.section;
        this.datadir = 'data';
        // generic metric boilerplate: contains array of averages over time
        var getMetric = function () {
            return {
                max: 0,
                started: Date.now(),
                total: 0,
                current: 0,
                last_avg: 0,
                avgs: []
            };
        };
        this.metrics = {
            volume: getMetric(),
            fail: getMetric(),
            settle: getMetric(),
            fees: getMetric(),
            syncChanges: getMetric(),
            //
            bandwidth: getMetric(),
            ecverify: getMetric()
        };
    }
    // derives needed keys from the seed, saves creds into pk.json
    Context.prototype.init = function (username, seed) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.username = username;
                        this.seed = seed;
                        this.id = nacl.sign.keyPair.fromSeed(this.seed);
                        this.pubkey = bin(this.id.publicKey);
                        this.block_keypair = nacl.sign.keyPair.fromSeed(sha3('block' + this.seed));
                        this.block_pubkey = bin(this.block_keypair.publicKey).toString('hex');
                        this.box = nacl.box.keyPair.fromSecretKey(this.seed);
                        PK.username = username;
                        PK.seed = seed.toString('hex');
                        PK.usedBanks = [1];
                        PK.usedAssets = [1, 2];
                        if (K) {
                            // use 1st bank by default
                            require('./internal_rpc/with_channel')({
                                method: 'setLimits',
                                they_pubkey: K.banks[0].pubkey,
                                asset: 1,
                                rebalance: K.rebalance,
                                credit: K.credit
                            });
                        }
                        return [4 /*yield*/, promise_writeFile(datadir + '/offchain/pk.json', JSON.stringify(PK))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // returns current address: pubkey, box_pubkey, banks
    Context.prototype.getAddress = function () {
        var encodable = [
            me.record ? me.record.id : this.pubkey,
            bin(this.box.publicKey),
            PK.usedBanks
        ];
        return base58.encode(r(encodable));
    };
    Context.prototype.is_me = function (pubkey) {
        return me.pubkey && me.pubkey.equals(pubkey);
    };
    // onchain events recorded for current user
    Context.prototype.addEvent = function (data) {
        Event.create({
            blockId: K.total_blocks,
            data: stringify(data)
        });
    };
    //add a transaction to next batch
    Context.prototype.batchAdd = function (method, args) {
        if (!me.record) {
            react({ alert: "You can't do onchain tx if you are not registred" });
            return false;
        }
        var mergeable = ['withdraw', 'deposit'];
        if (mergeable.includes(method)) {
            var exists = me.batch.find(function (b) { return b[0] == method && b[1][0] == args[0]; });
            if (exists) {
                // add to existing array
                exists[1][1].push(args[1]);
            }
            else {
                // create new set, withdrawals go first
                me.batch[method == 'withdraw' ? 'unshift' : 'push']([
                    method,
                    [args[0], [args[1]]]
                ]);
            }
        }
        else if (method == 'revealSecrets') {
            var exists = me.batch.find(function (b) { return b[0] == method; });
            // revealed secrets are not per-assets
            if (exists) {
                // add to existing array
                exists[1].push(args);
            }
            else {
                // create new set
                me.batch.push([method, [args]]);
            }
        }
        else {
            me.batch.push([method, args]);
        }
        return true;
    };
    // compiles signed tx from current batch, not state changing
    Context.prototype.batch_estimate = function (opts) {
        if (opts === void 0) { opts = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var by_first, merged, gaslimit, gasprice, to_sign, signed_batch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // we select our record again to get our current nonce
                        if (!me.id || !me.record || me.batch.length == 0) {
                            return [2 /*return*/, false];
                        }
                        // reload to latest nonce
                        return [4 /*yield*/, me.record.reload()];
                    case 1:
                        // reload to latest nonce
                        _a.sent();
                        by_first = function (a, b) { return b[0] - a[0]; };
                        merged = me.batch.map(function (m) {
                            if (m[0] == 'deposit' || m[0] == 'withdraw') {
                                m[1][1].sort(by_first);
                            }
                            return [methodMap(m[0]), m[1]];
                        });
                        gaslimit = 0 //uncapped
                        ;
                        gasprice = opts.gasprice ? parseInt(opts.gasprice) : K.min_gasprice;
                        to_sign = r([
                            methodMap('batch'),
                            me.record.batch_nonce,
                            gaslimit,
                            gasprice,
                            merged
                        ]);
                        signed_batch = r([me.record.id, ec(to_sign, me.id.secretKey), to_sign]);
                        return [2 /*return*/, {
                                signed_batch: signed_batch,
                                size: to_sign.length,
                                batch_nonce: me.record.batch_nonce,
                                batch_body: merged
                            }];
                }
            });
        });
    };
    // tell all validators the same thing
    Context.prototype.sendAllValidators = function (data) {
        K.validators.map(function (c) {
            me.send(c, data);
        });
    };
    // signs data and adds our pubkey
    Context.prototype.envelope = function () {
        var msg = r(Object.values(arguments));
        return r([bin(me.id.publicKey), ec(msg, me.id.secretKey), msg]);
    };
    Context.prototype.block_envelope = function () {
        var msg = r(Object.values(arguments));
        return r([
            bin(me.block_keypair.publicKey),
            ec(msg, me.block_keypair.secretKey),
            msg
        ]);
    };
    Context.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _i, _b, m;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // in json pubkeys are in hex
                        _a = me;
                        return [4 /*yield*/, User.findOne({
                                where: { pubkey: bin(me.id.publicKey) },
                                include: [Balance]
                            })];
                    case 1:
                        // in json pubkeys are in hex
                        _a.record = _c.sent();
                        if (me.record) {
                            me.my_validator = K.validators.find(function (m) { return m.id == me.record.id; });
                            me.my_bank = K.banks.find(function (m) { return m.id == me.record.id; });
                        }
                        // both validators and banks must run external_wss
                        if (me.my_validator) {
                            Periodical.startValidator();
                        }
                        if (me.my_bank) {
                            Periodical.startBank();
                        }
                        if (me.my_validator) {
                            for (_i = 0, _b = K.validators; _i < _b.length; _i++) {
                                m = _b[_i];
                                if (me.my_validator != m) {
                                    // we need to have connections ready to all validators
                                    me.send(m, { method: 'auth', data: Date.now() });
                                }
                            }
                        }
                        else {
                            // keep connection to all banks
                            K.validators.map(function (m) {
                                if (me.my_validator != m) {
                                    me.send(m, { method: 'auth', data: Date.now() });
                                    //l('Connected to ', m)
                                }
                            });
                        }
                        if (argv.CHEAT) {
                            // byzantine and testing flags
                            argv.CHEAT.split(',').map(function (flag) { return (me['CHEAT_' + flag] = true); });
                        }
                        if (K.total_blocks > 1) {
                            snapshotHash();
                        }
                        else {
                            // initial run? go monkey e2e test
                            require('../test/monkey');
                        }
                        Periodical.scheduleAll();
                        return [2 /*return*/];
                }
            });
        });
    };
    Context.prototype.startExternalRPC = function (advertized_url) {
        return __awaiter(this, void 0, void 0, function () {
            var port;
            var _this = this;
            return __generator(this, function (_a) {
                if (!advertized_url) {
                    return [2 /*return*/, l('Cannot start rpc on ', advertized_url)];
                }
                if (me.external_wss_server) {
                    return [2 /*return*/, l('Already have external server started')];
                }
                // there's 2nd dedicated websocket server for validator/bank commands
                me.external_wss_server = require('http').createServer(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, path, query, args, status_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = req.url.split('?'), path = _a[0], query = _a[1];
                                if (!path.startsWith('/faucet')) return [3 /*break*/, 2];
                                res.setHeader('Access-Control-Allow-Origin', '*');
                                args = querystring.parse(query);
                                l('faucet ', args);
                                return [4 /*yield*/, me.payChannel({
                                        address: args.address,
                                        amount: parseInt(args.amount),
                                        asset: parseInt(args.asset)
                                    })];
                            case 1:
                                status_1 = _b.sent();
                                res.end(status_1);
                                _b.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                }); });
                port = parseInt(advertized_url.split(':')[2]);
                me.external_wss_server.listen(on_server ? port + 200 : port);
                l("Bootstrapping external_wss at: " + advertized_url);
                // lowtps/hightps
                me.external_wss = new (base_port == 8433 ? require('uws') : ws).Server({
                    //noServer: true,
                    //port: port,
                    clientTracking: false,
                    perMessageDeflate: false,
                    server: me.external_wss_server,
                    maxPayload: 64 * 1024 * 1024
                });
                me.external_wss.on('error', function (err) {
                    l(err);
                });
                me.external_wss.on('connection', function (ws) {
                    ws.on('message', function (msg) {
                        RPC.external_rpc(ws, msg);
                    });
                });
                return [2 /*return*/];
            });
        });
    };
    Context.prototype.textMessage = function (they_pubkey, msg) {
        me.send(they_pubkey, { method: 'textMessage', msg: msg });
    };
    // a generic interface to send a websocket message to some user or validator
    // accepts Buffer or valid Service object
    Context.prototype.send = function (m, json) {
        if (typeof m == 'string')
            m = fromHex(m);
        var msg = bin(JSON.stringify(json));
        if (RPC.requireSig.includes(json.method)) {
            msg = r([
                methodMap('JSON'),
                bin(me.id.publicKey),
                bin(ec(msg, me.id.secretKey)),
                msg
            ]);
        }
        else {
            msg = r([methodMap('JSON'), null, null, msg]);
        }
        // regular pubkey
        if (m instanceof Buffer) {
            //if (json.method == 'update') l(`Sending to ${trim(m)} `, toHex(sha3(tx)))
            if (me.sockets[m]) {
                me.sockets[m].send(msg, wscb);
                return true;
            }
            else {
                // try to find by this pubkey among validators/banks
                var validator = K.validators.find(function (f) { return f.pubkey.equals(m); });
                var bank = K.banks.find(function (f) { return fromHex(f.pubkey).equals(m); });
                if (validator) {
                    m = validator;
                }
                else if (bank) {
                    m = bank;
                }
                else {
                    //l('Not online: ', m)
                    return false;
                }
            }
        }
        if (me.my_validator == m) {
            // send to self internally
            RPC.external_rpc(false, msg);
            return;
        }
        if (trace)
            l("Send " + m.id, json);
        if (me.sockets[m.pubkey]) {
            return me.sockets[m.pubkey].send(msg, wscb);
        }
        else {
            me.sockets[m.pubkey] = new WebSocketClient();
            me.sockets[m.pubkey].onmessage = function (msg) {
                RPC.external_rpc(me.sockets[m.pubkey], msg);
            };
            me.sockets[m.pubkey].onerror = function (e) {
                l('Failed to open the socket to ', m);
            };
            me.sockets[m.pubkey].onopen = function (e) {
                if (me.id) {
                    me.send(m.pubkey, { method: 'auth', data: Date.now() });
                }
                // first auth, then send actual message
                me.sockets[m.pubkey].send(msg, wscb);
            };
            me.sockets[m.pubkey].open(m.location);
        }
        return true;
    };
    return Context;
}());
exports.default = Context;
Context.prototype.consensus = require('./consensus');
Context.prototype.processChain = require('./onchain/process_chain');
Context.prototype.processBlock = require('./onchain/process_block');
Context.prototype.processBatch = require('./onchain/process_batch');
