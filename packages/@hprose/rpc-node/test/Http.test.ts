import * as http from 'http';
import { Context, NextInvokeHandler, Service, Client } from '@hprose/rpc-core';
import '../src/index';

test('test hello world rpc', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.addFunction(hello);
    const server = http.createServer();
    service.bind(server);
    server.listen(8000);
    const client = new Client('http://127.0.0.1:8000/');
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    server.close();
});

test('test mssing method1', async () => {
    function missing(name: string, args: any[]): string {
        return name + JSON.stringify(args);
    }
    const service = new Service();
    service.addMissingMethod(missing);
    const server = http.createServer();
    service.bind(server);
    server.listen(8000);
    const client = new Client('http://127.0.0.1:8000/');
    const proxy = client.useService<any>();
    const result = await proxy.hello('world');
    expect(result).toBe('hello["world"]');
    server.close();
});

test('test mssing method2', async () => {
    function missing(name: string, args: any[], context: Context): string {
        return name + JSON.stringify(args) + context.request.socket.localPort;
    }
    const service = new Service();
    service.addMissingMethod(missing);
    const server = http.createServer();
    service.bind(server);
    server.listen(8000);
    const client = new Client('http://127.0.0.1:8000/');
    const proxy = client.useService<any>();
    const result = await proxy.hello('world');
    expect(result).toBe('hello["world"]8000');
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
    service.bind(server);
    server.listen(8001);
    const client = new Client('http://127.0.0.1:8001/');
    client.use(clientHandler);
    const proxy = await client.useServiceAsync();
    client.settings.hello = {
        returnContext: true
    };
    const result = await proxy.hello('world');
    expect(result.value).toBe('hello world');
    expect(result.context.responseHeaders.pong).toBe(true);
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
    service.bind(server);
    server.listen(8002);
    const client = new Client('http://127.0.0.1:8002/');
    const proxy = await client.useServiceAsync();
    try {
        await proxy.hello('world');
    }
    catch (e) {
        expect(e).toEqual(new Error('413:Request Entity Too Large'));
    }
    server.close();
});