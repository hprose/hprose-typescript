import WebSocket from 'ws';
import { Context, NextInvokeHandler, Service, Client, ClientContext, ServiceContext } from '@hprose/rpc-core';
import '../src/index';

test('test hello world rpc', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.addFunction(hello);
    const server = new WebSocket.Server({ port: 8087 });
    service.bind(server);
    service.websocket.compress = true;
    const client = new Client('ws://127.0.0.1:8087/');
    client.websocket.compress = true;
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
    const service = new Service();
    service.addFunction(hello);
    service.use(serviceHandler);
    const server = new WebSocket.Server({ port: 8088 });
    service.bind(server);
    const client = new Client('ws://127.0.0.1:8088/');
    client.use(clientHandler);
    const proxy = await client.useServiceAsync();
    const context = new ClientContext();
    const result = await proxy.hello('world', context);
    expect(result).toBe('hello world');
    expect(context.responseHeaders.pong).toBe(true);
    server.close();
});

test('test maxRequestLength', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.maxRequestLength = 10;
    service.addFunction(hello);
    const server = new WebSocket.Server({ port: 8089 });
    service.bind(server);
    const client = new Client('ws://127.0.0.1:8089/');
    const proxy = await client.useServiceAsync();
    try {
        await proxy.hello('world');
    }
    catch (e) {
        expect(e.message).toEqual('1006');
    }
    server.close();
});

test('test ipaddress', async () => {
    function hello(name: string, context: ServiceContext): string {
        console.log(context.remoteAddress.address + ':' + context.remoteAddress.port);
        return 'hello ' + name;
    }
    const service = new Service();
    service.add({ method: hello, fullname: 'hello', passContext: true });
    const server = new WebSocket.Server({ port: 8090 });
    service.bind(server);
    service.websocket.compress = true;
    const client = new Client('ws://127.0.0.1:8090/');
    client.websocket.compress = true;
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    await proxy.hello('world 1');
    await client.abort();
    await proxy.hello('world 2');
    await proxy.hello('world 3');
    server.close();
});