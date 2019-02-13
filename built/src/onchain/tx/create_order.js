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
module.exports = function (s, args) { return __awaiter(_this, void 0, void 0, function () {
    var _a, _b, assetId, amount, buyAssetId, raw_rate, round, rate, direct_order, sellerOwns, order, orders, _i, orders_1, their, they_buy, we_buy, seller;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: 
            // not enabled yet
            return [2 /*return*/];
            case 1:
                orders = _c.sent();
                _i = 0, orders_1 = orders;
                _c.label = 2;
            case 2:
                if (!(_i < orders_1.length)) return [3 /*break*/, 8];
                their = orders_1[_i];
                they_buy = void 0;
                we_buy = void 0;
                if (direct_order) {
                    they_buy = round(their.amount / their.rate);
                    we_buy = round(order.amount * their.rate);
                }
                else {
                    they_buy = round(their.amount * their.rate);
                    we_buy = round(order.amount / their.rate);
                }
                return [4 /*yield*/, User.findById(their.userId, { include: [Balance] })];
            case 3:
                seller = _c.sent();
                if (we_buy > their.amount) {
                    // close their order. give seller what they wanted
                    userAsset(seller, their.buyAssetId, they_buy);
                    userAsset(s.signer, order.buyAssetId, their.amount);
                    their.amount = 0;
                    order.amount -= they_buy;
                }
                else {
                    // close our order
                    userAsset(seller, their.buyAssetId, order.amount);
                    userAsset(s.signer, order.buyAssetId, we_buy);
                    their.amount -= we_buy;
                    order.amount = 0;
                }
                if (!(their.amount == 0)) return [3 /*break*/, 5];
                // did our order fullfil them entirely?
                return [4 /*yield*/, their.destroy()];
            case 4:
                // did our order fullfil them entirely?
                _c.sent();
                return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, their.save()];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 2];
            case 8:
                if (!(order.amount > 0)) return [3 /*break*/, 10];
                // is new order still not fullfilled? keep in orderbook
                return [4 /*yield*/, order.save()];
            case 9:
                // is new order still not fullfilled? keep in orderbook
                _c.sent();
                return [3 /*break*/, 10];
            case 10:
                s.parsed_tx.events.push(['createOrder', assetId, amount, buyAssetId, rate]);
                return [2 /*return*/];
        }
    });
}); };
