/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| MockManager.ts                                           |
|                                                          |
| MockManager for TypeScript.                              |
|                                                          |
| LastModified: Feb 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export class MockManager {
    private static handlers: { [name: string] : (address: string, request: Uint8Array) => Promise<Uint8Array> } = Object.create(null);
    public static register(address: string, handler: (address: string, request: Uint8Array) => Promise<Uint8Array>) {
        MockManager.handlers[address] = handler;
    }
    public static unregister(address: string) {
        delete MockManager.handlers[address];
    }
    public static async handler(address: string, request: Uint8Array): Promise<Uint8Array> {
        const handler = MockManager.handlers[address];
        if (handler) {
            return handler(address, request);
        }
        throw new Error('Server is stopped');
    }
}