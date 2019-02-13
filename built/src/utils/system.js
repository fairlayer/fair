"use strict";
// system
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
fs = require('fs');
http = require('http');
os = require('os');
ws = require('ws');
querystring = require('querystring');
opn = require('../../lib/opn');
/*
var chalk = require('chalk') // pretty logs?
highlight = (text) => `"${chalk.bold(text)}"`
link = (text) => `${chalk.underline.white.bold(text)}`
errmsg = (text) => `${chalk.red('   [Error]')} ${text}`
note = (text) => `${chalk.gray(`  ⠟ ${text}`)}`
*/
// crypto TODO: native version
crypto = require('crypto');
// scrypt = require('scrypt') // require('./scrypt_'+os.platform())
base58 = require('base-x')('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
// shorter way to find by asset
Array.prototype.by = function (attr, val) {
    return this.find(function (obj) {
        return obj[attr] === val;
    });
};
nacl = require('../../lib/nacl');
encrypt_box = nacl.box;
open_box = nacl.box.open;
// more highlevel wrappers that operate purely with JSON
encrypt_box_json = function (box_data, target_pubkey) {
    // we don't care about authentication of box, but nacl requires that
    var throwaway = nacl.box.keyPair();
    var unlocker_nonce = crypto.randomBytes(24);
    var box = encrypt_box(exports.bin(JSON.stringify(box_data)), unlocker_nonce, target_pubkey, throwaway.secretKey);
    return r([exports.bin(box), unlocker_nonce, exports.bin(throwaway.publicKey)]);
};
open_box_json = function (box) {
    var unlocker = r(box);
    var raw_box = open_box(unlocker[0], unlocker[1], unlocker[2], me.box.secretKey);
    if (raw_box == null) {
        return false;
    }
    else {
        return parse(exports.bin(raw_box).toString());
    }
};
ec = function (a, b) { return exports.bin(nacl.sign.detached(a, b)); };
ec.verify = function (a, b, c) {
    me.metrics.ecverify.current++;
    // speed of ec.verify is useless in benchmarking as depends purely on 3rd party lib speed
    return argv.nocrypto ? true : nacl.sign.detached.verify(a, b, c);
};
/*
ec = (a, b) => concat(Buffer.alloc(32), sha3(a))
ec.verify = (a, b, c) => ec(a).equals(b)
*/
// promisify writeFile
exports.promise_writeFile = require('util').promisify(fs.writeFile);
// encoders
BN = require('bn.js');
stringify = require('../../lib/stringify');
rlp = require('../../lib/rlp'); // patched rlp for signed-integer
Sequelize = require('sequelize');
Op = Sequelize.Op;
K = false;
me = false;
// Private Key value
exports.PK = {};
exports.RPC = {
    internal_rpc: require('../internal_rpc'),
    external_rpc: require('../external_rpc'),
    requireSig: [
        'auth',
        'propose',
        'prevote',
        'precommit',
        'update',
        'setLimits',
        'requestInsurance',
        'requestCredit',
        'giveWithdrawal',
        'requestWithdrawal',
        'testnet'
    ]
};
// it's just handier when Buffer is stringified into hex vs Type: Buffer..
Buffer.prototype.toJSON = function () {
    return this.toString('hex');
};
Array.prototype.randomElement = function () {
    return this[Math.floor(Math.random() * this.length)];
};
exports.openBrowser = function () {
    var url = "http://127.0.0.1:" + base_port + "/#auth_code=" + exports.PK.auth_code;
    console.log("Open " + link(url) + " in your browser");
    // opn doesn't work in SSH console
    if (!argv.silent && !argv.s) {
        opn(url);
    }
};
exports.trim = function (buffer, len) {
    if (len === void 0) { len = 4; }
    return exports.toHex(buffer).substr(0, len);
};
exports.l = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(console, args);
};
wscb = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    //console.log("Received from websocket ", args)
};
function fatal(reason) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    global.repl = null;
                    exports.l(errmsg(reason));
                    if (!me) return [3 /*break*/, 2];
                    react({ reload: true }); //reloads UI window
                    //me.intervals.map(clearInterval)
                    //.then(async () => {
                    //await sequelize.close()
                    //await privSequelize.close()
                    return [4 /*yield*/, sleep(500)];
                case 1:
                    //me.intervals.map(clearInterval)
                    //.then(async () => {
                    //await sequelize.close()
                    //await privSequelize.close()
                    _a.sent();
                    process.exit();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
