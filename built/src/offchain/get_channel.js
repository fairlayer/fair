// This method gets Insurance from onchain db, Channel from offchain db
// then derives a ton of info about current channel: (un)insured balances
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
// TODO: periodically clone Insurance to Channel db to only deal with one db having all data
module.exports = function (pubkey) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, section(['get', pubkey], function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a, _b, _c, ch, _d, _e, user, _f, _g;
                    return __generator(this, function (_h) {
                        switch (_h.label) {
                            case 0:
                                if (!me.pubkey) {
                                    return [2 /*return*/, false];
                                }
                                if (typeof pubkey == 'string')
                                    pubkey = fromHex(pubkey);
                                //l('Loading channel : ', pubkey)
                                if (me.pubkey.equals(pubkey)) {
                                    l('Channel to self?');
                                    return [2 /*return*/, false];
                                }
                                ch = {};
                                ch.derived = {};
                                ch.last_used = Date.now(); // for eviction from memory
                                _d = ch;
                                return [4 /*yield*/, Channel.findOne({
                                        where: {
                                            they_pubkey: pubkey
                                        },
                                        include: [Subchannel]
                                    })];
                            case 1:
                                _d.d = _h.sent();
                                if (!!ch.d) return [3 /*break*/, 3];
                                loff("Creating new channel " + trim(pubkey));
                                _e = ch;
                                return [4 /*yield*/, Channel.create({
                                        they_pubkey: pubkey,
                                        status: 'merge',
                                        subchannels: [
                                            {
                                                asset: 1
                                            },
                                            {
                                                asset: 2
                                            }
                                        ]
                                    }, { include: [Subchannel] })
                                    //l('New one', ch.d.subchannels)
                                ];
                            case 2:
                                _e.d = _h.sent();
                                return [3 /*break*/, 3];
                            case 3: return [4 /*yield*/, User.findOne({ where: { pubkey: pubkey }, include: [Balance] })];
                            case 4:
                                user = _h.sent();
                                if (!(user && user.id)) return [3 /*break*/, 6];
                                ch.partner = user.id;
                                if (!me.record) return [3 /*break*/, 6];
                                _f = ch;
                                return [4 /*yield*/, getInsuranceBetween(me.record, user)];
                            case 5:
                                _f.ins = _h.sent();
                                _h.label = 6;
                            case 6:
                                _g = ch;
                                return [4 /*yield*/, Payment.findAll({
                                        where: (_a = {
                                                channelId: ch.d.id
                                            },
                                            // delack is archive
                                            _a[Op.or] = [{ type: (_b = {}, _b[Op.ne] = 'del', _b) }, { status: (_c = {}, _c[Op.ne] = 'ack', _c) }],
                                            _a),
                                        limit: 3000,
                                        // explicit order because of postgres https://gitbank.com/sequelize/sequelize/issues/9289
                                        order: [['id', 'ASC']]
                                    })];
                            case 7:
                                _g.payments = _h.sent();
                                refresh(ch);
                                return [2 /*return*/, ch];
                        }
                    });
                }); })];
            case 1: 
            // this critical section protects from simultaneous getChannel and doublesaved db records
            return [2 /*return*/, _a.sent()];
        }
    });
}); };
