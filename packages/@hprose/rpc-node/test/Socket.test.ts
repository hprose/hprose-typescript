import * as net from 'net';
import { Context, NextInvokeHandler, Service, Client } from '@hprose/rpc-core';
import '../src/index';

test('test hello world rpc', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.addFunction(hello);
    const server = net.createServer();
    service.bind(server);
    server.listen(8412);
    const client = new Client('tcp://127.0.0.1');
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
    const server = net.createServer();
    service.bind(server);
    server.listen(8413);
    const client = new Client('tcp://127.0.0.1:8413');
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
    const server = net.createServer();
    service.bind(server);
    server.listen(8414);
    const client = new Client('tcp://127.0.0.1:8414');
    const proxy = await client.useServiceAsync();
    try {
        await proxy.hello('world');
    }
    catch (e) {
        expect(e).toEqual(new Error('connection closed'));
    }
    server.close();
});