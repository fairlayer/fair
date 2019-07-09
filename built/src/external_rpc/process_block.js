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
// Block processing code. Verifies precommits sigs then executes tx in it one by one
module.exports = function (s) { return __awaiter(_this, void 0, void 0, function () {
    var _a, _b, _c, all, _d, methodId, built_by, total_blocks, prev_hash, timestamp, tx_root, db_hash, _e, clock_skew, ordered_tx, i, end, result, sync_left, is_usable, is_usable, old_height, jobs, _i, jobs_1, job, approved, _loop_1, voter, _f, _g, v, path_filter, filename_1, options, paths, callback;
    var _this = this;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                if (s.header.length < 64 || s.header.length > 200) {
                    return [2 /*return*/, l('Invalid header length: ', s.precommits, s.header, s.ordered_tx_body)];
                }
                if (s.ordered_tx_body.length > K.blocksize) {
                    return [2 /*return*/, l('Too long block')];
                }
                all = [];
                _d = r(s.header), methodId = _d[0], built_by = _d[1], total_blocks = _d[2], prev_hash = _d[3], timestamp = _d[4], tx_root = _d[5], db_hash = _d[6];
                total_blocks = readInt(total_blocks);
                timestamp = readInt(timestamp);
                built_by = readInt(built_by);
                prev_hash = toHex(prev_hash);
                _e = s;
                return [4 /*yield*/, User.findById(built_by, { include: [Balance] })];
            case 1:
                _e.proposer = _h.sent();
                if (!s.proposer) {
                    l("This user doesnt exist " + built_by);
                    return [2 /*return*/, false];
                }
                if (K.prev_hash != prev_hash) {
                    l("Must be based on " + K.prev_hash + " " + K.total_blocks + " but is using " + prev_hash + " " + total_blocks);
                    return [2 /*return*/, false];
                }
                if (readInt(methodId) != methodMap('propose')) {
                    return [2 /*return*/, l('Wrong method for block')];
                }
                if (timestamp < K.ts) {
                    return [2 /*return*/, l('New block older than current block')];
                }
                if (timestamp > Date.now() + 60000) {
                    return [2 /*return*/, l('Block from far future')];
                }
                if (!sha3(s.ordered_tx_body).equals(tx_root)) {
                    return [2 /*return*/, l('Invalid tx_root')];
                }
                if (!db_hash.equals(current_db_hash())) {
                    l('DANGER: state mismatch. Some tx was not deterministic');
                }
                if (s.dry_run) {
                    clock_skew = Date.now() - timestamp;
                    if (clock_skew > 60000 || clock_skew < -60000) {
                        l('Timestamp skew is outside range');
                        return [2 /*return*/];
                    }
                    return [2 /*return*/, true];
                }
                // List of events/metadata about current block, used on Explorer page
                s.meta = {
                    inputs_volume: 0,
                    outputs_volume: 0,
                    parsed_tx: [],
                    cron: [],
                    proposer: s.proposer
                };
                ordered_tx = r(s.ordered_tx_body);
                K.ts = timestamp;
                // increment current block number
                K.total_blocks++;
                i = 0;
                _h.label = 2;
            case 2:
                if (!(i < ordered_tx.length)) return [3 /*break*/, 5];
                end = perf('processBatch');
                return [4 /*yield*/, me.processBatch(s, ordered_tx[i])];
            case 3:
                result = _h.sent();
                if (!result.success)
                    l(result);
                end();
                _h.label = 4;
            case 4:
                i++;
                return [3 /*break*/, 2];
            case 5:
                K.prev_hash = toHex(sha3(s.header));
                if (K.total_blocks % 100 == 0 && cached_result.sync_started_at) {
                    l(base_port + ": Block " + K.total_blocks + " by " + built_by + ". tx: " + ordered_tx.length);
                    // update browser UI about sync process
                    cached_result.synced_blocks = K.total_blocks - cached_result.sync_started_at;
                    sync_left = Math.round((Date.now() - K.ts) / K.blocktime);
                    cached_result.sync_progress = Math.round((cached_result.synced_blocks /
                        (cached_result.synced_blocks + sync_left)) *
                        100);
                    // moves loader animation faster
                    react({ public: true });
                }
                // todo: define what is considered a "usable" block
                if (s.ordered_tx_body.length < K.blocksize - 10000) {
                    K.usable_blocks++;
                    is_usable = true;
                }
                else {
                    is_usable = false;
                }
                K.total_tx += ordered_tx.length;
                K.total_bytes += s.ordered_tx_body.length;
                K.blocks_since_last_snapshot += 1;
                // When "tail" gets too long, create new snapshot
                if (K.blocks_since_last_snapshot >= K.snapshot_after_blocks) {
                    K.blocks_since_last_snapshot = 0;
                    K.snapshots_taken++;
                    s.meta.cron.push(['snapshot', K.total_blocks]);
                    old_height = K.last_snapshot_height;
                    K.last_snapshot_height = K.total_blocks;
                }
                // >>> Automatic crontab-like tasks <<<
                // Note that different tasks have different timeouts
                if (is_usable && K.usable_blocks % 2 == 0) {
                    // Auto resolving disputes that are due
                    all.push(Insurance.findAll({
                        where: { dispute_delayed: (_a = {}, _a[Op.lte] = K.usable_blocks, _a) },
                        include: [Subinsurance]
                    }).then(function (insurances) { return __awaiter(_this, void 0, void 0, function () {
                        var _i, insurances_1, ins, _a, _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _i = 0, insurances_1 = insurances;
                                    _d.label = 1;
                                case 1:
                                    if (!(_i < insurances_1.length)) return [3 /*break*/, 4];
                                    ins = insurances_1[_i];
                                    _b = (_a = s.meta.cron).push;
                                    _c = ['resolved', ins];
                                    return [4 /*yield*/, insuranceResolve(ins)];
                                case 2:
                                    _b.apply(_a, [_c.concat([_d.sent()])]);
                                    _d.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); }));
                }
                if (!(is_usable && K.usable_blocks % 200 == 0)) return [3 /*break*/, 12];
                return [4 /*yield*/, Proposal.findAll({
                        where: { delayed: (_b = {}, _b[Op.lte] = K.usable_blocks, _b) },
                        include: { all: true }
                    })];
            case 6:
                jobs = _h.sent();
                _i = 0, jobs_1 = jobs;
                _h.label = 7;
            case 7:
                if (!(_i < jobs_1.length)) return [3 /*break*/, 12];
                job = jobs_1[_i];
                approved = 0;
                _loop_1 = function (v) {
                    voter = K.validators.find(function (m) { return m.id == v.id; });
                    if (v.vote.approval && voter) {
                        approved += voter.shares;
                    }
                    else {
                        // TODO: denied? slash some votes?
                    }
                };
                for (_f = 0, _g = job.voters; _f < _g.length; _f++) {
                    v = _g[_f];
                    _loop_1(v);
                }
                if (!(approved >= K.majority)) return [3 /*break*/, 9];
                return [4 /*yield*/, job.execute()];
            case 8:
                _h.sent();
                s.meta.cron.push(['executed', job.desc, job.code, job.patch]);
                _h.label = 9;
            case 9: return [4 /*yield*/, job.destroy()];
            case 10:
                _h.sent();
                _h.label = 11;
            case 11:
                _i++;
                return [3 /*break*/, 7];
            case 12:
                if (is_usable && K.usable_blocks % 200 == 0) {
                    // we don't want onchain db to be bloated with revealed hashlocks forever, so destroy them
                    all.push(Hashlock.destroy({
                        where: {
                            delete_at: (_c = {}, _c[Op.lte] = K.usable_blocks, _c)
                        }
                    }));
                }
                /*
                if (K.bet_maturity && K.ts > K.bet_maturity) {
                  l('🎉 Maturity day! Copy all FRB balances to FRD')
                  s.meta.cron.push(['maturity'])
              
                  // first assignment must happen before zeroing
                  await onchainDB.db.query('UPDATE users SET balance1 = balance1 + balance2')
                  await onchainDB.db.query('UPDATE users SET balance2 = 0')
                  //await sequelize.query("UPDATE users SET ")
                  //User.update({ balance1: sequelize.literal('balance1 + balance2'), balance2: 0 }, {where: {id: {[Op.gt]: 0}}})
              
                  K.bet_maturity = false
                }
                */
                // saving current proposer and their fees earned
                all.push(s.meta.proposer.save());
                return [4 /*yield*/, Promise.all(all)];
            case 13:
                _h.sent();
                if (K.total_blocks % 50 == 0) {
                    //var out = require('child_process').execSync(`shasum -a 256 ${datadir}/onchain/db*`).toString().split(/[ \n]/)
                    //K.current_db_hash = out[0]
                }
                if (!(me.my_validator || PK.explorer)) return [3 /*break*/, 15];
                s.meta.missed_validators = s.missed_validators;
                //l('Saving block ' + K.total_blocks)
                return [4 /*yield*/, Block.create({
                        id: K.total_blocks,
                        prev_hash: fromHex(prev_hash),
                        hash: sha3(s.header),
                        round: s.round,
                        precommits: r(s.precommits),
                        header: s.header,
                        ordered_tx_body: s.ordered_tx_body,
                        total_tx: ordered_tx.length,
                        // did anything happen in this block?
                        meta: s.meta.parsed_tx.length +
                            s.meta.cron.length +
                            s.meta.missed_validators.length >
                            0
                            ? JSON.stringify(s.meta)
                            : null
                    })];
            case 14:
                //l('Saving block ' + K.total_blocks)
                _h.sent();
                _h.label = 15;
            case 15:
                // Other validators managed to commit a block, therefore delete lock and proceed
                // Tendermint uses 2/3+ prevotes as "proof of lock change"
                if (PK.locked_block) {
                    //l('Unlocked at ' + K.total_blocks)
                    PK.locked_block = null;
                    me.proposed_block = null;
                }
                // only validators do snapshots, as they require extra computations
                if (me.my_validator &&
                    me.my_validator.id == 1 &&
                    K.blocks_since_last_snapshot == 0) {
                    path_filter = function (path, stat) {
                        // must be deterministic
                        stat.mtime = null;
                        stat.atime = null;
                        stat.ctime = null;
                        stat.birthtime = null;
                        // Skip all test data dirs, our offchain db, tools and irrelevant things for the user
                        // No dotfiles. TODO whitelist
                        if (path.includes('/.') ||
                            path.match(/^\.\/(isolate|data[0-9]+|data\/offchain|\.DS_Store|node_modules|wiki|wallet\/node_modules|dist|tools)/)) {
                            return false;
                        }
                        else {
                            return true;
                        }
                    };
                    filename_1 = 'Fair-' + K.total_blocks + '.tar.gz';
                    options = {
                        gzip: true,
                        sync: false,
                        portable: true,
                        noMtime: true,
                        file: datadir + '/offchain/' + filename_1,
                        filter: path_filter
                    };
                    paths = ['.'];
                    callback = function (_) {
                        // genesis state is stored for analytics and my_validator bootstraping
                        if (old_height > 1) {
                            // delay to let people with slow connection to finish download
                            setTimeout(function () {
                                fs.unlink(datadir + '/offchain/Fair-' + old_height + '.tar.gz', function () {
                                    l('Removed old snapshot ' + old_height);
                                });
                                // link to latest snapshot
                                require('child_process').execSync("ln -sf " + datadir + "/offchain/" + filename_1 + "  " + datadir + "/offchain/Fair-latest.tar.gz");
                            }, 20 * 60 * 1000);
                        }
                        snapshotHash();
                    };
                    require('tar').c(options, paths, callback);
                }
                if (me.request_reload) {
                    gracefulExit('reload requested');
                }
                return [2 /*return*/, true];
        }
    });
}); };
