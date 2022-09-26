"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xmlrpc_1 = __importDefault(require("xmlrpc"));
class flDigi {
    client;
    host;
    port;
    receive;
    receiveInterval;
    receiveRate = 1000;
    txCheckRate = 1000;
    constructor(host = "localhost", port = 7362) {
        this.host = host;
        this.port = port;
        this.client = xmlrpc_1.default.createClient({ host: this.host, port: this.port });
    }
    async xmlRpcPromise(method, args = []) {
        return new Promise((resolve, reject) => {
            this.client.methodCall(method, args, (err, result) => {
                if (err)
                    throw err;
                try {
                    const msg = result.toString();
                    resolve(msg);
                }
                catch (error) {
                    throw new Error("Result is not a string");
                }
            });
        });
    }
    startReceiveInterval() {
        this.receiveInterval = setInterval(() => {
            const getDataPromise = this.xmlRpcPromise('rx.get_data');
            getDataPromise.then((data) => {
                if (data.length > 0 && this.receive !== undefined) {
                    this.receive(data);
                }
            });
        }, this.receiveRate);
    }
    stopReceiveInterval() {
        clearInterval(this.receiveInterval);
    }
    async mainTx() {
        const prom = await this.xmlRpcPromise('main.tx');
        this.stopReceiveInterval();
        return prom;
    }
    async mainRx() {
        const prom = await this.xmlRpcPromise('main.rx');
        this.startReceiveInterval();
        return prom;
    }
    async textAddTx(content) {
        return this.xmlRpcPromise('text.add_tx', [content]);
    }
    async txGetData() {
        return this.xmlRpcPromise('tx.get_data');
    }
    async getModems() {
        return this.xmlRpcPromise('modem.get_names');
    }
    async setModem(modem) {
        return this.xmlRpcPromise('modem.set_by_name', [modem]);
    }
    async setCarrier(carrier) {
        return this.xmlRpcPromise('modem.set_carrier', [carrier]);
    }
    async waitForTxComplete() {
        return new Promise((resolve, reject) => {
            const bytesTransmitted = (cb) => {
                this.client.methodCall('tx.get_data', [], function (err, lastData) {
                    cb(err, lastData.length);
                });
            };
            const checkForData = () => {
                bytesTransmitted((err, bytes) => {
                    if (bytes > 0) {
                        setTimeout(checkForData, this.txCheckRate);
                    }
                    else {
                        resolve(true);
                    }
                });
            };
            setTimeout(checkForData, this.txCheckRate);
        });
    }
    async transmit(content) {
        try {
            await this.mainTx();
            await this.textAddTx(content);
            await this.waitForTxComplete();
            await this.mainRx();
        }
        catch (e) {
            throw e;
        }
        return true;
    }
}
exports.default = flDigi;
