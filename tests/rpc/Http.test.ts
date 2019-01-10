import * as http from 'http';
import { HttpService } from '../../src/rpc/node/HttpService';
import { HttpClient } from '../../src/rpc/node/HttpClient';
import { Context } from '../../src/rpc/Context';
import { NextInvokeHandler } from '../../src/rpc/HandlerManager';

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