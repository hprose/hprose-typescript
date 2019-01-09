import * as http from 'http';
import { HttpService } from '../../src/rpc/node/HttpService';
import { HttpClient } from '../../src/rpc/node/HttpClient';

test('test boolean serialization', async () => {
    const service = new HttpService();
    service.addFunction((name: string): string => { return 'hello ' + name; }, 'hello', [String]);
    const server = http.createServer(service.httpHandler.bind(service));
    server.listen(8080);
    const client = new HttpClient('http://127.0.0.1:8080/');
    const proxy = await client.useServiceAsync();
    const result = await proxy.hello('world');
    expect(result).toBe('hello world');
    server.close();
});