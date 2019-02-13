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
var isHeadless = function () {
    return me.browsers.length == 0; // || me.browser.readyState != 1
};
module.exports = function (force) {
    if (force === void 0) { force = false; }
    return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!me.my_validator && isHeadless() && !force)
                        return [2 /*return*/];
                    if (!K) return [3 /*break*/, 2];
                    cached_result.my_bank = me.my_bank;
                    cached_result.my_validator = me.my_validator;
                    cached_result.K = K;
                    cached_result.busyPorts = Object.keys(me.busyPorts).length;
                    cached_result.nextValidator = nextValidator();
                    return [4 /*yield*/, Promise.all([
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = cached_result;
                                            return [4 /*yield*/, Proposal.findAll({
                                                    order: [['id', 'DESC']],
                                                    include: { all: true }
                                                })];
                                        case 1:
                                            _a.proposals = _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = cached_result;
                                            return [4 /*yield*/, User.findAll({ include: { all: true } })];
                                        case 1:
                                            _a.users = _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = cached_result;
                                            return [4 /*yield*/, Insurance.findAll({
                                                    include: { all: true }
                                                })];
                                        case 1:
                                            _a.insurances = _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _i, _a, bank, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _i = 0, _a = cached_result.K.banks;
                                            _c.label = 1;
                                        case 1:
                                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                                            bank = _a[_i];
                                            _b = bank;
                                            return [4 /*yield*/, getInsuranceSumForUser(bank.id)];
                                        case 2:
                                            _b.sumForUser = _c.sent();
                                            _c.label = 3;
                                        case 3:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = cached_result;
                                            return [4 /*yield*/, Hashlock.findAll()];
                                        case 1:
                                            _a.hashlocks = _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = cached_result;
                                            return [4 /*yield*/, Asset.findAll()];
                                        case 1:
                                            _a.assets = _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = cached_result;
                                            return [4 /*yield*/, Order.findAll()];
                                        case 1:
                                            _a.orders = _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _b = cached_result;
                                            return [4 /*yield*/, Block.findAll({
                                                    limit: 100,
                                                    order: [['id', 'desc']],
                                                    where: me.show_empty_blocks
                                                        ? {}
                                                        : {
                                                            meta: (_a = {}, _a[Op.ne] = null, _a)
                                                        }
                                                })];
                                        case 1:
                                            _b.blocks = (_c.sent()).map(function (b) {
                                                var _a = r(b.header), methodId = _a[0], built_by = _a[1], total_blocks = _a[2], prev_hash = _a[3], timestamp = _a[4], tx_root = _a[5], db_hash = _a[6];
                                                return {
                                                    id: b.id,
                                                    prev_hash: toHex(b.prev_hash),
                                                    hash: toHex(b.hash),
                                                    built_by: readInt(built_by),
                                                    timestamp: readInt(timestamp),
                                                    meta: JSON.parse(b.meta),
                                                    total_tx: b.total_tx,
                                                    round: b.round
                                                };
                                            });
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); }
                        ].map(function (d) { return d(); }))];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
};
