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
var Router = require('../router');
// short helper to create a Payment on some delta and flush the channel right after it
module.exports = function (opts) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, section('pay', function () { return __awaiter(_this, void 0, void 0, function () {
                    var secret, hash, asset, addr, amount, best, onion, nextHop, reversed, _loop_1, _i, reversed_1, hop, ch, subch, available, outward;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                secret = crypto.randomBytes(32);
                                hash = sha3(secret);
                                asset = parseInt(opts.asset);
                                //l('Paying ', opts)
                                if (!opts.address) {
                                    l('Error: No address ', opts);
                                    return [2 /*return*/, 'Error: No address'];
                                }
                                return [4 /*yield*/, parseAddress(opts.address)];
                            case 1:
                                addr = _a.sent();
                                if (!addr) {
                                    l('Invalid address');
                                    return [2 /*return*/, 'Invalid address'];
                                }
                                // use user supplied private message, otherwise generate random tag
                                // invoice inside the address takes priority
                                if (addr.invoice || opts.private_invoice) {
                                    opts.private_invoice = Buffer.concat([
                                        Buffer.from([1]),
                                        bin(addr.invoice ? addr.invoice : opts.private_invoice)
                                    ]);
                                }
                                else {
                                    opts.private_invoice = Buffer.concat([Buffer.from([2]), crypto.randomBytes(16)]);
                                }
                                amount = parseInt(opts.amount);
                                // NaN
                                if (!Number.isInteger(amount))
                                    return [2 /*return*/, 'NaN'];
                                if (!!opts.chosenRoute) return [3 /*break*/, 5];
                                if (!(me.my_bank && addr.banks.includes(me.my_bank.id))) return [3 /*break*/, 2];
                                // just pay direct
                                opts.chosenRoute = [];
                                return [3 /*break*/, 4];
                            case 2: return [4 /*yield*/, Router.bestRoutes(opts.address, {
                                    amount: amount,
                                    asset: asset
                                })];
                            case 3:
                                best = _a.sent();
                                if (!best[0]) {
                                    //l('No route found:', best, addr.banks)
                                    return [2 /*return*/, 'No route found:'];
                                }
                                else {
                                    // first is the cheapest
                                    opts.chosenRoute = best[0][1];
                                }
                                _a.label = 4;
                            case 4: return [3 /*break*/, 6];
                            case 5:
                                // unpack from 1_2_3
                                opts.chosenRoute = opts.chosenRoute.split('_');
                                _a.label = 6;
                            case 6:
                                onion = encrypt_box_json({
                                    amount: amount,
                                    asset: asset,
                                    // buffers are in hex for JSON
                                    secret: toHex(secret),
                                    private_invoice: toHex(opts.private_invoice),
                                    ts: Date.now(),
                                    source_address: opts.provideSource ? me.getAddress() : null
                                }, addr.box_pubkey);
                                nextHop = addr.pubkey;
                                reversed = opts.chosenRoute.reverse();
                                _loop_1 = function (hop) {
                                    var bank = K.banks.find(function (h) { return h.id == hop; });
                                    amount = beforeFee(amount, bank);
                                    onion = encrypt_box_json({
                                        asset: asset,
                                        amount: amount,
                                        nextHop: nextHop,
                                        unlocker: onion
                                    }, fromHex(bank.box_pubkey));
                                    nextHop = bank.pubkey;
                                };
                                for (_i = 0, reversed_1 = reversed; _i < reversed_1.length; _i++) {
                                    hop = reversed_1[_i];
                                    _loop_1(hop);
                                }
                                return [4 /*yield*/, Channel.get(nextHop)];
                            case 7:
                                ch = _a.sent();
                                if (!ch) {
                                    l('No channel to ', nextHop, asset);
                                    return [2 /*return*/, 'No channel to '];
                                }
                                subch = ch.d.subchannels.by('asset', asset);
                                available = ch.derived[asset].available;
                                // 4. do we have enough available for this hop?
                                if (amount > available) {
                                    if (me.my_bank) {
                                        // ask to increase credit
                                        me.textMessage(ch.d.they_pubkey, "Cannot send " + commy(amount) + " when available is " + commy(available) + ", extend credit");
                                    }
                                    react({ alert: "Not enough funds " + available });
                                    return [2 /*return*/, 'No available'];
                                }
                                else if (amount > K.max_amount) {
                                    react({ alert: "Maximum payment is $" + commy(K.max_amount) });
                                    return [2 /*return*/, 'out of range'];
                                }
                                else if (amount < K.min_amount) {
                                    react({ alert: "Minimum payment is $" + commy(K.min_amount) });
                                    return [2 /*return*/, 'out of range'];
                                }
                                outward = Payment.build({
                                    channelId: ch.d.id,
                                    type: opts.addrisk ? 'addrisk' : 'add',
                                    status: 'new',
                                    is_inward: false,
                                    asset: asset,
                                    lazy_until: opts.lazy ? Date.now() + 30000 : null,
                                    amount: amount,
                                    hash: bin(hash),
                                    unlocker: onion,
                                    destination_address: addr.address,
                                    private_invoice: opts.private_invoice
                                });
                                return [4 /*yield*/, outward.save()];
                            case 8:
                                _a.sent();
                                ch.payments.push(outward);
                                react({});
                                me.flushChannel(nextHop, true);
                                return [2 /*return*/, 'sent'];
                        }
                    });
                }); })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
