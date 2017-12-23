
l=console.log

render = r=>{
  l('Rendering ',r)

  if(r.alert) notyf.alert(r.alert)
  if(r.confirm) notyf.confirm(r.confirm)

  Object.assign(app, r)
}


W.onready(()=>{
  W('load').then(render)

  if(localStorage.auth_code){
    // only node users expect updates
    setInterval(function(){
      W('load').then(render)
    }, 1000)
  }

  notyf = new Notyf({delay:4000})


  var methods = {
    hljs: hljs.highlight,

    ivoted:(voters)=>{
      return voters.find(v=>v.id == app.record.id)
    },

    call: function(method, args){
      if(method == 'vote'){
        args.rationale = prompt("Why?")
        if(!args.rationale) return false
      }


      W(method, args).then(render)
      return false
    },
    settle: ()=>{
      var total = app.outs.reduce((k,v)=>k+parseFloat(v.amount.length==0 ? '0' : v.amount), 0)

      if(confirm("Total outputs: "+total+". Do you want to broadcast your transaction?")){
        app.call('settleUser', {
          assetType: 0,
          ins: app.ins,
          outs: app.outs
        })
      }
    },
    derive: f=>{
      var data = {
        username: inputUsername.value, 
        password: inputPassword.value
      }


      W('load', data).then(render)
      return false
    },

    go: (path)=>{
      if(path==''){
        history.pushState("/", null, '/');
      }else{
        location.hash = "#"+path
      }
      app.tab = path
    },

    commy: (b,dot=true)=>{

      b = b.toString()
      if(dot){
        if(b.length==1){
          b='0.0'+b
        }else if(b.length==2){
          b='0.'+b
        }else{
          var insert_dot_at = b.length - 2
          b = b.slice(0,insert_dot_at) + '.' + b.slice(insert_dot_at)
        }
      }
      return b.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    },
    uncommy: str=>{
      if(str.indexOf('.') == -1) str += '.00'

      return parseInt(str.replace(/[^0-9]/g,''))
    },

    timeAgo: (time)=>{
      var units = [
        { name: "second", limit: 60, in_seconds: 1 },
        { name: "minute", limit: 3600, in_seconds: 60 },
        { name: "hour", limit: 86400, in_seconds: 3600  },
        { name: "day", limit: 604800, in_seconds: 86400 },
        { name: "week", limit: 2629743, in_seconds: 604800  },
        { name: "month", limit: 31556926, in_seconds: 2629743 },
        { name: "year", limit: null, in_seconds: 31556926 }
      ];
      var diff = (new Date() - new Date(time*1000)) / 1000;
      if (diff < 5) return "now";
      
      var i = 0, unit;
      while (unit = units[i++]) {
        if (diff < unit.limit || !unit.limit){
          var diff =  Math.floor(diff / unit.in_seconds);
          return diff + " " + unit.name + (diff>1 ? "s" : "") + " ago";
        }
      };
    },

    faucet: a=>{

    }

  }



  app = new Vue({
    el: '#app',
    data(){ return {
      auth_code: localStorage.auth_code,
      assetType: 'FSD',

      pubkey: false,
      K: false,
      my_member: false,

      pw: 'password',
      username: 'root',
      location: '128.199.242.161:8000',

      channels: {},

      record: false,

      tab: location.hash.substr(1),

      install_snippet: false,

      ins: [],
      outs: [{to:'', amount:''}],

      off_to: '1',
      off_amount: '1.00',



      proposal: ['Mint $1000 FSD to 1@1',`await me.mint(0, 1, 1, 100000)`,'']

    } },
    methods: methods,
    template: `
<div>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark mb-4">
    <a class="navbar-brand" href="#">Failsafe</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>


    <div class="collapse navbar-collapse" id="navbarCollapse">
      <ul class="navbar-nav mr-auto">

        <li class="nav-item" v-bind:class="{ active: tab=='' }">
          <a class="nav-link" @click="go('')">Wallet</a>
        </li>

        <li class="nav-item" v-bind:class="{ active: tab=='network' }">
          <a class="nav-link" @click="go('network')">Network</a>
        </li>

        <li class="nav-item"  v-bind:class="{ active: tab=='install' }">
          <a class="nav-link" @click="go('install')">Install</a>
        </li>

        <li class="nav-item"  v-bind:class="{ active: tab=='exchange' }">
          <a class="nav-link" @click="go('exchange')">Exchange</a>
        </li>

        <li class="nav-item"  v-bind:class="{ active: tab=='gov' }">
          <a class="nav-link" @click="go('gov')">Governance</a>
        </li>

        <li class="nav-item"  v-bind:class="{ active: tab=='wiki' }">
          <a class="nav-link" @click="go('wiki')">Wiki</a>
        </li>

        <li class="nav-item"  v-bind:class="{ active: tab=='names' }">
          <a class="nav-link" @click="go('names')">Names</a>
        </li>



      </ul>


      <button type="button" class="btn btn-info" @click="call('sync')">Sync (Height {{K.total_blocks}}, {{timeAgo(K.ts)}})</button>
  &nbsp;     <button v-if="pubkey" type="button" class="btn btn-danger" @click="call('logout')">Log Out</button>

    </div>
  </nav>


  <div class="container">


    <div v-if="tab==''">
      <p v-if="false">Current asset: <select v-model="assetType">
        <option v-for="asset in K.assets" v-bind:value="asset.ticker">
         {{asset.ticker}} ({{ asset.name }})
        </option>
      </select></p>

      <template v-if="pubkey">
        <h5>Hello, <b>{{username}}</b>! Your ID is <b>{{record ? record.id : pubkey}}</b></h5>

        <div v-if="is_hub">
          You're a hub.
        </div>
        <div v-else>
            
          <p class="lead">Send and receive money privately:</p>  
            <h1 style="display:inline-block">Balance: \${{commy(ch.total)}}</h1><small v-if="ch.total>0">= {{commy(ch.collateral)}} (collateral) {{ch.delta > 0 ? "+ "+commy(ch.delta) : "- "+commy(-ch.delta)}} (delta)</small> 
          <p>


          <div v-if="ch.total>0 || ch.collateral > 0">

            <div class="progress" style="max-width:1000px">
              <div class="progress-bar" v-bind:style="{ width: Math.round(ch.failsafe*100/(ch.delta<0?ch.collateral:ch.total))+'%', 'background-color':'#5cb85c'}" role="progressbar">
                {{commy(ch.failsafe)}} (secured)
              </div>
              <div v-if="ch.delta<0" v-bind:style="{ width: Math.round(-ch.delta*100/ch.collateral)+'%', 'background-color':'#5bc0de'}"  class="progress-bar progress-bar-striped" role="progressbar">
                {{commy(ch.delta)}} (spent)
              </div>
              <div v-if="ch.delta>0" v-bind:style="{ width: Math.round(ch.delta*100/ch.total)+'%', 'background-color':'#f0ad4e'}"   class="progress-bar"  role="progressbar">
                +{{commy(ch.delta)}} (risky)
              </div>
            </div>

            <br>

            <p>
              <input style="width:800px" type="text" class="form-control small-input" v-model="off_to" placeholder="ID">
              <input style="width:200px" type="number" class="form-control small-input" v-model="off_amount" placeholder="Amount">
            </p>

            <button type="button" class="btn btn-success" @click="call('send', {off_to, off_amount})">Instant Send</button>\
            <button type="button" class="btn btn-warning" @click="call('requestCollateral')">Request Collateral</button>\
            <button type="button" class="btn btn-danger" @click="call('takeEverything')">Take Everything</button>\

        </div>

      </div>





        <template v-if="record">
        <br><br><br>

          <hr style="margin-left: 0;text-align: left;width: 80%;" />


          <p class="lead">Or settle globally (slow, expensive, but more secure):</p>

          <p>Global balance: <b>\${{commy(record.balance)}}</b></p>
          <small>Currently there's only one hub <b>@1</b>. So to deposit to someone's channel with hub use their_ID@1</small>

          <p v-for="out in outs">
            <input style="width:800px" type="text" class="form-control small-input" v-model="out.to" placeholder="ID or ID@hub">
            <input style="width:200px" type="number" class="form-control small-input" v-model="out.amount" placeholder="Amount">
          </p>
       
          <p>
          <button type="button" class="btn btn-success" @click="outs.push({to:'',amount: ''})">Add output</button>
          <button type="button" class="btn btn-warning" @click="settle()">Settle Globally</button>
          </p>





        </template>

      </template>


      <form v-else class="form-signin" v-on:submit.prevent="call('load',{username, pw, location})">

        <label for="inputUsername" class="sr-only">Username</label>
        <input v-model="username" type="text" id="inputUsername" class="form-control" placeholder="Username" required autofocus>
        <br>

        <p>Make sure your password is unique, strong and don't forget it, otherwise access to your account is lost. If in doubt, write it down or email it to yourself. </p>

        <label for="inputPassword" class="sr-only">Password</label>
        <input v-model="pw" type="password" id="inputPassword" class="form-control" placeholder="Password" required>

        <p>There's no password recovery procedure because FN is decentralized and no one can generate your private key without your password.
        </p>

        <template v-if="!K">
          <p>No members found. Would you like to start private fs? Enter your IP:</p>
          <input v-model="location" type="text" id="inputLocation" class="form-control"><br>
        </template>


        <button class="btn btn-lg btn-primary btn-block" id="login" type="submit">Log In</button>
      </form>

    </div>

    <div v-else-if="tab=='network'">

      <h1>Board of Members</h1>
      <p v-for="m in K.members">{{m.username}} ({{m.location}}) <b v-if="m.hubId">[hub]</b> - <b>{{m.shares}} shares</b></p>


      <h2>Current network settings</h2>
      <p>Blocktime: {{K.blocktime}} seconds</p>
      <p>Blocksize: {{K.blocksize}} bytes</p>
      <p>Account creation fee (pubkey registration): \${{commy(K.account_creation_fee)}}</p>

      <p>Average onchain fee: \${{commy(K.tax_per_byte * 83)}} (to short ID) – {{commy(K.tax_per_byte * 115)}} (to pubkey)</p>

      <h2>Hubs & topology</h2>
      <p>Soft risk limit: \${{commy(K.members[0].hub.soft_limit)}}</p>
      <p>Hard risk limit: \${{commy(K.members[0].hub.hard_limit)}}</p>


      <h2>Network stats</h2>
      <p>Total blocks: {{K.total_blocks}}</p>
      <p>Of which usable blocks: {{K.total_blocks}}</p>
      <p>Last block received {{timeAgo(K.ts)}}</p>
      
      <p>Network created {{timeAgo(K.created_at)}}</p>

      <p>FSD Market Cap \${{ commy(K.assets[0].total_supply) }}</p>
      <p>FSB Market Cap \${{ commy(K.assets[1].total_supply) }}</p>

      <p>Transactions: {{K.total_tx}}</p>
      <p>Tx bytes: {{K.total_tx_bytes}}</p>


      <h2>Governance stats</h2>

      <p>Proposals created: {{K.proposals_created}}</p>



    </div>

    <div v-else-if="tab=='install'">
        <h3>Currently only macOS/Linux are supported</h3>
      <p>1. This is a Developer Preview. In the future one command will be enough, but right now the process is quite manual. First, make sure you have Node.js installed: run <b>brew install node</b> in console if not.</p>
      <p>2. Then install required npm modules: <b>npm i tar tweetnacl sequelize ws sqlite3 finalhandler serve-static rlp bn.js keccak scrypt</b></p>
      <p>3. Compare this snippet with other sources, and if there's exact match paste into Terminal.app: </p>
      <p><b>{{install_snippet}}</b></p>
    </div>

    <div v-else-if="tab=='exchange'">
      <h3>Deposit / Withdraw / Exchange</h3>
      <p>Very soon you will be able to deposit and withdraw to your wallet with major payment methods (such as credit cards, wire transfers and Bitcoin) right here, on this page. However, on testnet, use this complimentary faucet for free money (it does some mining):</p>

      <button class="btn btn-success" @click="faucet">Give me a dollar!</button>
    </div>


    <div v-else-if="tab=='gov'">
      <h3>Governance</h3>
      <div class="form-group">
        <label for="comment">Description:</label>
        <textarea class="form-control" v-model="proposal[0]" rows="2" id="comment"></textarea>
      </div>

      <div class="form-group">
        <label for="comment">Code to execute (optional):</label>
        <textarea class="form-control" v-model="proposal[1]" rows="2" id="comment"></textarea>
      </div>

      <div class="form-group">
        <label for="comment">Path to .patch (optional):</label>
        <input class="form-control" v-model="proposal[2]" placeholder="after.patch" rows="2" id="comment"></input>
        <small>1. Prepare two directories <b>rm -rf before after && cp -r 1 before && cp -r before after</b>
        <br>2. Edit code in "after", test it, then <b>diff -Naur before after > after.patch</b></small>
      </div>

      <p><button @click="call('propose', proposal)" class="btn btn-warning">Propose</button></p>



      <div v-for="p in proposals">
        <h4>#{{p.id}}: {{p.desc}}</h4>
        <small>Proposed by {{p.user.username}}</small>

        <pre><code class="javascript hljs" v-html="hljs('javascript',p.code).value"></code></pre>

        <div v-if="p.patch">
          <hr>
          <pre style="line-height:15px; font-size:12px;"><code class="diff hljs"  v-html="hljs('diff',p.patch).value"></code></pre>
        </div>

        <p v-for="u in p.voters">
          <b>{{u.vote.approval ? 'Approved' : 'Denied'}}</b> by {{u.username}}: {{u.vote.rationale ? u.vote.rationale : '(no rationale)'}}
        </p>

        <small>To be executed in {{p.delayed - K.usable_blocks}} blocks</small>
        <div v-if="record">
          <p v-if="!ivoted(p.voters)">
            <button @click="call('vote', {approve: true, id: p.id})" class="btn btn-success">Approve</button>
            <button @click="call('vote', {approve: false, id: p.id})" class="btn btn-danger">Deny</button>
          </p>

        </div>

      </div>


    </div>

    <div v-else-if="tab=='wiki'">
      <h3>Wiki</h3>
      <p><a href="https://github.com/failsafenetwork/failsafe">Currently here</a></p>
    </div>


    <div v-else-if="tab=='names'">
      <h3>Failsafe Names </h3>
      <p>By the end of 2018 you will be able to register a domain name and local DNS resolver will seamlessly load "name.fs" in the browser</p>
    </div>

  </div>
</div>
` 
   })



})

/*

<p id="decentText"></p>
<canvas id="decentChart"></canvas>
*/







