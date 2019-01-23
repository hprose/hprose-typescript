import * as http from 'http';
import WebSocket from 'ws';
import { Context, NextInvokeHandler, Service, Client } from '@hprose/rpc-core';
import '../src/index';

test('test hello world rpc', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.addFunction(hello);
    const server = http.createServer();
    const wsserver = new WebSocket.Server({server});
    service.bind(wsserver);
    server.listen(8087);
    const client = new Client('ws://127.0.0.1:8087/');
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
    const server = http.createServer();
    const wsserver = new WebSocket.Server({server});
    service.bind(wsserver);
    server.listen(8088);
    const client = new Client('ws://127.0.0.1:8088/');
    client.use(clientHandler);
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    server.close();
});

test('test maxRequestLength', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.maxRequestLength = 10;
    service.addFunction(hello);
    const server = http.createServer();
    const wsserver = new WebSocket.Server({server});
    service.bind(wsserver);
    server.listen(8089);
    const client = new Client('ws://127.0.0.1:8089/');
    const proxy = await client.useServiceAsync();
    try {
        await proxy.hello('world');
    }
    catch (e) {
        expect(e).toEqual(new Error('1006'));
    }
    server.close();
});