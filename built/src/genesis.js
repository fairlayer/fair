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
// this file is only used during genesis to set initial K params and create first validators
var derive = require('./derive');
var createValidator = function (username, pw, loc, website) { return __awaiter(_this, void 0, void 0, function () {
    var seed, me, user, validator;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                l(username + " : " + pw + " at " + loc);
                return [4 /*yield*/, derive(username, pw)];
            case 1:
                seed = _a.sent();
                me = new Me();
                return [4 /*yield*/, me.init(username, seed)];
            case 2:
                _a.sent();
                return [4 /*yield*/, User.create({
                        pubkey: me.pubkey,
                        username: username
                    })];
            case 3:
                user = _a.sent();
                return [4 /*yield*/, user.createBalance({
                        asset: 1,
                        balance: 10000000000
                    })];
            case 4:
                _a.sent();
                return [4 /*yield*/, user.createBalance({
                        asset: 2,
                        balance: 10000000000
                    })];
            case 5:
                _a.sent();
                validator = {
                    id: user.id,
                    username: username,
                    location: loc,
                    website: website,
                    pubkey: toHex(me.pubkey),
                    box_pubkey: toHex(bin(me.box.publicKey)),
                    block_pubkey: me.block_pubkey,
                    missed_blocks: [],
                    shares: 0
                };
                return [2 /*return*/, [validator, seed]];
        }
    });
}); };
var writeGenesisOnchainConfig = function (k, datadir) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, promise_writeFile('./' + datadir + '/onchain/k.json', stringify(k))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var writeGenesisOffchainConfig = function (pk, datadir) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, promise_writeFile('./' + datadir + '/offchain/pk.json', stringify(pk))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
module.exports = function (datadir) { return __awaiter(_this, void 0, void 0, function () {
    var sec, K, local, base_rpc, base_web, _a, bankValidator, bankSeed, _i, _b, i, _c, validator_1, _1, left, ins, Router, addBank, data, routes, _loop_1, _d, routes_1, route, PK;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                l('Start genesis');
                sec = 1000;
                K = {
                    // Things that are different in testnet vs mainnet
                    network_name: 'testnet',
                    blocksize: 20000,
                    blocktime: 10 * sec,
                    step_latency: 2 * sec,
                    gossip_delay: 1 * sec,
                    //Time.at(1913370000) => 2030-08-19 20:40:00 +0900
                    bet_maturity: Date.now() + 100 * sec,
                    created_at: Date.now(),
                    usable_blocks: 0,
                    total_blocks: 0,
                    total_tx: 0,
                    total_bytes: 0,
                    total_tx_bytes: 0,
                    voting_period: 10,
                    current_db_hash: '',
                    blocks_since_last_snapshot: 999999999,
                    last_snapshot_height: 0,
                    snapshot_after_blocks: 100,
                    snapshots_taken: 0,
                    proposals_created: 0,
                    // cents per 100 bytes of tx
                    min_gasprice: 1,
                    // manually priced actions to prevent spam
                    account_creation_fee: 100,
                    standalone_balance: 1000,
                    bank_standalone_balance: 100000,
                    // up to X seconds, validators don't propose blocks if empty
                    // the problem is all delayed actions also happen much later if no blocks made
                    skip_empty_blocks: 0,
                    // each genesis is randomized
                    prev_hash: toHex(crypto.randomBytes(32)),
                    risk: 10000,
                    credit: 50000000,
                    rebalance: 5000000,
                    collected_fees: 0,
                    // latest block done at
                    ts: 0,
                    assets_created: 2,
                    // sanity limits for offchain payments
                    min_amount: 5,
                    max_amount: 300000000,
                    validators: [],
                    banks: [],
                    cache_timeout: 3 * sec,
                    safe_sync_delay: 180 * sec,
                    sync_limit: 500,
                    // global wide fee sanity limits
                    min_fee: 1,
                    max_fee: 5000,
                    // hashlock and dispute-related
                    secret_len: 32,
                    dispute_delay_for_users: 8,
                    dispute_delay_for_banks: 4,
                    hashlock_exp: 16,
                    hashlock_keepalive: 100,
                    max_hashlocks: 20,
                    hashlock_service_fee: 100,
                    // ensure it is much shorter than hashlock_exp
                    dispute_if_no_ack: 60 * sec // how long we wait for ack before going to blockchain
                };
                // Defines global Byzantine tolerance parameter
                // 0 would require 1 validator, 1 - 4, 2 - 7.
                // Long term goal is 3333 tolerance with 10,000 validators
                K.tolerance = 1;
                K.total_shares = K.tolerance * 3 + 1;
                K.majority = K.total_shares - K.tolerance;
                local = !argv['prod-server'];
                base_rpc = local ? 'ws://127.0.0.1' : 'wss://fairlayer.com';
                base_web = local ? 'http://127.0.0.1' : 'https://fairlayer.com';
                return [4 /*yield*/, createValidator('root', toHex(crypto.randomBytes(16)), base_rpc + ":8100", local ? 'http://127.0.0.1:8433' : 'https://fairlayer.com')];
            case 1:
                _a = _e.sent(), bankValidator = _a[0], bankSeed = _a[1];
                K.validators.push(bankValidator);
                _i = 0, _b = [8001, 8002, 8003];
                _e.label = 2;
            case 2:
                if (!(_i < _b.length)) return [3 /*break*/, 6];
                i = _b[_i];
                return [4 /*yield*/, createValidator(i.toString(), 'password', base_rpc + ":" + (i + 100), base_web + ":" + i)];
            case 3:
                _c = _e.sent(), validator_1 = _c[0], _1 = _c[1];
                left = Buffer.compare(fromHex(validator_1.pubkey), fromHex(bankValidator.pubkey)) == -1;
                K.validators.push(validator_1);
                return [4 /*yield*/, Insurance.create({
                        leftId: left ? validator_1.id : 1,
                        rightId: left ? 1 : validator_1.id
                    })];
            case 4:
                ins = _e.sent();
                ins.createSubinsurance({
                    asset: 1,
                    balance: 1000000,
                    ondelta: left ? 1000000 : 0
                });
                _e.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 2];
            case 6:
                // distribute shares
                K.validators[0].shares = 1;
                K.validators[0].platform = 'Digital Ocean SGP1';
                K.validators[1].shares = 1;
                K.validators[1].platform = 'AWS';
                K.validators[2].shares = 1;
                K.validators[2].platform = 'Azure';
                K.validators[3].shares = 1;
                K.validators[3].platform = 'Google Cloud';
                // set bank
                K.banks.push({
                    id: K.validators[0].id,
                    location: K.validators[0].location,
                    pubkey: K.validators[0].pubkey,
                    box_pubkey: K.validators[0].box_pubkey,
                    website: 'https://fairlayer.com',
                    // basis points
                    fee_bps: 10,
                    createdAt: Date.now(),
                    handle: 'Firstbank'
                });
                // similar to https://en.wikipedia.org/wiki/Nostro_and_vostro_accounts
                // in fairlayer both parties are equally non-custodial (no one "holds" an account in another party)
                // we don't expect more than 1-10k of banks any time soon (there are about 10,000 traditional banks in the world)
                // so in-JSON storage is fine
                K.routes = [];
                Router = require('../router');
                // testing stubs to check dijkstra
                if (argv.generate_airports) {
                    addBank = function (data) {
                        data.id = K.banks.length + 1000;
                        data.fee_bps = Math.round(Math.random() * 500);
                        data.pubkey = crypto.randomBytes(32);
                        data.createdAt = Date.now();
                        data.location = 'ws://127.0.0.1:8100';
                        K.banks.push(data);
                        return data;
                    };
                    data = fs.readFileSync('./tools/routes.csv', { encoding: 'utf8' });
                    routes = data.split('\n').slice(0, 200);
                    _loop_1 = function (route) {
                        var parts = route.split(',');
                        // direct flights only
                        if (parts[7] != '0')
                            return "continue";
                        //from 2 to 4
                        var from = K.banks.find(function (h) { return h.handle == parts[2]; });
                        var to = K.banks.find(function (h) { return h.handle == parts[4]; });
                        // if not exists, create stub-banks
                        if (!from)
                            from = addBank({ handle: parts[2] });
                        if (!to)
                            to = addBank({ handle: parts[4] });
                        if (Router.getRouteIndex(from.id, to.id) == -1) {
                            // only unique routes are saved
                            K.routes.push([from.id, to.id]);
                        }
                    };
                    for (_d = 0, routes_1 = routes; _d < routes_1.length; _d++) {
                        route = routes_1[_d];
                        _loop_1(route);
                    }
                }
                return [4 /*yield*/, Asset.create({
                        ticker: 'FRD',
                        name: 'Fair dollar',
                        desc: 'FRD',
                        issuerId: 1,
                        total_supply: 1000000000
                    })];
            case 7:
                _e.sent();
                return [4 /*yield*/, Asset.create({
                        ticker: 'FRB',
                        name: 'Fair bet',
                        desc: 'Capped at 100 billions, will be automatically converted into FRD 1-for-1 on 2030-08-19.',
                        issuerId: 1,
                        total_supply: 1000000000
                    })
                    // private config
                ];
            case 8:
                _e.sent();
                PK = {
                    username: 'root',
                    seed: bankSeed.toString('hex'),
                    auth_code: toHex(crypto.randomBytes(32)),
                    pendingBatchHex: null,
                    usedBanks: [1],
                    usedAssets: [1, 2]
                };
                return [4 /*yield*/, writeGenesisOnchainConfig(K, datadir)];
            case 9:
                _e.sent();
                return [4 /*yield*/, writeGenesisOffchainConfig(PK, datadir)];
            case 10:
                _e.sent();
                l("Genesis done (" + datadir + "). Banks " + K.banks.length + ", routes " + K.routes.length + ", quitting");
                // not graceful to not trigger hooks
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); };
