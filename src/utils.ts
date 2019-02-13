import * as opn from '../lib/opn'
import nacl = require('../lib/nacl')


import * as rlp from '../lib/rlp'

import * as fs from 'fs'

import minimist = require('minimist')

const {digest} = require('js-sha3').sha3_256;

import * as crypto from "crypto";

// shorter way to find by an attribute
Array.prototype['by'] = function(attr: string, val: number | string) {
  return this.find((obj) => {
    return obj[attr] === val
  })
}

/*
Buffer.prototype['toJSON'] = function() {
  return this.toString('hex')
}*/

Array.prototype['randomElement'] = function() {
  return this[Math.floor(Math.random() * this.length)]
}


export const encryptBox = nacl.box
export const openBox = nacl.box.open

/*
// JSON envelopes 
export const encryptJSONBox = (boxData, target_pubkey) => {
  // we don't care about authentication of box, but nacl requires that
  let throwaway = nacl.box.keyPair()

  let unlocker_nonce = crypto.randomBytes(24)

  let box = encryptBox(
    Buffer.from(JSON.stringify(boxData)),
    unlocker_nonce,
    target_pubkey,
    throwaway.secretKey
  )
  return rlp.encode([Buffer.from(box), unlocker_nonce, Buffer.from(throwaway.publicKey)])
}

export function openJSONBox(box: Buffer) {
  let unlocker = r(box)
  let rawBox = openBox(
    unlocker[0],
    unlocker[1],
    unlocker[2],
    me.box.secretKey
  )
  if (rawBox == null) {
    return false
  } else {
    return parse(Buffer.from(rawBox).toString())
  }
}

export function ecSign(a, b) {return bin(nacl.sign.detached(a, b)) }
export function ecVerify(a, b, c) {
  // speed of ec.verify is useless in benchmarking as depends purely on 3rd party lib speed
  return nacl.sign.detached.verify(a, b, c)
}

*/






export enum MethodMap {
  ReturnChain,
  JSON,

  Propose,
  Prevote,
  Precommit,

  Batch,
  Deposit,
  Withdraw,
  Dispute,
  RevealSecrets,
  Vote
}


// for testnet handicaps
export const sleep = async function(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}



// critical section for a specific key
// https://en.wikipedia.org/wiki/Critical_section
export async function section(key, job) {
  return new Promise(async (resolve) => {
    key = JSON.stringify(key)

    if (this._LOCKS[key]) {
      if (this._LOCKS[key].length > 10) {
        console.log('Queue overflow for: ' + key)
      }

      this._LOCKS[key].push([job, resolve])
    } else {
      this._LOCKS[key] = [[job, resolve]]

      while (this._LOCKS[key].length > 0) {
        try {
          let [got_job, got_resolve] = this._LOCKS[key].shift()

          got_resolve(await got_job())

        } catch (e) {
          console.log('Error in critical section: ', e)
         
        }
      }
      delete this._LOCKS[key]
    }
  })
}



Buffer.prototype['readInt'] = (signed = false) => {
  // reads signed integer from RLP encoded buffer
  
  if (this.length > 0) {
    var num = this.readUIntBE(0, this.length)
    if (signed) {
      return num % 2 == 1 ? -(num - 1) / 2 : num / 2
    } else {
      return num
    }
  } else {
    return 0
  }
}



export function sha3(a: Buffer) {
  return Buffer.from(digest(a));
}







export function parseJSON(json: string) {
  try {
    let o = JSON.parse(json, (k, v) => {
      if (
        v !== null            &&
        typeof v === 'object' && 
        'type' in v           &&
        v.type === 'Buffer'   &&
        'data' in v           &&
        Array.isArray(v.data)) {
        return new Buffer(v.data);
      }
      return v;
    });
    return (o && typeof o === 'object') ? o : {};
  } catch (e) {
    return {}
  }
}



// derives private key from username and password using memory hard alg
// Why brainwallets are great: https://medium.com/fairlayer/why-brainwallet-are-great-for-cryptocurrency-ff73dd65ecd9
import Scrypt = require('../lib/scrypt')

export async function derive(username, password) {
  return new Promise((resolve, reject) => {
    Scrypt(
      password,
      username,
      {
        N: Math.pow(2, 12),
        r: 8,
        p: 1,
        dkLen: 32,
        encoding: 'binary'
      },
      (r) => {
        resolve(Buffer.from(r))
      }
    )

    /* Native scrypt
    var seed = await scrypt.hash(password, {
      N: Math.pow(2, 16),
      interruptStep: 1000,
      p: 2,
      r: 8,
      dkLen: 32,
      encoding: 'binary'
    }, 32, username)

    return seed; */
  })
}



export {
  fs,
  rlp,
  minimist,
  crypto
}