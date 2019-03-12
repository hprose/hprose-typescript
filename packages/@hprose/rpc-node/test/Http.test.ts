import * as http from 'http';
// import { Context, NextInvokeHandler, Service, Client, ClientContext, ServiceContext } from '@hprose/rpc-core';
import { Context, NextInvokeHandler, Service, Client, ClientContext } from '@hprose/rpc-core';
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
    const context = new ClientContext();
    const result = await proxy.hello('world', context);
    expect(result).toBe('hello world');
    expect(context.responseHeaders.pong).toBe(true);
    server.close();
});
/*
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

test('test ipaddress', async () => {
    function hello(name: string, context: ServiceContext): string {
        console.log(context.address + ':' + context.port);
        return 'hello ' + name;
    }
    const service = new Service();
    service.add({method: hello, fullname: 'hello', passContext: true});
    const server = http.createServer();
    service.bind(server);
    server.listen(8003);
    const client = new Client('http://127.0.0.1:8003/');
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    await proxy.hello('world 1');
    await client.abort();
    await proxy.hello('world 2');
    await proxy.hello('world 3');
    server.close();
});
*/