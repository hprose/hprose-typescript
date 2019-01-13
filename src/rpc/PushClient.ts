/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: http://www.hprose.com/                 |
|                   http://www.hprose.org/                 |
|                                                          |
\*________________________________________________________*/
/*--------------------------------------------------------*\
|                                                          |
| hprose/rpc/PushClient.ts                                 |
|                                                          |
| hprose PushClient for TypeScript.                        |
|                                                          |
| LastModified: Jan 13, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client } from './Client';
import { Message } from './Message';
import { PushMethodName } from './PushMethodName';

export class PushClient {
    private callbacks: { [topic: string]: (message: Message) => void | undefined } = Object.create(null);
    public onerror?: (error: Error) => void;
    constructor(public client: Client, id?: string) {
        if (id) this.id = id;
    }
    public get id(): string {
        if (this.client.requestHeaders['id']) {
            return this.client.requestHeaders['id'].toString();
        }
        throw new Error('client unique id not found');
    }
    public set id(value: string) {
        this.client.requestHeaders['id'] = value;
    }
    private async message(): Promise<void> {
        do {
            try {
                const result: { [topic: string]: Message[] } | undefined = await this.client.invoke(PushMethodName.message, [], { dictType: 'object', type: undefined });
                if (!result) return;
                setTimeout(() => {
                    for (const topic in result) {
                        const callback = this.callbacks[topic];
                        if (callback) {
                            const messages = result[topic];
                            for (let i = 0, n = messages.length; i < n; ++i) {
                                callback(messages[i]);
                            }
                        }
                    }
                }, 0);
            }
            catch(e) {
                if (this.onerror) {
                    this.onerror(e);
                }
            }
        } while(true);
    }
    public async subscribe(topic: string, callback: (message: Message) => void): Promise<boolean> {
        this.callbacks[topic] = callback;
        const result: boolean = await this.client.invoke(PushMethodName.subscribe, [topic], { type: Boolean });
        this.message();
        return result;
    }
    public unsubscribe(topic: string): Promise<boolean> {
        delete this.callbacks[topic];
        return this.client.invoke(PushMethodName.unsubscribe, [topic], { type: Boolean });
    }
    public unicast(data: any, topic: string, id: string): Promise<boolean> {
        return this.client.invoke(PushMethodName.unicast, [data, topic, id], { type: Boolean });
    }
    public multicast(data: any, topic: string, id: string[]): Promise<{ [id: string]: boolean }> {
        return this.client.invoke(PushMethodName.multicast, [data, topic, id], { dictType: 'object' });
    }
    public broadcast(data: any, topic: string):  Promise<{ [id: string]: boolean }> {
        return this.client.invoke(PushMethodName.broadcast, [data, topic], { dictType: 'object' });
    }
    public push(data: any, topic: string, id?: string | string[]): Promise<boolean | { [id: string]: boolean }>  {
        switch (typeof id) {
            case 'undefined': return this.broadcast(data, topic);
            case 'string': return this.unicast(data, topic, id);
            default: return this.multicast(data, topic, id);
        }
    }
    public exist(topic: string, id: string): Promise<boolean> {
        return this.client.invoke(PushMethodName.exist, [topic, id], { type: Boolean });
    }
    public idlist(topic: string): Promise<string[]> {
        return this.client.invoke(PushMethodName.idlist, [topic], { type: Array });
    }
}