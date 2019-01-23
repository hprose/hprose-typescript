import * as http from 'http';
import { Service, Client } from '@hprose/rpc-core';
import '@hprose/rpc-node';
// import { logIOHandler, logInvokeHandler } from '@hprose/rpc-plugin-log';
import { Caller, Provider } from '../src/index';

test('test reverse RPC', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    const caller = new Caller(service);
    service.use(caller.handler);
    // service.use(logIOHandler);
    const server = http.createServer();
    service.bind(server);
    server.listen(8083);

    const client = new Client('http://127.0.0.1:8083/');
    // client.use(logInvokeHandler);
    const provider = new Provider(client, '1');
    provider.addFunction(hello);
    provider.listen();

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
    await provider.close();
    server.close();
});