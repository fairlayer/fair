"use strict";
// various debug methods for visual representation of a payment channel
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
exports.generateMonkeys = function () { return __awaiter(_this, void 0, void 0, function () {
    var derive, addr, i, username, seed, me;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                derive = require('./derive');
                addr = [];
                i = 8001;
                _a.label = 1;
            case 1:
                if (!(i < 8060)) return [3 /*break*/, 5];
                username = i.toString();
                return [4 /*yield*/, derive(username, 'password')];
            case 2:
                seed = _a.sent();
                me = new Me();
                return [4 /*yield*/, me.init(username, seed)
                    // all monkeys use first bank by default
                ];
            case 3:
                _a.sent();
                // all monkeys use first bank by default
                PK.usedBanks = [1];
                PK.usedAssets = [1, 2];
                addr.push(me.getAddress());
                _a.label = 4;
            case 4:
                i++;
                return [3 /*break*/, 1];
            case 5: 
            // save new-line separated monkey addresses
            return [4 /*yield*/, promise_writeFile('./tools/monkeys.txt', addr.join('\n'))];
            case 6:
                // save new-line separated monkey addresses
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
function prettyState(state) {
    if (!state[1])
        return false;
    state[1][2] = readInt(state[1][2]);
    state[2].map(function (subch) {
        subch[0] = readInt(subch[0]);
        subch[1] = readInt(subch[1], true); //signed
        // amount and exp, except the hash
        subch[2].map(function (h) {
            h[0] = readInt(h[0]);
            h[2] = readInt(h[2]);
        });
        subch[3].map(function (h) {
            h[0] = readInt(h[0]);
            h[2] = readInt(h[2]);
        });
    });
}
exports.prettyState = prettyState;
function asciiState(state) {
    if (!state[1])
        return false;
    var hash = toHex(sha3(r(state)));
    var locks = function (hl) {
        return hl
            .map(function (h) { return h[0] + '/' + (h[1] ? trim(h[1]) : 'N/A') + '/' + h[2]; })
            .join(', ');
    };
    var list = state[2]
        .map(function (subch) {
        return subch[0] + ": " + subch[1] + "\n+" + locks(subch[2]) + "\n-" + locks(subch[3]) + "\n";
    })
        .join('');
    return trim(state[1][0]) + "-" + trim(state[1][1]) + " | #" + state[1][2] + " (" + trim(hash) + ")\n-----\n" + list + "\n";
}
exports.asciiState = asciiState;
