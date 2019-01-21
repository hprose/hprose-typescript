import * as http from 'http';
import { Service, HttpListener, Client, JsonRpcServiceCodec, JsonRpcClientCodec } from '../../src/hprose.node';
// import { HttpListener, Service, Client, JsonRpcServiceCodec, JsonRpcClientCodec, ByteStream, Context, NextIOHandler } from '../../src/hprose.node';

test('test jsonrpc rpc', async () => {
    // const logHandler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
    //     console.log(ByteStream.toString(request));
    //     const response = await next(request, context);
    //     console.log(ByteStream.toString(response));
    //     return response;
    // };
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.codec = JsonRpcServiceCodec.instance;
    service.addFunction(hello);
    // service.use(logHandler);
    const server = http.createServer();
    const listener = new HttpListener(service, server);
    listener.crossDomain = true;
    server.listen(8088);
    const client = new Client('http://127.0.0.1:8088/');
    client.codec = JsonRpcClientCodec.instance;
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    server.close();
});
