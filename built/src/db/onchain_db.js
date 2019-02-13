"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Onchain database - every full node has the exact same copy
var Sequelize = require("sequelize");
function onchainModels(db) {
    var User = db.define('User', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        //  /^(\w){1,15}$/)
        username: Sequelize.STRING,
        // saves time to select Debts
        has_debts: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        pubkey: Sequelize.CHAR(32).BINARY,
        batch_nonce: { type: Sequelize.INTEGER, defaultValue: 0 }
    }, {
        indexes: [
            {
                fields: [{ attribute: 'pubkey', length: 32 }]
            }
        ]
    });
    // stores high-level data about bidirectional relationship
    var Insurance = db.define('Insurance', {
        leftId: Sequelize.INTEGER,
        rightId: Sequelize.INTEGER,
        // for instant withdrawals, increase one by one
        withdrawal_nonce: { type: Sequelize.INTEGER, defaultValue: 0 },
        // increased offchain. When disputed, higher one is true
        dispute_nonce: Sequelize.INTEGER,
        dispute_delayed: Sequelize.INTEGER,
        // actual state proposed, rlp-encoded
        dispute_state: Sequelize.TEXT,
        // started by left user?
        dispute_left: Sequelize.BOOLEAN
    }, {
        indexes: [
            {
                fields: ['leftId', 'rightId']
            }
        ]
    });
    // stores actual insurance balances, per-asset
    var Subinsurance = db.define('Subinsurance', {
        asset: { type: Sequelize.INTEGER, defaultValue: 1 },
        balance: { type: Sequelize.BIGINT, defaultValue: 0 },
        // moved when touched by left user
        ondelta: { type: Sequelize.BIGINT, defaultValue: 0 }
    }, {
        indexes: [
            {
                fields: ['asset']
            }
        ]
    });
    var Proposal = db.define('Proposal', {
        desc: Sequelize.TEXT,
        code: Sequelize.TEXT,
        patch: Sequelize.TEXT,
        delayed: Sequelize.INTEGER,
        kindof: Sequelize.STRING
    });
    var Vote = db.define('Vote', {
        rationale: Sequelize.TEXT,
        approval: Sequelize.BOOLEAN // approval or denial
    });
    var Debt = db.define('Debt', {
        asset: Sequelize.INTEGER,
        amount_left: Sequelize.INTEGER,
        oweTo: Sequelize.INTEGER
    });
    // onchain balances (w/o bank)
    var Balance = db.define('Balance', {
        asset: { type: Sequelize.INTEGER, defaultValue: 1 },
        balance: { type: Sequelize.BIGINT, defaultValue: 0 }
    });
    var Order = db.define('Order', {
        amount: Sequelize.INTEGER,
        rate: Sequelize.FLOAT
    });
    // Hashlocks is like an evidence guarantee: if you have the secret before exp you unlock the action
    // Primarily used in atomic swaps and mediated transfers. Based on Sprites concept
    // They are are stored for a few days and unlock a specific action
    var Hashlock = db.define('Hashlock', {
        alg: Sequelize.INTEGER,
        hash: Sequelize.BLOB,
        revealed_at: Sequelize.INTEGER,
        delete_at: Sequelize.INTEGER
    }, {
        indexes: [
            {
                fields: [{ attribute: 'hash', length: 32 }]
            }
        ]
    });
    // Assets represent all numerical balances: currencies, tokens, shares, stocks.
    // Anyone can create a new asset
    var Asset = db.define('Asset', {
        ticker: Sequelize.TEXT,
        name: Sequelize.TEXT,
        desc: Sequelize.TEXT,
        // division point for min unit, 0 for yen 2 for dollar
        division: Sequelize.INTEGER,
        issuable: Sequelize.BOOLEAN,
        issuerId: Sequelize.INTEGER,
        total_supply: Sequelize.INTEGER
    });
    Insurance.hasMany(Subinsurance);
    Subinsurance.belongsTo(Insurance);
    User.hasMany(Debt);
    Debt.belongsTo(User);
    User.hasMany(Balance);
    Balance.belongsTo(User);
    Asset.hasMany(Order);
    Asset.hasMany(Order, { as: 'buyAsset', foreign_key: 'buyAsset' });
    User.hasMany(Order);
    Order.belongsTo(User);
    Order.belongsTo(Asset);
    Order.belongsTo(Asset, { as: 'buyAsset' });
    Proposal.belongsTo(User);
    Proposal.belongsToMany(User, { through: Vote, as: 'voters' });
}
exports.default = onchainModels;
