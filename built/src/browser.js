// This file has browser-related helpers that cache and react into me.browsers sockets.
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
// Called once in a while to cache current state of everything and flush it to browser
// TODO: better way to keep app reactive?
// Flush an object to browser websocket. Send force=false for lazy react (for high-tps nodes like banks)
react = function (result) { return __awaiter(_this, void 0, void 0, function () {
    var _a, _b, chans, _i, chans_1, d, ch, _c, _d, filters, _e, _f, data_1;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                // banks dont react OR no alive browser socket
                if (me.my_bank && !result.force) {
                    return [2 /*return*/]; //l('No working me.browser')
                }
                if (Date.now() - me.last_react < 500) {
                    //l('reacting too often is bad for performance')
                    //return false
                }
                me.last_react = Date.now();
                if (isHeadless()) {
                    //l('headless')
                    return [2 /*return*/];
                }
                if (!me.id) return [3 /*break*/, 12];
                //l('Assign private')
                _b = result;
                return [4 /*yield*/, Payment.findAll({
                        order: [['id', 'desc']],
                        //include: {all: true},
                        limit: 50
                    })
                    //l('Payments')
                    // returns channels with supported banks
                ];
            case 1:
                //l('Assign private')
                _b.payments = _g.sent();
                //l('Payments')
                // returns channels with supported banks
                result.channels = [];
                return [4 /*yield*/, Channel.findAll()];
            case 2:
                chans = _g.sent();
                _i = 0, chans_1 = chans;
                _g.label = 3;
            case 3:
                if (!(_i < chans_1.length)) return [3 /*break*/, 6];
                d = chans_1[_i];
                return [4 /*yield*/, Channel.get(d.they_pubkey)];
            case 4:
                ch = _g.sent();
                result.channels.push(ch);
                _g.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                _c = me;
                return [4 /*yield*/, User.findOne({
                        where: { pubkey: bin(me.id.publicKey) },
                        include: [Balance]
                    })];
            case 7:
                _c.record = _g.sent();
                result.record = me.record;
                //l('Getting record', result.record.id)
                _d = result;
                return [4 /*yield*/, Event.findAll({
                        order: [['id', 'desc']],
                        limit: 20
                    })
                    //if (!result.record.id) result.record = null
                ];
            case 8:
                //l('Getting record', result.record.id)
                _d.events = _g.sent();
                //if (!result.record.id) result.record = null
                result.timeouts = Object.keys(Periodical.timeouts);
                result.payments.map(function (p) {
                    // prefix for invoice types: 1 is user set 2 is random
                    if (p.private_invoice) {
                        p.private_invoice = p.private_invoice
                            .slice(1)
                            .toString(p.private_invoice[0] == 1 ? 'utf8' : 'hex');
                    }
                });
                result.PK = PK;
                if (!result.record) return [3 /*break*/, 10];
                filters = [
                    { userId: result.record.id },
                    { oweTo: result.record.id }
                ];
                _e = result;
                return [4 /*yield*/, Debt.findAll({ where: (_a = {}, _a[Op.or] = filters, _a) })];
            case 9:
                _e.debts = _g.sent();
                _g.label = 10;
            case 10:
                result.address = me.getAddress();
                result.pubkey = toHex(me.pubkey);
                result.batch = me.batch;
                result.pendingBatch = me.pendingBatch;
                _f = result;
                return [4 /*yield*/, me.batch_estimate()];
            case 11:
                _f.batch_estimate = _g.sent();
                _g.label = 12;
            case 12:
                //l('Assigning public')
                //if (result.public) {
                result = Object.assign(result, cached_result);
                //}
                try {
                    data_1 = JSON.stringify(result);
                    me.browsers.map(function (ws) {
                        if (ws.readyState == 1) {
                            ws.send(data_1);
                        }
                    });
                }
                catch (e) {
                    l(e);
                }
                return [2 /*return*/];
        }
    });
}); };
// Eats memory. Do it only at bootstrap or after generating a new snapshot
snapshotHash = function () { return __awaiter(_this, void 0, void 0, function () {
    var filename, cmd;
    var _this = this;
    return __generator(this, function (_a) {
        if (me.my_validator && K.last_snapshot_height) {
            filename = "Fair-" + K.last_snapshot_height + ".tar.gz";
            cmd = "shasum -a 256 " + datadir + "/offchain/" + filename;
            require('child_process').exec(cmd, function (er, out, err) { return __awaiter(_this, void 0, void 0, function () {
                var out_hash, our_location;
                return __generator(this, function (_a) {
                    if (out.length == 0) {
                        l('This state doesnt exist');
                        return [2 /*return*/, false];
                    }
                    out_hash = out.split(' ')[0];
                    our_location = me.my_validator.location.indexOf('127.0.0.1') != -1
                        ? "http://127.0.0.1:8001/"
                        : "https://fairlayer.com/";
                    cached_result.install_snippet = "id=fair\nf=" + filename + "\nmkdir $id && cd $id && curl " + our_location + "$f -o $f\nif [[ -x /usr/bin/sha256sum ]] && sha256sum $f || shasum -a 256 $f | grep \\\n  " + out_hash + "; then\n  tar -xzf $f && rm $f && ./install\n  node fair\nfi";
                    return [2 /*return*/];
                });
            }); });
        }
        return [2 /*return*/];
    });
}); };
// TODO: Move from memory to persistent DB
cached_result = {
    history: [],
    my_log: ''
};
