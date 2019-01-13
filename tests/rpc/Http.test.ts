import * as http from 'http';
import { HttpService } from '../../src/rpc/node/HttpService';
import { HttpClient } from '../../src/rpc/node/HttpClient';
import { Context } from '../../src/rpc/Context';
import { NextInvokeHandler } from '../../src/rpc/HandlerManager';
import { PushService, PushServiceContext } from '../../src/rpc/PushService';
import { PushClient } from '../../src/rpc/PushClient';
// import { ByteStream } from '../../src/hprose.io';

test('test hello world rpc', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new HttpService();
    service.addFunction(hello);
    const server = http.createServer(service.httpHandler);
    server.listen(8080);
    const client = new HttpClient('http://127.0.0.1:8080/');
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    server.close();
});

test('test headers', async () => {
    const clientHandler = async (fullname: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        context.requestHeaders['ping'] = true;
        const result = await next(fullname, args, context);
        expect(context.responseHeaders['pong']).toBe(true);
        return result;
    };
    const serviceHandler = async (fullname: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        expect(context.requestHeaders['ping']).toBe(true);
        const result = await next(fullname, args, context);
        context.responseHeaders['pong'] = true;
        return result;
    };
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new HttpService();
    service.addFunction(hello);
    service.use(serviceHandler);
    const server = http.createServer(service.httpHandler);
    server.listen(8080);
    const client = new HttpClient('http://127.0.0.1:8080/');
    client.use(clientHandler);
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    server.close();
});

test('test push', async() => {
    // const logHandler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
    //     console.log(ByteStream.toString(request));
    //     const response = await next(request, context);
    //     console.log(ByteStream.toString(response));
    //     return response;
    // };
    const service = new HttpService();
    service.use(new PushService(service).handler);
    // service.use(logHandler);
    const server = http.createServer(service.httpHandler);
    server.listen(8080);
    const client1 = new HttpClient('http://127.0.0.1:8080/');
    // client1.use(logHandler);
    const pushClient1 = new PushClient(client1, '1');
    const client2 = new HttpClient('http://127.0.0.1:8080/');
    // client2.use(logHandler);
    const pushClient2 = new PushClient(client2, '2');
    await pushClient1.subscribe('test', (message) => {
        // console.log(message);
        expect(message.from).toBe('2');
        expect(message.data).toBe('hello');
    });
    await pushClient1.subscribe('test2', (message) => {
        // console.log(message);
        expect(message.from).toBe('2');
        expect(message.data).toBe('world');
    });
    const r1 = pushClient2.push('hello', 'test', '1');
    const r2 = pushClient2.push('hello', 'test', '1');
    const r3 = pushClient2.push('world', 'test2', '1');
    const r4 = pushClient2.push('world', 'test2', '1');
    await Promise.all([r1, r2, r3, r4]);
    await new Promise((resolve, reject) => {
        setTimeout(async () => {
            await pushClient1.unsubscribe('test');
            server.close();
            resolve();
        }, 100);
    });
});

test('test server push', async() => {
    function hello(name: string, context: Context): string {
        const cxt = context as PushServiceContext;
        cxt.clients.push('hello', 'test');
        return 'hello ' + name;
    }
    const service = new HttpService();
    service.use(new PushService(service).handler);
    service.add({method: hello, fullname: 'hello', passContext: true});
    const server = http.createServer(service.httpHandler);
    server.listen(8080);
    const client = new HttpClient('http://127.0.0.1:8080/');
    const pushClient = new PushClient(client, '1');
    await pushClient.subscribe('test', (message) => {
        // console.log(message);
        expect(message.from).toBe('');
        expect(message.data).toBe('hello');
    });
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    await new Promise((resolve, reject) => {
        setTimeout(async () => {
            server.close();
            resolve();
        }, 100);
    });
});