exports.fatal = fatal;
gracefulExit = function (comment) {
    global.repl = null;
    exports.l(comment);
    process.exit(0);
};
// error-ignoring wrapper around https://github.com/ethereum/wiki/wiki/RLP
r = function (a) {
    if (a instanceof Buffer) {
        try {
            return rlp.decode(a);
        }
        catch (e) {
            return [];
        }
    }
    else {
        try {
            return rlp.encode(a);
        }
        catch (e) {
            exports.l(e);
            return new Buffer.from([]);
        }
    }
};
// for testnet handicaps
sleep = function (ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
};
var performance = require('perf_hooks').performance;
// critical section for a specific key
// https://en.wikipedia.org/wiki/Critical_section
section = function (key, job) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, got_job, got_resolve, started, _b, e_1;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                key = JSON.stringify(key);
                                if (!section.q[key]) return [3 /*break*/, 1];
                                if (section.q[key].length > 10) {
                                    exports.l('Queue overflow for: ' + key);
                                }
                                section.q[key].push([job, resolve]);
                                return [3 /*break*/, 8];
                            case 1:
                                section.q[key] = [[job, resolve]];
                                _c.label = 2;
                            case 2:
                                if (!(section.q[key].length > 0)) return [3 /*break*/, 7];
                                _c.label = 3;
                            case 3:
                                _c.trys.push([3, 5, , 6]);
                                _a = section.q[key].shift(), got_job = _a[0], got_resolve = _a[1];
                                started = performance.now();
                                //let deadlock = setTimeout(function() {
                                //  fatal('Deadlock in q ' + key)
                                //}, 20000)
                                _b = got_resolve;
                                return [4 /*yield*/, got_job()];
                            case 4:
                                //let deadlock = setTimeout(function() {
                                //  fatal('Deadlock in q ' + key)
                                //}, 20000)
                                _b.apply(void 0, [_c.sent()]);
                                return [3 /*break*/, 6];
                            case 5:
                                e_1 = _c.sent();
                                exports.l('Error in critical section: ', e_1);
                                setTimeout(function () {
                                    fatal(e_1);
                                }, 100);
                                return [3 /*break*/, 6];
                            case 6: return [3 /*break*/, 2];
                            case 7:
                                delete section.q[key];
                                _c.label = 8;
                            case 8: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
};
section.q = {};
current_db_hash = function () {
    return Buffer.alloc(1);
};
onchain_state = function () { return __awaiter(_this, void 0, void 0, function () {
    var out;
    return __generator(this, function (_a) {
        out = require('child_process')
            .execSync("shasum -a 256 " + datadir + "/onchain/k.json " + datadir + "/onchain/db.sqlite ")
            .toString()
            .split(/[ \n]/);
        return [2 /*return*/, sha3(Buffer.concat([exports.fromHex(out[0]), exports.fromHex(out[3])]))];
    });
}); };
//Buffer.readInt
readInt = function (i, signed) {
    // reads signed integer from RLP encoded buffer
    if (signed === void 0) { signed = false; }
    if (i.length > 0) {
        var num = i.readUIntBE(0, i.length);
        if (signed) {
            return num % 2 == 1 ? -(num - 1) / 2 : num / 2;
        }
        else {
            return num;
        }
    }
    else {
        return 0;
    }
};
encodeSignedInt = function (i) {
    return Math.abs(i) * 2 + (i < 0 ? 1 : 0);
};
exports.toHex = function (inp) { return Buffer.from(inp).toString('hex'); };
exports.fromHex = function (inp) { return Buffer.from(inp, 'hex'); };
exports.bin = function (data) {
    if (data instanceof ArrayBuffer) {
        //Buffer.from(arrayBuffer: This creates a view of the ArrayBuffer without copying the underlying memory
        //Buffer.from(buffer): Copies the passed buffer data onto a new Buffer instance
        return Buffer.from(Buffer.from(data));
    }
    else if (data instanceof Buffer) {
        return data;
    }
    else {
        return Buffer.from(typeof data == 'number' ? [data] : data);
    }
};
/*
sha3 = (a) =>
  crypto
    .createHash('sha256')
    .update(bin(a))
    .digest()
*/
js_sha3 = require('js-sha3');
sha3 = function (a) { return exports.bin(js_sha3.sha3_256.digest(exports.bin(a))); };
hrtime = function () {
    var hrTime = process.hrtime();
    return hrTime[0] * 1000000 + Math.round(hrTime[1] / 1000);
};
perf = function (label) {
    var started_at = hrtime();
    // unlocker you run in the end
    return function () {
        if (!perf.entries[label])
            perf.entries[label] = [];
        perf.entries[label].push(hrtime() - started_at);
    };
};
perf.entries = {};
perf.stats = function (label) {
    if (label) {
        var sum, avg = 0;
        if (perf.entries[label].length) {
            sum = perf.entries[label].reduce(function (a, b) {
                return a + b;
            });
            avg = sum / perf.entries[label].length;
        }
        return [parseInt(sum), parseInt(avg)];
    }
    else {
        Object.keys(perf.entries).map(function (key) {
            var nums = perf.stats(key);
            exports.l(key + ": sum " + commy(nums[0], false) + " avg " + commy(nums[1], false));
        });
    }
};
beforeFee = function (amount, bank) {
    new_amount = Math.round((amount / (10000 - bank.fee_bps)) * 10000);
    if (new_amount == amount)
        new_amount = amount + K.min_fee;
    if (new_amount > amount + K.max_fee)
        new_amount = amount + K.max_fee;
    amount = new_amount;
    return new_amount;
};
afterFees = function (amount, banks) {
    if (!(banks instanceof Array))
        banks = [banks];
    for (var _i = 0, banks_1 = banks; _i < banks_1.length; _i++) {
        var bank = banks_1[_i];
        var taken_fee = Math.round((amount * bank.fee_bps) / 10000);
        if (taken_fee == 0)
            taken_fee = K.min_fee;
        if (taken_fee > K.max_fee)
            taken_fee = K.max_fee;
        amount = amount - taken_fee;
    }
    return amount;
};
parse = function (json) {
    try {
        var o = JSON.parse(json);
        if (o && typeof o === 'object') {
            return o;
        }
    }
    catch (e) {
        return {};
    }
};
commy = function (b, dot) {
    if (dot === void 0) { dot = true; }
    var prefix = b < 0 ? '-' : '';
    b = Math.abs(b).toString();
    if (dot) {
        if (b.length == 1) {
            b = '0.0' + b;
        }
        else if (b.length == 2) {
            b = '0.' + b;
        }
        else {
            var insert_dot_at = b.length - 2;
            b = b.slice(0, insert_dot_at) + '.' + b.slice(insert_dot_at);
        }
    }
    return prefix + b.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
usage = function () {
    return Object.assign(process.cpuUsage(), process.memoryUsage(), {
        uptime: process.uptime()
    });
};
