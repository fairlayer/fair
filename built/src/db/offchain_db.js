"use strict";
// Offchain database - local and private stuff
Object.defineProperty(exports, "__esModule", { value: true });
/*
Helpful stats:
show status like '%used_connections%';
show variables like 'max_connections';
show variables like 'open_files_limit';
ulimit -n 10000

Set new mysql pw:
use mysql;
update user set authentication_string=password(''), plugin='mysql_native_password' where user='root';
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123123';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123123';
SELECT plugin FROM mysql.user WHERE User = 'root';

Create databases before usage in simulation:

str = 'create database data;'
for(i=8001;i<8200;i++){
  str+='create database data'+i+';'
}
*/
var Sequelize = require('sequelize');
function offchainModels(db) {
    // Encapsulates relationship with counterparty: offdelta and last signatures
    // TODO: seamlessly cloud backup it. If signatures are lost, money is lost
    // we name our things "value", and counterparty's "they_value"
    var Channel = db.define('Channel', {
        // between who and who
        they_pubkey: Sequelize.BLOB,
        // higher nonce is valid
        dispute_nonce: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        // used during rollbacks
        rollback_nonce: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        status: {
            type: Sequelize.ENUM('master', 'sent', 'merge', 'disputed', 'CHEAT_dontack')
        },
        pending: Sequelize.BLOB,
        ack_requested_at: {
            type: Sequelize.DATE,
            defaultValue: null
        },
        could_rebalance: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        last_online: Sequelize.DATE,
        withdrawal_requested_at: Sequelize.DATE,
        sig: Sequelize.BLOB,
        signed_state: Sequelize.BLOB,
        // All the safety Byzantine checks start with cheat_
        CHEAT_profitable_state: Sequelize.BLOB,
        CHEAT_profitable_sig: Sequelize.BLOB
    }, {
        indexes: [
            {
                fields: [
                    {
                        attribute: 'they_pubkey',
                        length: 32
                    }
                ]
            }
        ]
    });
    // each separate offdelta per asset
    var Subchannel = db.define('Subchannel', {
        asset: {
            type: Sequelize.INTEGER,
            defaultValue: 1
        },
        offdelta: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        rollback_offdelta: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        // by default all limits set to 0
        rebalance: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        credit: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        they_rebalance: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        they_credit: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        requested_insurance: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        they_requested_insurance: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        withdrawal_amount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        withdrawal_sig: Sequelize.BLOB,
        they_withdrawal_amount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        }
    }, {
        indexes: [
            {
                fields: [
                    {
                        attribute: 'asset'
                    }
                ]
            }
        ]
    });
    var Payment = db.define('Payment', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        //todo: move to single field addnew, addsent ...
        type: Sequelize.STRING,
        status: Sequelize.STRING,
        is_inward: Sequelize.BOOLEAN,
        processed: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        // streaming payments
        lazy_until: Sequelize.DATE,
        // in outward it is inward amount - fee
        amount: Sequelize.INTEGER,
        // hash is same for inward and outward
        hash: Sequelize.BLOB,
        // best by block
        exp: Sequelize.INTEGER,
        // asset type
        asset: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        // secret or fail reason
        outcome_type: Sequelize.STRING,
        // payload of outcome
        outcome: Sequelize.STRING,
        // string to be decrypted by outward
        unlocker: Sequelize.BLOB,
        // user-specified or randomly generated private message
        private_invoice: Sequelize.BLOB,
        // stored on our node only. can help to identify the reason for payment
        // eg when a withdrawal has failed we credit funds back
        personal_tag: Sequelize.BLOB,
        // who is recipient
        destination_address: Sequelize.TEXT,
        // sender may decide to provide refund address inside the private message
        source_address: Sequelize.TEXT,
        // who caused us to make this payment (if we're bank)?
        inward_pubkey: Sequelize.BLOB,
        // resulting balance
        resulting_balance: Sequelize.INTEGER
    }, {
        indexes: [
            {
                fields: ['type', 'status']
            }
        ]
    });
    // used primarily by validators and explorers to store historical blocks.
    // Regular users don't have to store blocks ("pruning" mode)
    var Block = db.define('Block', {
        hash: Sequelize.BLOB,
        prev_hash: Sequelize.BLOB,
        // sigs that authorize block
        precommits: Sequelize.BLOB,
        // at what round the block has been commited
        round: Sequelize.INTEGER,
        // header with merkle roots in it
        header: Sequelize.BLOB,
        // array of tx in block
        ordered_tx_body: Sequelize.BLOB,
        // happened events stored in JSON
        meta: Sequelize.TEXT,
        total_tx: Sequelize.INTEGER
    }, {
        indexes: [
            {
                fields: [{ attribute: 'prev_hash', length: 32 }]
            }
        ]
    });
    // log/history for current user
    var Event = db.define('Event', {
        type: Sequelize.STRING,
        desc: Sequelize.TEXT,
        data: Sequelize.TEXT,
        amount: Sequelize.INTEGER,
        asset: Sequelize.INTEGER,
        userId: Sequelize.INTEGER,
        blockId: Sequelize.INTEGER,
        processed: Sequelize.BOOLEAN,
        public_invoice: Sequelize.BLOB
    });
    var nonull = { foreignKey: { allowNull: false }, onDelete: 'CASCADE' };
    Channel.hasMany(Subchannel, nonull);
    Subchannel.belongsTo(Channel, nonull);
    Channel.hasMany(Payment, nonull);
    Payment.belongsTo(Channel, nonull);
}
exports.default = offchainModels;
