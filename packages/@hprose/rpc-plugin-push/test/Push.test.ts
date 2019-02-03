import * as http from 'http';
import { Context, Service, Client } from '@hprose/rpc-core';
import '@hprose/rpc-node';
import { Log } from '@hprose/rpc-plugin-log';
import { Broker, Prosumer, BrokerContext } from '../src/index';

test('test push', async() => {
    const service = new Broker(new Service()).service;
    service.use(Log.ioHandler);
    const server = http.createServer();
    service.bind(server);
    server.listen(8081);
    const client1 = new Client('http://127.0.0.1:8081/');
    // (client1.codec as any).simple = true;
    // client1.use(Log.invokeHandler);
    const prosumer1 = new Prosumer(client1, '1');
    const client2 = new Client('http://127.0.0.1:8081/');
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
    const r1 = prosumer2.push('hello', 'test', '1');
    const r2 = prosumer2.push('hello', 'test', '1');
    const r3 = prosumer2.push('world', 'test2', '1');
    const r4 = prosumer2.push('world', 'test2', '1');
    await Promise.all([r1, r2, r3, r4]);
    await new Promise((resolve, reject) => {
        setTimeout(async () => {
            await prosumer1.unsubscribe('test');
            await prosumer2.unsubscribe('test');
            await prosumer1.unsubscribe('test2');
            await prosumer2.unsubscribe('test2');
            server.close();
            resolve();
        }, 100);
    });
});

test('test server push', async() => {
    function hello(name: string, context: Context): string {
        const cxt = context as BrokerContext;
        cxt.producer.push('hello', 'test');
        return 'hello ' + name;
    }
    const service = new Service();
    // service.use(Log.ioHandler);
    const broker = new Broker(service);
    service.add({method: hello, fullname: 'hello', passContext: true});
    const server = http.createServer();
    service.bind(server);
    server.listen(8082);
    const client = new Client('http://127.0.0.1:8082/');
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
