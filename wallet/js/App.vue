<template>
  <div>
    <template v-if="pendingBatch.length + batch.length > 0">
      <div style="position:fixed;
      z-index:1500;
      opacity:0.9;
      bottom:0px;
      width:100%;
      background-color: #FFFDDE; border:thin solid #EDDD00">
       
        <p style='margin: 10px;text-align:center'>
          <span v-html="prettyBatch(pendingBatch.length > 0 ? pendingBatch : batch)"></span>

          <template v-if="pendingBatch.length > 0">
            Wait for validation...<dotsloader></dotsloader>
          </template>
          <template v-else>
          <span>
            <input style="width: 80px" type="number" v-model="gasprice">
     (gas price) * {{batch_estimate.size}} (gas) = fee {{commy(gasprice * batch_estimate.size)}}
            </span>
          <!--<div class="slidecontainer" style="display:inline-block;">
              <input type="range" min="1" max="100" class="slider" v-model="gasprice">
            </div>-->
          <span v-if="getAsset(1) - gasprice * batch_estimate.size >= 100"><button type="button" class="btn btn-outline-danger" @click="call('broadcast', {gasprice: parseInt(gasprice)})">Sign & Broadcast</button> or <a class="dotted" @click="call('clearBatch')">clear batch</a></span>
          <span v-else>Not enough FRD onchain</span>
          </template>

        </p>
      </div>
    </template>
    <nav class="navbar navbar-expand-md navbar navbar-dark bg-dark">
      <ul class="navbar-nav mr-auto bg-dark">
        <li class="nav-item">
          <a class="nav-link" @click="go('')">{{t('home')}}</a>
        </li>
        <li v-if="install_snippet" class="nav-item">
          <a class="nav-link" @click="go('install')">{{t('install')}}</a>
        </li>
        <template v-if="auth_code">
          <li class="nav-item">
            <a class="nav-link" @click="go('wallet')">{{t('wallet')}}</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" @click="go('settings')">{{t('settings')}}</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" @click="go('node_metrics')">{{t('node_metrics')}}</a>
          </li>
        </template>
        <li class="nav-item">
          <a class="nav-link" @click="go('blockchain_history')">{{t('blockchain_history')}}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" @click="go('validators')">{{t('validators')}}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" @click="go('smart_updates')">{{t('smart_updates')}}</a>
        </li>
      </ul>
      <span v-if="K.ts < ts() - K.safe_sync_delay" @click="call('sync')" v-bind:class='["badge", "badge-danger"]'>#{{K.total_blocks}}/{{K.total_blocks + Math.round((ts() - K.ts)/K.blocktime)}}, {{timeAgo(K.ts)}}</span>
      <span v-else-if="K.total_blocks" class="navbar-text">Block #{{K.total_blocks}}, {{timeAgo(K.ts)}}</span> &nbsp;
      <a v-if="onServer" href="/demoinstance">
        <button class="btn btn-success">Try Full Node Demo</button>
      </a>
    </nav>
    <br>
    <div class="container">
      <div v-if="sync_started_at && K.ts < ts() - K.safe_sync_delay">
        <h1>Syncing and validating new blocks</h1>
        <p>Please wait for validation of all blocks that were created while your node was offline. To avoid this in the future enable background sync. Blocks synced so far: {{K.total_blocks - sync_started_at}}, tx: {{K.total_tx - sync_tx_started_at}}</p>
        <div class="progress">
          <div class="progress-bar" v-bind:style="{ width: sync_progress+'%', 'background-color':'#5cb85c'}" role="progressbar"></div>
        </div>
      </div>
      <div class="tpstrend visible-lg-4" @click="go('node_metrics')" v-if="my_bank">
        <trend :data="metrics.settle.avgs.slice(metrics.settle.avgs.length-300)" :gradient="['#6fa8dc', '#42b983', '#2c3e50']" auto-draw :min=0 :width=150 :height=50>
        </trend>
      </div>
      <div v-if="!online">
        <template src="./js/t.html"></template>
        <h1>Connection failed, reconnecting...</h1>
      </div>
      <div v-else-if="tab==''">
        <Home></Home>
      </div>
      <div v-else-if="tab=='node_metrics'">
        <h2>Node Metrics</h2>
        <p v-for="(obj, index) in metrics">
          <b v-if="['volume','fees'].indexOf(index) != -1">Current {{index}}/s: {{commy(obj.last_avg)}} (max {{commy(obj.max)}}, total {{commy(obj.total)}}).</b>
          <b v-else>Current {{index}}/s: {{commy(obj.last_avg,false)}} (max {{commy(obj.max,false)}}, total {{commy(obj.total,false)}}).</b>
          <trend :data="obj.avgs.slice(obj.avgs.length-300)" :gradient="['#6fa8dc', '#42b983', '#2c3e50']" auto-draw :min="0" smooth>
          </trend>
        </p>
      </div>
      <div v-else-if="tab=='validators'">
        <h1>Validators</h1>
        <table class="table">
          <thead class="thead-dark">
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Shares</th>
              <th scope="col">Platform</th>
              <th scope="col">Website</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in K.validators">
              <td>{{m.username}}</td>
              <td>{{m.shares}}</td>
              <td>{{m.platform}}</td>
              <td><a v-bind:href="m.website+'/#install'">{{m.website}}</a>
                <td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="tab=='settings'">
        <pre>Auth link: {{getAuthLink()}}</pre>
        <p>
          <button class="btn btn-dark" @click="devmode=!devmode">Toggle Devmode</button>
        </p>
        <p>
          <button type="button" class="btn btn-outline-danger" @click="call('logout')">Graceful Shutdown
          </button>
        </p>
      </div>
      <div v-else-if="tab=='wallet'">
        <template v-if="pubkey">
          <ul class="nav nav-pills nav-fill">
            <li class="nav-item">
              <a @click="outward.type='offchain'" class="nav-link " v-bind:class="{active: outward.type=='offchain'}" href="javascript:void(0)">Offchain ⚡️</a>
            </li>
            <li class="nav-item">
              <a @click="outward.type='onchain'" class="nav-link " v-bind:class="{active: outward.type=='onchain'}" href="javascript:void(0)">Onchain 🌐</a>
            </li>
          </ul>
          <br>
          <h4 class="alert alert-primary" v-if="my_bank">This node is a bank: {{my_bank.handle}}</h4>
          <h4 class="alert alert-primary" v-if="my_validator">This node is a validator: {{my_validator.username}}</h4>
          <p style="word-wrap: break-word">Your address: <b>{{address}}</b></p>
          <template v-if="outward.type == 'offchain'">
            <div class="alert alert-secondary" v-for="ch in channels">
              <h2>
                {{pubkeyToUser(ch.d.they_pubkey)}}
              </h2>
              <p>
                <h3 v-for="subch in ch.d.subchannels">
                  <a class="dotted" @click="mod={shown:true, ch:ch, subch: subch, credit: commy(subch.credit), rebalance: commy(subch.rebalance)}">{{to_ticker(subch.asset)}}: {{commy(ch.derived[subch.asset].available)}} (insured {{commy(ch.derived[subch.asset].insured)}})</a>&nbsp;

                  <span class="badge badge-success bank-faucet" @click="call('withChannel', {they_pubkey: ch.d.they_pubkey, method: 'testnet', action: 'faucet', asset: subch.asset, amount: 10000 })">faucet</span>

                </h3>
              </p>
              <p v-if="record">
                <span v-if="ch.ins && ch.ins.dispute_delayed">
                  <b>{{ch.ins.dispute_delayed - K.usable_blocks}} usable blocks</b> left until dispute resolution <dotsloader></dotsloader>
                </span>
                <span v-else-if="ch.d.status=='dispute'">
                  Wait until your dispute tx is broadcasted
                </span>
                <button v-else type="button" class="btn btn-outline-danger" @click="call('startDispute', {they_pubkey: ch.d.they_pubkey})">Start a Dispute 🌐</button>
              </p>
              <p v-if="devmode">
                Status: {{ch.d.status}}, nonce {{ch.d.dispute_nonce}}
                <pre v-html="ch.ascii_states"></pre>
              </p>
            </div>
            <template v-if="channels.length == 0">
              <h3 class="alert alert-info"><a class="dotted" @click=go('banks')>Add banks</a> to send & receive payments instantly.</h3>
            </template>
          </template>
          <template v-else>
            <div v-if="record">
              <h3 v-for="a in record.balances">
              {{to_ticker(a.asset)}}: {{commy(getAsset(a.asset))}} 
              &nbsp;
              <span class="badge badge-success layer-faucet" @click="call('onchainFaucet', {amount: 10000, asset: a.asset })">faucet</span>
            </h3>
            </div>
            <div v-else>
              <span class="badge badge-success layer-faucet" @click="call('onchainFaucet', {amount: 10000, asset: 1 })">faucet</span>
            </div>
          </template>
          <p>
            <div class="input-group" style="width:300px">
              <input type="text" class="form-control small-input" v-model="outward.address" :disabled="['none','amount'].includes(outward_editable)" placeholder="Address" aria-describedby="basic-addon2" @input="updateRoutes">
            </div>
          </p>
          <p>
            <div class="input-group" style="width:300px">
              <input type="text" class="form-control small-input" v-model="outward.amount" :disabled="outward_editable=='none'" placeholder="Amount" aria-describedby="basic-addon2" @input="updateRoutes">
              <select @input="updateRoutes" style="display:inline-block" v-model="outward.asset" class="custom-select custom-select-lg mb-6">
                <option v-for="a in assets" :value="a.id">{{a.ticker}}</option>
              </select>
            </div>
          </p>
          <template v-if="outward.type=='offchain'">
            <template v-if="outward.address.length > 0">
              <p v-if="bestRoutes.length == 0">
                No route found, try onchain.
              </p>
              <template v-else>
                <h5>Choose route/fee:</h5>
                <div class="radio" v-for="(r, index) in bestRoutes.slice(0, bestRoutesLimit)">
                  <label>
                    <input type="radio" :value="r[1].join('_')" v-model="chosenRoute"> {{routeToText(r)}} (<b>{{r[0]}}</b>) </label>
                </div>
                <p v-if="bestRoutes.length > bestRoutesLimit"><a class="dotted" @click="bestRoutesLimit += 5">Show More Routes</a></p>
              </template>
            </template>
            <p>
              <button type="button" class="btn btn-outline-success pay-now" @click="call('sendOffchain', {address: outward.address, asset: outward.asset, amount: uncommy(outward.amount), addrisk: addrisk, lazy: lazy, chosenRoute: chosenRoute});">Pay Now ⚡️</button>
              <button v-if="devmode" type="button" class="btn btn-outline-danger" @click="stream()">Pay 100 times</button>
            </p>
            <table v-if="payments.length > 0" class="table">
              <transition-group name="list" tag="tbody">
                <tr v-bind:key="h.id" v-for="(h, index) in payments.slice(0, history_limit)">
                  <td width="10%" v-html="skipDate(h, index)"></td>
                  <td @click="outward.address=(h.is_inward ? h.source_address : h.destination_address)+'#'+h.private_invoice; outward.amount=commy(h.amount);"><u class="dotted">{{paymentToDetails(h)}}</u>: {{h.invoice}} via {{to_user(channels.find(ch=>ch.d.id==h.channelId).partner)}}</td>
                  <td width="15%">{{to_ticker(h.asset)}} {{commy(h.is_inward ? h.amount : -h.amount)}} {{payment_status(h)}}</td>
                </tr>
              </transition-group>
              <tr v-if="payments.length > history_limit">
                <td colspan="7" align="center"><a @click="history_limit += 20">Show More</a></td>
              </tr>
            </table>
          </template>
          <template v-else>
            <div v-if="parsedAddress.banks">
              <div class="radio">
                <label>
                  <input type="radio" :value="0" v-model="outward.bank"> Deposit to {{onchain}}</label>
              </div>
              <template v-if="parsedAddress.banks.length > 0">
                <h5>Or choose a bank:</h5>              
                <div class="radio" v-for="id in parsedAddress.banks">
                  <label>
                    <input type="radio" :value="id" v-model="outward.bank"> {{to_user(id)}}</label>
                </div>
              </template>
            </div>
            <p>
              <button v-if="record" type="button" class="btn btn-outline-success" @click="addExternalDeposit">Transfer 🌐</button>
              <small v-else>You are not registered</small>
            </p>
            <table v-if="events.length > 0" class="table">
              <thead>
                <tr>
                  <th width="5%">Block</th>
                  <th width="65%">Details</th>
                </tr>
              </thead>
              <tbody>
                <Event v-for="ev in events" :ev="ev">
              </tbody>
            </table>
          </template>
        </template>
        <form v-else class="form-signin" v-on:submit.prevent="call('login',{username, pw})">
          <p>
            <h4 class="danger danger-primary">To start using Fairlayer you must create your own digital identity. Make sure you don't forget your password - <b>password recovery is not possible.</b> If in doubt, write it down or email it to yourself.</h4></p>
          <label for="inputUsername" class="sr-only">Username</label>
          <input v-model="username" type="text" id="inputUsername" class="form-control" placeholder="Username" required autofocus>
          <br>
          <label for="inputPassword" class="sr-only">Password</label>
          <input v-model="pw" type="password" id="inputPassword" class="form-control" placeholder="Password" required>
          <button class="btn btn-lg btn-outline-primary btn-block step-login" id="login" type="submit">Generate Wallet</button>
        </form>
      </div>
      <div v-else-if="tab=='install'">
        <h4>Instant Full Node Demo</h4>
        <p><a href="/demoinstance">Try Fair Core for 1 hour without installing it on your computer.</a> Currently active sessions: {{busyPorts}}</p>
        <h4>Install a Full Node</h4>
        <p>Install <a href="https://nodejs.org/en/download/">Node.js</a> (9.6.0+) and copy paste this snippet into your Terminal app and press Enter:</p>
        <div style="background-color: #FFFDDE; padding-left: 10px;">
          <Highlight :white="true" lang="bash" :code="install_snippet"></Highlight>
        </div>
        <p><b>For higher security</b> visit a few trusted nodes below and verify the snippet to ensure our server isn't compromised. Only paste the snippet into Terminal if there is exact match with other sources.</p>
        <ul>
          <li v-for="m in K.validators" v-if="m.website && (!my_validator || m.id != my_validator.id)"><a v-bind:href="m.website+'/#install'">{{m.website}} - by {{m.username}} ({{m.platform}})</a></li>
        </ul>
      </div>
      <div v-else-if="tab=='smart_updates'">
        <h3>Smart Updates</h3>
        <p>Smart updates solve the same problem as smart contracts - they are adding a new functionality into the blockchain. While smart contracts run inside a complicated virtual machine with execution overhead and opcode limitations, smart updates modify the underlying blockchain software and provide a more effective and powerful way to add a new feature or fix a problem. Anyone can propose a smart update, validators vote for it and then it is syncroniously applied across all nodes.</p>
        <div class="form-group">
          <label for="comment">Description:</label>
          <textarea class="form-control" v-model="proposal[0]" rows="2" id="comment"></textarea>
        </div>
        <div class="form-group">
          <label for="comment">Code to execute (optional):</label>
          <textarea class="form-control" v-model="proposal[1]" rows="2" id="comment"></textarea>
        </div>
        <div class="form-group">
          <input class="form-check-input" type="checkbox" v-model="proposal[2]"> Add patch
        </div>
        <p>
          <button @click="call('propose', proposal)" class="btn btn-warning">Propose 🌐</button>
        </p>
        <div v-for="p in proposals">
          <h4>#{{p.id}}: {{p.desc}}</h4>
          <small>Proposed by {{to_user(p.user.id)}}</small>
          <Highlight lang="javascript" :code="p.code"></Highlight>
          <div v-if="p.patch">
            <div style="line-height:15px; font-size:12px;">
              <Highlight lang="diff" :code="p.patch"></Highlight>
            </div>
          </div>
          <p v-for="u in p.voters">
            <b>{{u.vote.approval ? 'Approved' : 'Denied'}}</b> by {{to_user(u.id)}}: {{u.vote.rationale ? u.vote.rationale : '(no rationale)'}}
          </p>
          <small>To be executed at {{p.delayed}} usable block</small>
          <div v-if="record">
            <p v-if="!ivoted(p.voters)">
              <button @click="call('vote', {approval: 1, id: p.id})" class="btn btn-outline-success">Approve 🌐</button>
              <button @click="call('vote', {approval: 0, id: p.id})" class="btn btn-outline-danger">Deny 🌐</button>
            </p>
          </div>
        </div>
      </div>
      <div v-else-if="tab=='blockchain_history'">
        <h1>Blockchain Explorer</h1>
        <p>These transactions were publicly broadcasted and executed on every full node, including yours. Blockchain space is reserved for insurance rebalances, disputes and other high-level settlement actions.</p>
        <p v-if="nextValidator">Next validator: {{to_user(nextValidator.id)}}</p>
        <table v-if="blocks.length>0" class="table">
          <thead class="thead-dark">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Prev Hash</th>
              <th scope="col">Hash</th>
              <th scope="col">Relayed By (round, ts)</th>
              <th scope="col">Total Tx</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="b in blocks">
              <tr>
                <td>{{b.id}}</td>
                <td>{{b.prev_hash.substr(0,10)}}</td>
                <td>{{b.hash.substr(0,10)}}</td>
                <td>{{b.built_by}} ({{b.round}}, {{(new Date(b.timestamp)).toLocaleString()}})</td>
                <td>{{b.total_tx}}</td>
              </tr>
              <tr v-for="batch in (b.meta && b.meta.parsed_tx)">
                <td colspan="7">
                  <span class="badge badge-warning">{{to_user(batch.signer.id)}} ({{batch.gas}}*{{commy(batch.gasprice, true, false)}}=${{commy(batch.txfee)}})</span>&nbsp;
                  <template v-for="d in batch.events">
                    &nbsp;
                    <span v-if="d[0]=='dispute'" class="badge badge-primary" v-html="dispute_outcome(d[2], d[3], d[4])">
                    </span>
                    <span v-else-if="d[0]=='setAsset'" class="badge badge-dark">{{d[1]}} {{to_ticker(d[2])}}</span>
                    <span v-else-if="d[0]=='withdraw'" class="badge badge-danger">{{commy(d[1])}} from {{to_user(d[2])}}</span>
                    <span v-else-if="d[0]=='revealSecrets'" class="badge badge-danger">Reveal: {{trim(d[1])}}</span>
                    <span v-else-if="d[0]=='enforceDebt'" class="badge badge-dark">{{commy(d[1])}} debt to {{to_user(d[2])}}</span>
                    <span v-else-if="d[0]=='deposit'" class="badge badge-success">{{commy(d[1])}} to {{d[3] ? ((d[2] == batch.signer.id ? '': to_user(d[2]))+'@'+to_user(d[3])) : to_user(d[2])}}{{d[4] ? ' for '+d[4] : ''}}</span>
                    <span v-else-if="d[0]=='createOrder'" class="badge badge-dark">Created order {{commy(d[2])}} {{to_ticker(d[1])}} for {{to_ticker(d[3])}}</span>
                    <span v-else-if="d[0]=='cancelOrder'" class="badge badge-dark">Cancelled order {{d[1]}}</span>
                    <span v-else-if="d[0]=='createAsset'" class="badge badge-dark">Created {{commy(d[2])}} of asset {{d[1]}}</span>
                    <span v-else-if="d[0]=='createBank'" class="badge badge-dark">Created bank {{d[1]}}</span>
                  </template>
                </td>
              </tr>
              <tr v-if="b.meta">
                <td v-if="b.meta.cron.length + b.meta.missed_validators.length > 0" colspan="7">
                  <template v-if="b.meta.cron.length > 0" v-for="m in b.meta.cron">
                    <span v-if="m[0] == 'maturity'" class="badge badge-primary">🎉 Maturity day! All FRB balances are copied to FRD balances.</span>
                    <span v-else-if="m[0] == 'resolved'" class="badge badge-primary" v-html="dispute_outcome(m[0], m[1], m[2])"></span>
                    <span v-else-if="m[0] == 'snapshot'" class="badge badge-primary">Generated a new snapshot at #{{m[1]}}</span>
                    <span v-else-if="m[0] == 'executed'" class="badge badge-primary">Proposal {{m[1]}} gained majority vote and was executed</span> &nbsp;
                  </template>
                  <span v-if="b.meta.missed_validators.length > 0" class="badge badge-danger">Missed signatures from validators: {{b.meta.missed_validators.join(', ')}}</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-else>
          <p><b>This node does not keep blocks. <a href="https://fairlayer.com/#blockchain_history">Try public explorer.</a></b></p>
        </div>
      </div>
    </div>
    <div v-if="mod.shown" class="modal-backdrop fade show"></div>
    <div @click.self="mod.shown=false" class="modal fade bd-example-modal-lg" v-if="mod.shown" v-bind:style="{display: mod.shown ? 'block' : 'none'}" v-bind:class="{show: mod.shown}">
      <div style="min-width:70%;" class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-body">
            <div class="container-fluid">
              <div class="row">
                <div class="col-md-6">
                  <table class="table">
                    <thead class="thead-dark">
                      <tr>
                        <th scope="col"></th>
                        <th scope="col">You</th>
                        <th scope="col">{{to_user(mod.ch.partner)}}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Available {{to_ticker(mod.subch.asset)}}</td>
                        <td>{{commy(derived.available)}}</td>
                        <td>{{commy(derived.they_available)}}</td>
                      </tr>
                      <tr>
                        <td>Hold</td>
                        <td>{{commy(derived.outwards_hold)}}</td>
                        <td>{{commy(derived.inwards_hold)}}</td>
                      </tr>
                      <tr>
                        <td>Insured</td>
                        <td>{{commy(derived.insured)}}</td>
                        <td>{{commy(derived.they_insured)}}</td>
                      </tr>
                      <tr>
                        <td>Uninsured</td>
                        <td>{{commy(derived.uninsured)}}</td>
                        <td>{{commy(derived.they_uninsured)}}</td>
                      </tr>
                      <tr>
                        <td>Credit</td>
                        <td>{{commy(mod.subch.credit)}}</td>
                        <td>{{commy(mod.subch.they_credit)}}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="col-md-6">
                  <p>Credit limit (maximum uninsured balance)</p>
                  <p>
                    <input type="text" class="form-control" v-model="mod.credit">
                  </p>
                  <p>Automatically request insurance after</p>
                  <p>
                    <input type="text" class="form-control" v-model="mod.rebalance">
                  </p>
                  <p>
                    <button type="button" class="btn btn-outline-success" @click="call('withChannel', {they_pubkey: mod.ch.d.they_pubkey, asset: mod.subch.asset, method: 'setLimits', credit: uncommy(mod.credit), rebalance: uncommy(mod.rebalance)})" href="#">Update Credit Limits</button>
                  </p>
                  <p>
                    <span v-if="record" class="badge badge-danger" @click="a=prompt(`How much to withdraw to onchain?`);if (a) {call('withChannel', {they_pubkey: mod.ch.d.they_pubkey, asset: mod.subch.asset, method: 'withdraw', amount: uncommy(a)})};">Withdraw</span>
                    <span v-if="record" class="badge badge-danger" @click="mod.shown=false;outward.address=address;updateRoutes();outward.type='onchain';outward.asset=mod.subch.asset;outward.bank = mod.ch.partner;">Deposit</span>
                    <span class="badge badge-danger" @click="requestInsurance(mod.ch, mod.subch.asset)">Request Insurance</span>
                    <dotsloader v-if="derived.subch.requested_insurance"></dotsloader>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

