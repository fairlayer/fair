"use strict";
/*
This file starts the daemon

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
Object.defineProperty(exports, "__esModule", { value: true });
require('./utils/system');
require('./utils/channel');
require('./utils/debug');
var system_1 = require("./utils/system");
var functions_1 = require("./utils/functions");
var Periodical = require('periodical');
var derive = require("./utils/derive");
var fs = require('fs');
require('./browser');
var OnchainDB = require('./db/onchain_db');
var OffchainDB = require('./db/offchain_db');
var SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler('crash.log');
var minimist = require("minimist");
var argv = minimist(process.argv.slice(2), {
    string: ['username', 'pw']
});
var datadir = argv.datadir ? argv.datadir : 'data';
var base_port = argv.p ? parseInt(argv.p) : 8001;
var trace = !!argv.trace;
var node_started_at = Date.now();
process.title = 'Fairlayer ' + base_port;
var cache = {
    ins: {},
    users: {},
    ch: {}
};
var crypto = require("crypto");
var monkeys = [];
var on_server = !!argv['prod-server'];
var git_commit = require('child_process')
    .execSync('cat HEAD')
    .toString()
    .trim();
// must stay global for logs
var Raven = require("raven");
Raven.config('https://299a833b1763402f9216d8e7baeb6379@sentry.io/1226040', {
    release: git_commit
}).install();
function startFairlayer() {
    return __awaiter(this, void 0, void 0, function () {
        var offchain_exists, onchainDB, offchainDB, e_1, Me, kFile, K, pkFile, PK, me, username, password;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!fs.existsSync('./' + datadir)) {
                        system_1.l('Setting up ' + datadir);
                        fs.mkdirSync('./' + datadir);
                        fs.mkdirSync('./' + datadir + '/onchain');
                        fs.mkdirSync('./' + datadir + '/offchain');
                        return [2 /*return*/];
                    }
                    if (!fs.existsSync('./' + datadir + '/onchain')) {
                        fs.mkdirSync('./' + datadir + '/onchain');
                    }
                    if (!fs.existsSync('./' + datadir + '/offchain')) {
                        fs.mkdirSync('./' + datadir + '/offchain');
                    }
                    offchain_exists = fs.existsSync('./' + datadir + '/offchain/db.sqlite');
                    if (argv.test) {
                        require('child_process').execSync("cp test/simple/onchain/* data/onchain;");
                    }
                    onchainDB = OnchainDB(datadir, argv['genesis']);
                    offchainDB = OffchainDB(datadir, argv['db'], argv['db-pool'], argv.genesis);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, onchainDB.init()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, offchainDB.init()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    throw e_1;
                case 5:
                    Me = require('./me');
                    if (argv.genesis) {
                        return [2 /*return*/, require('./utils/genesis')(datadir)];
                    }
                    kFile = datadir + '/onchain/k.json';
                    if (!fs.existsSync(kFile)) {
                        system_1.fatal("Unable to read " + kFile + ", quitting");
                    }
                    K = JSON.parse(fs.readFileSync(kFile));
                    // unpack hex
                    K.validators.map(function (m) {
                        m.pubkey = Buffer.from(m.pubkey, 'hex');
                        m.block_pubkey = Buffer.from(m.block_pubkey, 'hex');
                    });
                    pkFile = './' + datadir + '/offchain/pk.json';
                    if (!fs.existsSync(pkFile)) {
                        // used to authenticate browser sessions to this daemon
                        return [2 /*return*/, {
                                auth_code: system_1.toHex(crypto.randomBytes(32)),
                                pendingBatchHex: null
                            }];
                    }
                    PK = JSON.parse(fs.readFileSync(pkFile));
                    // it's important to not lose block we precommited to.
                    if (PK.locked_block) {
                        PK.locked_block.proposer = system_1.fromHex(PK.locked_block.proposer);
                        PK.locked_block.sig = system_1.fromHex(PK.locked_block.sig);
                        PK.locked_block.header = system_1.fromHex(PK.locked_block.header);
                        PK.locked_block.ordered_tx_body = system_1.fromHex(PK.locked_block.ordered_tx_body);
                    }
                    return [4 /*yield*/, system_1.promise_writeFile(datadir + '/offchain/pk.json', JSON.stringify(PK))
                        //ensure for sqlite: if (!fs.existsSync('./' + datadir)) {
                        // TODO: how to sync with force? sqlite vs postgres
                        // only on new install
                        //if (K.total_blocks <= 3) {
                    ];
                case 6:
                    _a.sent();
                    //ensure for sqlite: if (!fs.existsSync('./' + datadir)) {
                    // TODO: how to sync with force? sqlite vs postgres
                    // only on new install
                    //if (K.total_blocks <= 3) {
                    system_1.l('Syncing with force ' + K.total_blocks);
                    return [4 /*yield*/, offchainDB.db.sync({ force: K.total_blocks < 3 })
                        //}
                    ];
                case 7:
                    _a.sent();
                    if (!argv.generate_monkeys) return [3 /*break*/, 9];
                    return [4 /*yield*/, functions_1.generateMonkeys()];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    if (argv.monkey) {
                        monkeys = fs
                            .readFileSync('./tools/monkeys.txt')
                            .toString()
                            .split('\n')
                            .slice(3, parseInt(argv.monkey) - 8000);
                    }
                    me = new Me();
                    if (!(argv.username && argv.pw)) return [3 /*break*/, 11];
                    username = argv.username;
                    return [4 /*yield*/, derive(argv.username, argv.pw)];
                case 10:
                    password = _a.sent();
                    return [3 /*break*/, 12];
                case 11:
                    if (PK.username && PK.seed) {
                        username = PK.username;
                        password = Buffer.from(PK.seed, 'hex');
                    }
                    _a.label = 12;
                case 12:
                    if (!(username && password)) return [3 /*break*/, 15];
                    return [4 /*yield*/, me.init(username, password)];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, me.start()];
                case 14:
                    _a.sent();
                    _a.label = 15;
                case 15:
                    /*
                    if (argv.test) {
                      let binary = r(fs.readFileSync(`test/simple/blocks`))
                      argv.stop_blocks = binary.length
                      argv.nocrypto = true
                      l('Blocks: ' + binary.length)
                      await me.processChain(binary)
                      return
                    }*/
                    require('./init_dashboard')();
                    if (argv.rpc) {
                        system_1.RPC.internal_rpc('admin', argv);
                    }
                    // start syncing as soon as the node is started
                    /*setInterval(() => {
                      // propose step means last block was just finalized K.step_latency * 3
                      //if (Date.now() % K.blocktime < 3) {
                      Periodical.syncChain()
                      //}
                    }, 200)*/
                    Periodical.schedule('syncChain', 200);
                    require('repl').start();
                    return [2 /*return*/];
            }
        });
    });
}
startFairlayer();
