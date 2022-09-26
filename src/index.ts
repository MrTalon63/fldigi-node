import xmlRpc from "xmlrpc";

class flDigi {
	private client: xmlRpc.Client;
	private host: string;
	private port: number;

	public receive: { (data: string): void; } | undefined;
	public receiveInterval: any;
	public receiveRate = 1000;
	public txCheckRate = 1000;

	constructor(host = "localhost", port = 7362) {
		this.host = host;
		this.port = port;
		this.client = xmlRpc.createClient({ host: this.host, port: this.port });
	}

	async xmlRpcPromise(method: string, args: any[] = []): Promise<string> {
		return new Promise((resolve, reject) => {
			this.client.methodCall(method, args, (err, result) => {
				if (err) throw err;
				try {
					const msg = result.toString();
					resolve(msg);
				} catch (error) {
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

	async textAddTx(content: string) {
		return this.xmlRpcPromise('text.add_tx', [content]);
	}
	
	async txGetData() {
		return this.xmlRpcPromise('tx.get_data');
	}
	
	async getModems() {
		return this.xmlRpcPromise('modem.get_names');
	}
	
	async setModem(modem: string) {
		return this.xmlRpcPromise('modem.set_by_name', [modem]);
	}
	
	async setCarrier(carrier: number) {
		return this.xmlRpcPromise('modem.set_carrier', [carrier]);
	}

	async waitForTxComplete() {
		return new Promise((resolve, reject) => {
		  	const bytesTransmitted = (cb: { (err: Object, dataLength: number): void; }) => {
				this.client.methodCall('tx.get_data', [], function(err, lastData) {
			  		cb(err, lastData.length);
				});
		  	};
	
		  	const checkForData = () => {
				bytesTransmitted((err, bytes) => {
			  		if (bytes > 0) {
						setTimeout(checkForData, this.txCheckRate);
					} else {
						resolve(true);
					}
				});
		  	};
	
		  	setTimeout(checkForData, this.txCheckRate);

		});
	}

	async transmit(content: string) {
		try {
			await this.mainTx();
			await this.textAddTx(content);
			await this.waitForTxComplete();
			await this.mainRx();
	
		} catch (e) {
			throw e;
		}
	
		return true;
	}
}

export default flDigi;