import { Service, Client, MockServer } from '@hprose/rpc-core';
// import { Log } from '@hprose/rpc-plugin-log';
import { Caller, Provider } from '../src/index';

test('test reverse RPC', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    const caller = new Caller(service);
    // service.use(Log.ioHandler);
    const server = new MockServer('TestReverseRPC');
    service.bind(server);

    const client = new Client('mock://TestReverseRPC');
   // client.use(Log.invokeHandler);
    const provider = new Provider(client, '1');
    // provider.use(Log.invokeHandler);
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