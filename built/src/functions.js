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
var fs = require('fs');
var path = require('path');
// returns validator making block right now, use skip=true to get validator for next slot
var nextValidator = function (skip) {
    if (skip === void 0) { skip = false; }
    var currentIndex = Math.floor(Date.now() / K.blocktime) % K.total_shares;
    var searchIndex = 0;
    for (var i = 0; i < K.validators.length; i++) {
        var current = K.validators[i];
        searchIndex += current.shares;
        if (searchIndex <= currentIndex)
            continue;
        if (skip == false)
            return current;
        // go back to 0
        if (currentIndex + 1 == K.total_shares)
            return K.validators[0];
        // same validator
        if (currentIndex + 1 < searchIndex)
            return current;
        // next validator
        return K.validators[i + 1];
    }
};
function parseAddress(address) {
    var _a;
    //l('Parse ', address)
    var addr = address.toString();
    var invoice = false;
    if (addr.includes('#')) {
        // the invoice is encoded as #hash in destination and takes precedence over manually sent invoice
        ;
        _a = addr.split('#'), addr = _a[0], invoice = _a[1];
    }
    var parts = [];
    try {
        parts = r(base58.decode(addr));
        if (parts[2])
            parts[2] = parts[2].map(function (val) { return readInt(val); });
    }
    catch (e) { }
    if (parts[0] && parts[0].length <= 6) {
        // not pubkey? can be an id and we find out real pubkey
        var u = yield User.findById(readInt(parts[0]), { include: [Balance] });
        if (u) {
            parts[0] = u.pubkey;
        }
    }
    // both pubkeys and bank list must be present
    if (parts[0] && parts[0].length == 32 && parts[1] && parts[1].length == 32) {
        return {
            pubkey: parts[0],
            box_pubkey: parts[1],
            banks: parts[2],
            invoice: invoice,
            address: addr
        };
    }
    else {
        l('bad address: ', stringify(addr));
        return false;
    }
}
exports.parseAddress = parseAddress;
var getUserByIdOrKey = function (id) {
    return __awaiter(this, void 0, void 0, function () {
        var u;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeof id != 'number' && id.length != 32) {
                        id = readInt(id);
                    }
                    u = false;
                    if (!(typeof id == 'number')) return [3 /*break*/, 2];
                    return [4 /*yield*/, User.findById(id, { include: [Balance] })];
                case 1:
                    u = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, User.findOrBuild({
                        where: { pubkey: id },
                        defaults: { balances: [] },
                        include: [Balance]
                    })];
                case 3:
                    // buffer
                    u = (_a.sent())[0];
                    _a.label = 4;
                case 4: return [2 /*return*/, u];
            }
        });
    });
};
var userAsset = function (user, asset, diff) {
    if (!user.balances)
        return 0;
    if (diff) {
        var b = user.balances.by('asset', asset);
        if (b) {
            b.balance += diff;
            return b.balance;
        }
        else {
            // todo is safe to not save now?
            b = Balance.build({
                userId: user.id,
                asset: asset,
                balance: diff
            });
            user.balances.push(b);
            return b.balance;
        }
    }
    else {
        var b = user.balances.by('asset', asset);
        return b ? b.balance : 0;
    }
};
exports.proposalExecute = function (proposal) { return __awaiter(_this, void 0, void 0, function () {
    var pr;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!proposal.code) return [3 /*break*/, 2];
                return [4 /*yield*/, eval("(async function() { " + proposal.code + " })()")];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (proposal.patch.length > 0) {
                    me.request_reload = true;
                    try {
                        pr = require('child_process').exec('patch -p1', function (error, stdout, stderr) {
                            console.log(error, stdout, stderr);
                        });
                        pr.stdin.write(proposal.patch);
                        pr.stdin.end();
                    }
                    catch (e) {
                        l(e);
                    }
                }
                return [2 /*return*/];
        }
    });
}); };
