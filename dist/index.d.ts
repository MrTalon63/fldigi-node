declare class flDigi {
    private client;
    private host;
    private port;
    receive: {
        (data: string): void;
    } | undefined;
    receiveInterval: any;
    receiveRate: number;
    txCheckRate: number;
    constructor(host?: string, port?: number);
    xmlRpcPromise(method: string, args?: any[]): Promise<string>;
    startReceiveInterval(): void;
    stopReceiveInterval(): void;
    mainTx(): Promise<string>;
    mainRx(): Promise<string>;
    textAddTx(content: string): Promise<string>;
    txGetData(): Promise<string>;
    getModems(): Promise<string>;
    setModem(modem: string): Promise<string>;
    setCarrier(carrier: number): Promise<string>;
    waitForTxComplete(): Promise<unknown>;
    transmit(content: string): Promise<boolean>;
}
export default flDigi;
