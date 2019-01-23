import * as http from 'http';
import { Service, Client } from '@hprose/rpc-core';
import '@hprose/rpc-node';
import { Caller, Provider } from '../src/index';

test('test reverse RPC', async () => {
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
    const caller = new Caller(service);
    service.use(caller.handler);
    // service.use(logHandler);
    const server = http.createServer();
    service.bind(server);
    server.listen(8080);

    const client = new Client('http://127.0.0.1:8080/');
    const provider = new Provider(client, '1');
    provider.addFunction(hello);
    provider.boot();

    interface Hello {
        hello(name: string): Promise<string>;
    }
    const proxy = caller.useService<Hello>('1');
    const result1 = proxy.hello('world1');
    const result2 = proxy.hello('world2');
    const result3 = proxy.hello('world3');

    const [r1, r2, r3] = await Promise.all([result1, result2, result3]);
    expect(r1).toEqual('hello world1');
    expect(r2).toEqual('hello world2');
    expect(r3).toEqual('hello world3');
    server.close();

});