const plugin = {
  install() {
    Vue.prototype.commy = function(b, asset = 1) {
      var dot = true
      var withSymbol = ''

      if (asset == 2) {
        withSymbol = '€'
      }

      let prefix = b < 0 ? '-' : ''

      b = Math.abs(Math.round(b)).toString()
      if (dot) {
        if (b.length == 1) {
          b = '0.0' + b
        } else if (b.length == 2) {
          b = '0.' + b
        } else {
          var insert_dot_at = b.length - 2
          b = b.slice(0, insert_dot_at) + '.' + b.slice(insert_dot_at)
        }
      }

      if (withSymbol) {
        prefix = prefix + withSymbol
      }

      return prefix + b.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    }
    Vue.commy = Vue.prototype.commy
  }
}

Vue.use(plugin)


import Highlight from './Highlight'
import Home from './Home'
import Tutorial from './Tutorial'
import Event from './Event'

import Dotsloader from './Dotsloader'
//import VisualChannel from './VisualChannel'



export default {
  components: {
    Highlight,
    Home,
    Tutorial,
    Event,
    Dotsloader
  },
  mounted() {
    window.app = this

    window.onscroll = function(ev) {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        app.history_limit += 20
      }
    }


    app.call('load')

    app.go(location.hash.substr(1).split(/\/|\?/)[0])

    this.interval = setInterval(function() {
      app.call('load')
    }, localStorage.auth_code ? 6000 : 15000)


    setInterval(() => app.$forceUpdate(), 1000)
  },
  destroyed() {
    clearInterval(this.interval)
  },

  data() {
    return require('./data')
  },
  computed: {
    derived: function() {
      let ch = this.channels.find(ch => ch.d.id == this.mod.ch.d.id)

      return ch.derived[this.mod.subch.asset]
    }
  },
  methods: require('./methods')

}
</script>
