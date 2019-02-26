/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| MockAgent.ts                                             |
|                                                          |
| MockAgent for TypeScript.                                |
|                                                          |
| LastModified: Feb 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export class MockAgent {
    private static handlers: { [name: string]: (address: string, request: Uint8Array) => Promise<Uint8Array> } = Object.create(null);
    public static register(address: string, handler: (address: string, request: Uint8Array) => Promise<Uint8Array>) {
        MockAgent.handlers[address] = handler;
    }
    public static unregister(address: string) {
        delete MockAgent.handlers[address];
    }
    public static async handler(address: string, request: Uint8Array): Promise<Uint8Array> {
        const handler = MockAgent.handlers[address];
        if (handler) {
            return handler(address, request);
        }
        throw new Error('Server is stopped');
    }
}