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
// serves default wallet and internal rpc on the same port
var getChain = require('./external_rpc/get_chain');
module.exports = function (a) { return __awaiter(_this, void 0, void 0, function () {
    var finalhandler, serveStatic, path, bundler, cb, walletUrl_1, http_1, proxy_1, retries, statusCode, Parcel, server;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                finalhandler = require('finalhandler');
                serveStatic = require('serve-static');
                path = require('path');
                cb = function (req, res) {
                    return __awaiter(this, void 0, void 0, function () {
                        var _a, path, query, parts, args, raw_chain, _b, startingPort, i, nextPort, instanceLog, auth_code, queryData;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    // Clickjacking protection
                                    res.setHeader('X-Frame-Options', 'DENY');
                                    _a = req.url.split('?'), path = _a[0], query = _a[1];
                                    if (!path.match(/^\/Fair-([0-9]+|latest)\.tar\.gz$/)) return [3 /*break*/, 1];
                                    return [3 /*break*/, 8];
                                case 1:
                                    if (!path.startsWith('/blocks')) return [3 /*break*/, 3];
                                    parts = path.split('_');
                                    args = {
                                        start_block: parseInt(parts[1]),
                                        limit: parseInt(parts[2])
                                    };
                                    _b = r;
                                    return [4 /*yield*/, getChain(args)];
                                case 2:
                                    raw_chain = _b.apply(void 0, [_c.sent()]);
                                    l('Dump chain: ', args, raw_chain.length);
                                    res.writeHead(200, {
                                        'Content-Type': 'binary',
                                        'Content-Length': raw_chain.length,
                                        'Content-Disposition': "attachment; filename=Fair_blocks_" + args.start_block + "_" + args.limit
                                    });
                                    res.end(raw_chain);
                                    return [3 /*break*/, 8];
                                case 3:
                                    if (!(path == '/demoinstance')) return [3 /*break*/, 7];
                                    startingPort = 8500;
                                    for (i = startingPort; i < startingPort + 30; i++) {
                                        if (!me.busyPorts[i]) {
                                            nextPort = i;
                                            me.busyPorts[nextPort] = Date.now();
                                            break;
                                        }
                                    }
                                    if (!nextPort) return [3 /*break*/, 5];
                                    l('Started demoinstance ' + nextPort);
                                    l(require('child_process')
                                        .execSync("pm2 delete f" + nextPort + " > /dev/null; \n            rm -rf data" + nextPort + ";\n            mkdir data" + nextPort + "; \n            cp -r data/onchain data" + nextPort + "/onchain;\n            pm2 start --name f" + nextPort + " fair.js -- --wallet-dist --datadir=data" + nextPort + " -p" + nextPort + " -s > /dev/null;")
                                        .toString());
                                    //--wallet-dist --prod-server
                                    return [4 /*yield*/, sleep(2500)];
                                case 4:
                                    //--wallet-dist --prod-server
                                    _c.sent();
                                    instanceLog = child_process
                                        .execSync("cat data" + nextPort + "/offchain/pk.json")
                                        .toString();
                                    l('instance log', instanceLog);
                                    if (!instanceLog) {
                                        return [2 /*return*/];
                                    }
                                    auth_code = instanceLog.split('auth_code":"')[1].split('"')[0];
                                    // we redirect the user to authenticated cloud instance
                                    res.writeHead(302, {
                                        Location: "https://demo-" + (nextPort -
                                            startingPort) + ".fairlayer.com/#auth_code=" + auth_code
                                    });
                                    setTimeout(function () {
                                        l("Destroying demo... " + nextPort);
                                        // free up port
                                        delete me.busyPorts[nextPort];
                                    }, 60 * 60 * 1000);
                                    res.end('redirect');
                                    return [3 /*break*/, 6];
                                case 5:
                                    res.end('No available slot found for your cloud demo. Wait, or install locally.');
                                    _c.label = 6;
                                case 6: return [3 /*break*/, 8];
                                case 7:
                                    if (path == '/health') {
                                        res.end(JSON.stringify({
                                            uptime: Date.now() - node_started_at
                                        }));
                                    }
                                    else if (path == '/rpc') {
                                        res.setHeader('Content-Type', 'application/json');
                                        queryData = '';
                                        req.on('data', function (data) {
                                            queryData += data;
                                        });
                                        req.on('end', function () {
                                            // HTTP /rpc endpoint supports passing request in GET too
                                            var json = Object.assign(querystring.parse(query), parse(queryData));
                                            if (!json.params)
                                                json.params = {};
                                            RPC.internal_rpc(res, json);
                                        });
                                    }
                                    else if (path == '/sdk.html') {
                                        serveStatic('../wallet')(req, res, finalhandler(req, res));
                                    }
                                    else {
                                        bundler(req, res, finalhandler(req, res));
                                    }
                                    _c.label = 8;
                                case 8: return [2 /*return*/];
                            }
                        });
                    });
                };
                if (!argv['wallet-url']) return [3 /*break*/, 6];
                walletUrl_1 = argv['wallet-url'];
                http_1 = require('http');
                proxy_1 = require('http-proxy').createProxyServer({
                    target: walletUrl_1
                });
                bundler = function (req, res) { return proxy_1.web(req, res, {}, finalhandler(req, res)); };
                retries = 0;
                _a.label = 1;
            case 1:
                if (!true) return [3 /*break*/, 5];
                return [4 /*yield*/, new Promise(function (resolve) {
                        l('Reaching wallet ', walletUrl_1);
                        http_1
                            .get(walletUrl_1, function (res) {
                            var statusCode = res.statusCode;
                            resolve(statusCode);
                        })
                            .on('error', function (e) {
                            resolve(404);
                        });
                    })];
            case 2:
                statusCode = _a.sent();
                if (!(statusCode !== 200)) return [3 /*break*/, 4];
                if (retries > 0) {
                    l("Waiting for Parcel (HTTP " + statusCode + ")");
                }
                if (retries > 5) {
                    throw new Error('No parcel on ' + walletUrl_1);
                }
                return [4 /*yield*/, sleep(1000 * Math.pow(1.5, retries))];
            case 3:
                _a.sent();
                retries++;
                return [3 /*break*/, 1];
            case 4:
                l('Parcel: OK');
                return [3 /*break*/, 5];
            case 5: return [3 /*break*/, 7];
            case 6:
                if (argv['wallet-dist']) {
                    bundler = serveStatic('./dist');
                }
                else {
                    Parcel = require('parcel-bundler');
                    bundler = new Parcel('./wallet/index.html', {
                        logLevel: 2
                        // for more options https://parceljs.org/api.html
                    }).middleware();
                }
                _a.label = 7;
            case 7:
                server = require('http').createServer(cb);
                server
                    .listen(on_server ? base_port + 200 : base_port)
                    .once('error', function (err) {
                    if (err.code === 'EADDRINUSE') {
                        openBrowser();
                        l("Port " + base_port + " is currently in use. Pass -p PORT to use another port.");
                        process.exit(0);
                    }
                });
                openBrowser();
                internal_wss = new ws.Server({ server: server, maxPayload: 64 * 1024 * 1024 });
                internal_wss.on('error', function (err) {
                    console.error(err);
                });
                internal_wss.on('connection', function (ws) {
                    ws.on('message', function (msg) {
                        RPC.internal_rpc(ws, parse(bin(msg).toString()));
                    });
                });
                return [2 /*return*/];
        }
    });
}); };
