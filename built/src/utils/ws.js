// home baked ws client that auto reconnects
var normalws = require('ws');
function WebSocketClient() {
    this.number = 0; // Message number
    this.autoReconnectInterval = 10 * 1000; // ms
}
WebSocketClient.prototype.open = function (url) {
    var _this = this;
    this.url = url;
    this.instance = new normalws(this.url);
    this.instance._req.on('socket', function (socket) {
        socket.on('secureConnect', function () {
            // TODO: cert pinning to prevent rogue CA
            // C5:DA:46:F0:99:75:03:D5:D9:0C:30:56:91:58:85:09:16:0B:7A:73
            // if (socket.getPeerCertificate().fingerprint !== validFingerprint) ws.close();
        });
    });
    this.instance.on('open', function () {
        _this.onopen();
    });
    this.instance.on('message', function (data, flags) {
        _this.number++;
        _this.onmessage(data, flags, _this.number);
    });
    this.instance.on('close', function (e) {
        switch (e) {
            case 1000: // CLOSE_NORMAL
                console.log('WebSocket: closed');
                break;
            default:
                // Abnormal closure
                _this.reconnect(e);
                break;
        }
        _this.onclose(e);
    });
    this.instance.on('error', function (e) {
        switch (e.code) {
            case 'ECONNREFUSED':
                _this.reconnect(e);
                break;
            default:
                _this.onerror(e);
                break;
        }
    });
};
WebSocketClient.prototype.send = function (data) {
    var _this = this;
    if (this.instance && this.instance.readyState != 1) {
        //l("Socket is not ready")
        return false;
    }
    setTimeout(function () {
        try {
            //var port = this.url.split(':')[2]
            //l('I SEND ' + data.length + ' TO ' + port)
            _this.instance.send(data, wscb);
            return true;
        }
        catch (e) {
            l('Failed to send ws:', e);
            return false;
            //this.instance.emit('error', e)
        }
    }, 1);
};
WebSocketClient.prototype.reconnect = function (e) {
    // console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`);
    this.instance.removeAllListeners();
    var that = this;
    setTimeout(function () {
        that.open(that.url);
    }, this.autoReconnectInterval);
};
WebSocketClient.prototype.onopen = function (e) {
    console.log('WebSocketClient: open', arguments);
};
WebSocketClient.prototype.onmessage = function (data, flags, number) {
    // console.log("WebSocketClient: message",arguments);
};
WebSocketClient.prototype.onerror = function (e) {
    console.log('WS error  ', e);
};
WebSocketClient.prototype.onclose = function (e) {
    // console.log('WebSocketClient: closed', arguments)
};
module.exports = WebSocketClient;
