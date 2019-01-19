import * as http from 'http';
import WebSocket from 'ws';
import { Context, NextInvokeHandler, Broker, Prosumer, BrokerContext, Caller, Provider, WebSocketService, WebSocketClient } from '../../src/hprose.node';

test('test hello world rpc on websocket', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new WebSocketService();
    service.onerror = (error) => {
        console.log(error);
    };
    service.addFunction(hello);
    const server = http.createServer(service.httpHandler);
    server.listen(8089);
    const wsserver = new WebSocket.Server({server});
    service.websocketHandler(wsserver);
    const client = new WebSocketClient('ws://127.0.0.1:8089');
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    wsserver.close();
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
    const service = new WebSocketService();
    service.addFunction(hello);
    service.use(serviceHandler);
    const server = http.createServer(service.httpHandler);
    server.listen(8089);
    const wsserver = new WebSocket.Server({server});
    service.websocketHandler(wsserver);
    const client = new WebSocketClient('http://127.0.0.1:8089');
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
    const service = new WebSocketService();
    service.use(new Broker(service).handler);
    // service.use(logHandler);
    const server = http.createServer(service.httpHandler);
    server.listen(8089);
    const wsserver = new WebSocket.Server({server});
    service.websocketHandler(wsserver);
    const client1 = new WebSocketClient('http://127.0.0.1:8089');
    // client1.use(logHandler);
    const prosumer1 = new Prosumer(client1, '1');
    const client2 = new WebSocketClient('http://127.0.0.1:8089');
    // client2.use(logHandler);
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
    const service = new WebSocketService();
    const broker = new Broker(service);
    service.use(broker.handler);
    service.add({method: hello, fullname: 'hello', passContext: true});
    const server = http.createServer(service.httpHandler);
    server.listen(8089);
    const wsserver = new WebSocket.Server({server});
    service.websocketHandler(wsserver);
    const client = new WebSocketClient('http://127.0.0.1:8089');
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

test('test maxRequestLength', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new WebSocketService();
    service.maxRequestLength = 10;
    service.addFunction(hello);
    const server = http.createServer(service.httpHandler);
    server.listen(8089);
    const wsserver = new WebSocket.Server({server});
    service.websocketHandler(wsserver);
    const client = new WebSocketClient('http://127.0.0.1:8089');
    const proxy = await client.useServiceAsync();
    try {
        await proxy.hello('world');
    }
    catch (e) {
        expect(e).toEqual(new Error('1006'));
    }
    server.close();
});

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
    const service = new WebSocketService();
    const caller = new Caller(service);
    service.use(caller.handler);
    // service.use(logHandler);
    const server = http.createServer(service.httpHandler);
    server.listen(8089);
    const wsserver = new WebSocket.Server({server});
    service.websocketHandler(wsserver);

    const client = new WebSocketClient('http://127.0.0.1:8089');
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
