import { Context, Service, Client, MockServer } from '@hprose/rpc-core';
import { Log } from '@hprose/rpc-plugin-log';
import { Broker, Prosumer, BrokerContext } from '../src/index';

test('test push', async() => {
    const service = new Broker(new Service()).service;
    service.use(Log.ioHandler);
    const server = new MockServer('testpush');
    service.bind(server);
    server.listen();
    const client1 = new Client('mock://testpush');
    // (client1.codec as any).simple = true;
    // client1.use(Log.invokeHandler);
    const prosumer1 = new Prosumer(client1, '1');
    const client2 = new Client('mock://testpush');
    // client2.use(Log.invokeHandler);
    const prosumer2 = new Prosumer(client2, '2');
    await prosumer1.subscribe('test', (message) => {
        // console.log(message);
        expect(message.from).toBe('2');
        expect(message.data).toBe('hello');
    });
    await prosumer1.subscribe('test2', (message) => {
        // console.log(message);
        expect(message.from).toBe('2');
        expect(message.data).toBe('world');
    });
    await prosumer1.subscribe('test3', (message) => {
        // console.log(message);
        expect(message.from).toBe('2');
        expect(message.data.message).toBe('error');
    });
    const r1 = prosumer2.push('hello', 'test', '1');
    const r2 = prosumer2.push('hello', 'test', '1');
    const r3 = prosumer2.push('world', 'test2', '1');
    const r4 = prosumer2.push('world', 'test2', '1');
    const r5 = prosumer2.push(new Error('error'), 'test3', '1');

    await Promise.all([r1, r2, r3, r4, r5]);
    await new Promise((resolve, reject) => {
        setTimeout(async () => {
            await prosumer1.unsubscribe('test');
            await prosumer1.unsubscribe('test2');
            await prosumer1.unsubscribe('test3');
            server.close();
            resolve();
        }, 10);
    });
});

test('test server push', async() => {
    function hello(name: string, context: Context): string {
        const cxt = context as BrokerContext;
        cxt.producer.push('hello', 'test');
        return 'hello ' + name;
    }
    const service = new Service();
    service.use(Log.ioHandler);
    const broker = new Broker(service);
    service.add({method: hello, fullname: 'hello', passContext: true});
    const server = new MockServer('testpush2');
    service.bind(server);
    server.listen();
    const client = new Client('mock://testpush2');
    const prosumer = new Prosumer(client, '1');
    prosumer.onsubscribe = (topic) => {
        // console.log(`${ topic } is subscribe.`);
        expect(topic).toBe('test');
    };
    prosumer.onunsubscribe = (topic) => {
        // console.log(`${ topic } is unsubscribe.`);
        expect(topic).toBe('test');
    };
    await prosumer.subscribe('test', (message) => {
        // console.log(message);
        expect(message.from).toBe('1');
        expect(message.data).toBe('hello');
    });
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    await broker.deny('1', 'test');
    await new Promise((resolve, reject) => {
        setTimeout(async () => {
            server.close();
            resolve();
        }, 100);
    });
});
