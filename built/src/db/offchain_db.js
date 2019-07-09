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
}
exports.default = offchainModels;
