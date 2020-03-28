import { Context, NextInvokeHandler, Service, Client, ClientContext, ServiceContext, MockServer } from '../src/index';

test('test hello world rpc', async () => {
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.addFunction(hello);
    const server = new MockServer('test');
    service.bind(server);
    const client = new Client('mock://test');
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
    const server = new MockServer('test1');
    service.bind(server);
    const client = new Client('mock://test1');
    const proxy = client.useService<any>();
    const result = await proxy.hello('world');
    expect(result).toBe('hello["world"]');
    const result2 = await proxy.hello.world();
    expect(result2).toBe('hello_world[]');
    const result3 = await proxy.how.are.you();
    expect(result3).toBe('how_are_you[]');
    const result4 = await proxy.how.do.you.do();
    expect(result4).toBe('how_do_you_do[]');
    server.close();
});

test('test mssing method2', async () => {
    function missing(name: string, args: any[], context: Context): string {
        return name + JSON.stringify(args) + context.remoteAddress.address;
    }
    const service = new Service();
    service.addMissingMethod(missing);
    const server = new MockServer('test2');
    service.bind(server);
    const client = new Client('mock://test2');
    const proxy = client.useService<any>();
    const result = await proxy.hello('world');
    expect(result).toBe('hello["world"]test2');
    const result2 = await proxy.hello.world();
    expect(result2).toBe('hello_world[]test2');
    const result3 = await proxy.how.are.you();
    expect(result3).toBe('how_are_you[]test2');
    const result4 = await proxy.how.do.you.do();
    expect(result4).toBe('how_do_you_do[]test2');
    server.close();
});

test('test headers', async () => {
    const serviceHandler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        if (name === 'hello') {
            expect(context.requestHeaders['ping']).toBe(true);
        }
        const result = await next(name, args, context);
        context.responseHeaders['pong'] = true;
        return result;
    };
    function hello(name: string): string {
        return 'hello ' + name;
    }
    const service = new Service();
    service.addFunction(hello);
    service.use(serviceHandler);
    const server = new MockServer('test3');
    service.bind(server);
    const client = new Client('mock://test3');
    const proxy = await client.useServiceAsync();
    const context = new ClientContext({ requestHeaders: { ping: true } });
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
    const server = new MockServer('test4');
    service.bind(server);
    const client = new Client('mock://test4');
    const proxy = await client.useServiceAsync();
    try {
        await proxy.hello('world');
    }
    catch (e) {
        expect(e).toEqual(new Error('Request entity too large'));
    }
    server.close();
});

test('test ipaddress', async () => {
    function hello(name: string, context: ServiceContext): string {
        console.log(context.remoteAddress.address + ':' + context.remoteAddress.port);
        return 'hello ' + name;
    }
    const service = new Service();
    service.add({ method: hello, passContext: true });
    const server = new MockServer('test5');
    service.bind(server);
    const client = new Client('mock://test5');
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    await proxy.hello('world 1');
    await client.abort();
    await proxy.hello('world 2');
    await proxy.hello('world 3');
    server.close();
});