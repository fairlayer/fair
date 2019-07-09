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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var nacl = require("../lib/nacl");
var rlp = require("../lib/rlp");
exports.rlp = rlp;
var fs = require("fs");
exports.fs = fs;
var minimist = require("minimist");
exports.minimist = minimist;
var digest = require('js-sha3').sha3_256.digest;
var crypto = require("crypto");
exports.crypto = crypto;
// shorter way to find by an attribute
Array.prototype['by'] = function (attr, val) {
    return this.find(function (obj) {
        return obj[attr] === val;
    });
};
/*
Buffer.prototype['toJSON'] = function() {
  return this.toString('hex')
}*/
Array.prototype['randomElement'] = function () {
    return this[Math.floor(Math.random() * this.length)];
};
exports.encryptBox = nacl.box;
exports.openBox = nacl.box.open;
/*
// JSON envelopes
export const encryptJSONBox = (boxData, target_pubkey) => {
  // we don't care about authentication of box, but nacl requires that
  let throwaway = nacl.box.keyPair()

  let unlocker_nonce = crypto.randomBytes(24)

  let box = encryptBox(
    Buffer.from(JSON.stringify(boxData)),
    unlocker_nonce,
    target_pubkey,
    throwaway.secretKey
  )
  return rlp.encode([Buffer.from(box), unlocker_nonce, Buffer.from(throwaway.publicKey)])
}

export function openJSONBox(box: Buffer) {
  let unlocker = r(box)
  let rawBox = openBox(
    unlocker[0],
    unlocker[1],
    unlocker[2],
    me.box.secretKey
  )
  if (rawBox == null) {
    return false
  } else {
    return parse(Buffer.from(rawBox).toString())
  }
}

export function ecSign(a, b) {return bin(nacl.sign.detached(a, b)) }
export function ecVerify(a, b, c) {
  // speed of ec.verify is useless in benchmarking as depends purely on 3rd party lib speed
  return nacl.sign.detached.verify(a, b, c)
}

*/
var MethodMap;
(function (MethodMap) {
    MethodMap[MethodMap["ReturnChain"] = 0] = "ReturnChain";
    MethodMap[MethodMap["JSON"] = 1] = "JSON";
    MethodMap[MethodMap["Propose"] = 2] = "Propose";
    MethodMap[MethodMap["Prevote"] = 3] = "Prevote";
    MethodMap[MethodMap["Precommit"] = 4] = "Precommit";
    MethodMap[MethodMap["Batch"] = 5] = "Batch";
    MethodMap[MethodMap["Deposit"] = 6] = "Deposit";
    MethodMap[MethodMap["Withdraw"] = 7] = "Withdraw";
    MethodMap[MethodMap["Dispute"] = 8] = "Dispute";
    MethodMap[MethodMap["RevealSecrets"] = 9] = "RevealSecrets";
    MethodMap[MethodMap["Vote"] = 10] = "Vote";
})(MethodMap = exports.MethodMap || (exports.MethodMap = {}));
// for testnet handicaps
exports.sleep = function (ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
};
// critical section for a specific key
// https://en.wikipedia.org/wiki/Critical_section
function section(key, job) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, got_job, got_resolve, _b, e_1;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                key = JSON.stringify(key);
                                if (!this._LOCKS[key]) return [3 /*break*/, 1];
                                if (this._LOCKS[key].length > 10) {
                                    console.log('Queue overflow for: ' + key);
                                }
                                this._LOCKS[key].push([job, resolve]);
                                return [3 /*break*/, 8];
                            case 1:
                                this._LOCKS[key] = [[job, resolve]];
                                _c.label = 2;
                            case 2:
                                if (!(this._LOCKS[key].length > 0)) return [3 /*break*/, 7];
                                _c.label = 3;
                            case 3:
                                _c.trys.push([3, 5, , 6]);
                                _a = this._LOCKS[key].shift(), got_job = _a[0], got_resolve = _a[1];
                                _b = got_resolve;
                                return [4 /*yield*/, got_job()];
                            case 4:
                                _b.apply(void 0, [_c.sent()]);
                                return [3 /*break*/, 6];
                            case 5:
                                e_1 = _c.sent();
                                console.log('Error in critical section: ', e_1);
                                return [3 /*break*/, 6];
                            case 6: return [3 /*break*/, 2];
                            case 7:
                                delete this._LOCKS[key];
                                _c.label = 8;
                            case 8: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
exports.section = section;
Buffer.prototype['readInt'] = function (signed) {
    // reads signed integer from RLP encoded buffer
    if (signed === void 0) { signed = false; }
    if (_this.length > 0) {
        var num = _this.readUIntBE(0, _this.length);
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
function sha3(a) {
    return Buffer.from(digest(a));
}
exports.sha3 = sha3;
function parseJSON(json) {
    try {
        var o = JSON.parse(json, function (k, v) {
            if (v !== null &&
                typeof v === 'object' &&
                'type' in v &&
                v.type === 'Buffer' &&
                'data' in v &&
                Array.isArray(v.data)) {
                return new Buffer(v.data);
            }
            return v;
        });
        return (o && typeof o === 'object') ? o : {};
    }
    catch (e) {
        return {};
    }
}
exports.parseJSON = parseJSON;
// derives private key from username and password using memory hard alg
// Why brainwallets are great: https://medium.com/fairlayer/why-brainwallet-are-great-for-cryptocurrency-ff73dd65ecd9
var Scrypt = require("../lib/scrypt");
function derive(username, password) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    Scrypt(password, username, {
                        N: Math.pow(2, 12),
                        r: 8,
                        p: 1,
                        dkLen: 32,
                        encoding: 'binary'
                    }, function (r) {
                        resolve(Buffer.from(r));
                    });
                    /* Native scrypt
                    var seed = await scrypt.hash(password, {
                      N: Math.pow(2, 16),
                      interruptStep: 1000,
                      p: 2,
                      r: 8,
                      dkLen: 32,
                      encoding: 'binary'
                    }, 32, username)
                
                    return seed; */
                })];
        });
    });
}
exports.derive = derive;
