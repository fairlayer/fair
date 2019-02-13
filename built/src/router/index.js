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
var Router = {
    max_hops: 10,
    // don't offer routes that cost more than 10% in fees
    // We don't want to deliberately burn money, right?
    max_fee: 0.9,
    getRouteIndex: function (from, to) {
        // returns an index of a bidirectional route (from,to or to,from)
        return K.routes.findIndex(function (r) {
            return (r[0] == from && r[1] == to) || (r[0] == to && r[1] == from);
        });
    },
    addRoute: function (from, to) {
        // ensure only unique routes are saved
        if (this.getRouteIndex(from, to) == -1) {
            K.routes.push([from, to]);
        }
    },
    removeRoute: function (from, to) {
        // only existing routes can be removed
        var index = this.getRouteIndex(from, to);
        if (index != -1) {
            K.routes.splice(index, 1);
        }
    },
    //https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
    dijkstra: function (c) {
        //l('Dijkstra', c)
        // gets context on input
        var last = c.used[c.used.length - 1];
        if (c.targets.includes(last)) {
            c.found.push(c.used);
            //return found
        }
        // overflow of hops
        if (c.used.length == this.max_hops)
            return false;
        for (var _i = 0, _a = K.routes; _i < _a.length; _i++) {
            var route = _a[_i];
            var context = Object.assign({}, c);
            if (route[0] == last && !c.used.includes(route[1])) {
                context.used = c.used.concat(route[1]);
                this.dijkstra(context);
            }
            else if (route[1] == last && !c.used.includes(route[0])) {
                context.used = c.used.concat(route[0]);
                this.dijkstra(context);
            }
        }
        return c.found;
    },
    // returns sorted and filtered routes to some nodes for specific asset/amount
    bestRoutes: function (address, args) {
        return __awaiter(this, void 0, void 0, function () {
            var addr, toArray, fromArray, found, _loop_1, _i, _a, candidate, _b, fromArray_1, from, uniqSets, filtered, _c, found_1, route, afterfees, _loop_2, _d, route_1, hop, totalFee;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, parseAddress(address)];
                    case 1:
                        addr = _e.sent();
                        if (!addr)
                            return [2 /*return*/, []];
                        toArray = addr.banks;
                        fromArray = [];
                        found = [];
                        if (me.my_bank && addr.banks.includes(me.my_bank.id)) {
                            // for faucet: return direct route as only option
                            return [2 /*return*/, [[1, []]]];
                        }
                        _loop_1 = function (candidate) {
                            var bank, ch;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        bank = K.banks.find(function (h) { return h.id == candidate; });
                                        return [4 /*yield*/, Channel.get(bank.pubkey)];
                                    case 1:
                                        ch = _a.sent();
                                        if (!ch || !ch.derived[args.asset])
                                            return [2 /*return*/, "continue"];
                                        // account for potentially unpredictable fees?
                                        // 0 >= 0? return potential routes even for no amount
                                        if (ch.d.status != 'disputed' &&
                                            ch.derived[args.asset].available >= args.amount) {
                                            fromArray.push(candidate);
                                        }
                                        else {
                                            //l('Not enough available: ', ch.derived[args.asset].available, args.amount)
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, _a = PK.usedBanks;
                        _e.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        candidate = _a[_i];
                        return [5 /*yield**/, _loop_1(candidate)];
                    case 3:
                        _e.sent();
                        _e.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (!fromArray || !toArray || fromArray.length == 0 || toArray.length == 0)
                            return [2 /*return*/, []];
                        for (_b = 0, fromArray_1 = fromArray; _b < fromArray_1.length; _b++) {
                            from = fromArray_1[_b];
                            this.dijkstra({
                                targets: toArray,
                                used: [from],
                                found: found
                            });
                        }
                        uniqSets = [];
                        filtered = [];
                        for (_c = 0, found_1 = found; _c < found_1.length; _c++) {
                            route = found_1[_c];
                            afterfees = 1;
                            _loop_2 = function (hop) {
                                var bank = K.banks.find(function (h) { return h.id == hop; });
                                if (bank) {
                                    afterfees *= 1 - bank.fee_bps / 10000;
                                }
                            };
                            for (_d = 0, route_1 = route; _d < route_1.length; _d++) {
                                hop = route_1[_d];
                                _loop_2(hop);
                            }
                            // if not too crazy, add to filtered
                            if (afterfees > this.max_fee) {
                                totalFee = (args.amount * (1 - afterfees)).toFixed(2);
                                filtered.push([totalFee, route]);
                            }
                        }
                        // sort by fee
                        return [2 /*return*/, filtered.sort(function (a, b) { return a[0] - b[0]; })];
                }
            });
        });
    }
};
module.exports = Router;
