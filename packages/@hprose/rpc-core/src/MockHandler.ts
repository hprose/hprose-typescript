/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| MockHandler.ts                                           |
|                                                          |
| MockHandler for TypeScript.                              |
|                                                          |
| LastModified: Feb 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ServiceContext } from './ServiceContext';
import { Service, Handler } from './Service';
import { MockAgent } from './MockAgent';

export interface MockServiceContext extends ServiceContext {
    readonly handler: MockHandler;
}

export class MockServer {
    public handler!: (address: string, request: Uint8Array) => Promise<Uint8Array>;
    constructor(public readonly address: string) {}
    public listen() {
        MockAgent.register(this.address, this.handler);
    }
    public close() {
        MockAgent.unregister(this.address);
    }
}

export class MockHandler implements Handler {
    constructor(public readonly service: Service) {}
    public bind(server: MockServer): void {
        server.handler = this.handler;
    }
    public handler = async (address: string, request: Uint8Array): Promise<Uint8Array> => {
        if (request.length > this.service.maxRequestLength) {
            throw new Error('Request entity too large');
        }
        const context = new ServiceContext(this.service);
        context.family = 'mock';
        context.address = address;
        context.port = 0;
        context.handler = this;
        return this.service.handle(request, context);
    }
}

Service.register('mock', MockHandler, [MockServer]);

export interface Service {
    mock: MockHandler;
}
