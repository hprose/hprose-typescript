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
| hprose/rpc/Prosumer.ts                                   |
|                                                          |
| hprose Prosumer for TypeScript.                          |
|                                                          |
| LastModified: Jan 14, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client } from './Client';
import { Message } from './Message';

export class Prosumer {
    private callbacks: { [topic: string]: (message: Message) => void | undefined } = Object.create(null);
    public onerror?: (error: Error) => void;
    public onsubscribe?:(topic: string) => void;
    public onunsubscribe?:(topic: string) => void;
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
                const topics: { [topic: string]: Message[] } | undefined = await this.client.invoke('<', [], { dictType: 'object', type: undefined });
                if (!topics) return;
                setTimeout(() => {
                    for (const topic in topics) {
                        const callback = this.callbacks[topic];
                        if (callback) {
                            const messages = topics[topic];
                            if (messages) {
                                for (let i = 0, n = messages.length; i < n; ++i) {
                                    callback(messages[i]);
                                }
                            } else {
                                if (this.onunsubscribe) {
                                    this.onunsubscribe(topic);
                                }
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
        const result: boolean = await this.client.invoke('+', [topic], { type: Boolean });
        this.message();
        if (this.onsubscribe) {
            this.onsubscribe(topic);
        }
        return result;
    }
    public async unsubscribe(topic: string): Promise<boolean> {
        const result: boolean = await this.client.invoke('-', [topic], { type: Boolean });
        delete this.callbacks[topic];
        if (this.onunsubscribe) {
            this.onunsubscribe(topic);
        }
        return result;
    }
    public unicast(data: any, topic: string, id: string): Promise<boolean> {
        return this.client.invoke('>', [data, topic, id], { type: Boolean });
    }
    public multicast(data: any, topic: string, id: string[]): Promise<{ [id: string]: boolean }> {
        return this.client.invoke('>?', [data, topic, id], { dictType: 'object' });
    }
    public broadcast(data: any, topic: string):  Promise<{ [id: string]: boolean }> {
        return this.client.invoke('>*', [data, topic], { dictType: 'object' });
    }
    public push(data: any, topic: string, id?: string | string[]): Promise<boolean | { [id: string]: boolean }>  {
        switch (typeof id) {
            case 'undefined': return this.broadcast(data, topic);
            case 'string': return this.unicast(data, topic, id);
            default: return this.multicast(data, topic, id);
        }
    }
    public exist(topic: string, id: string): Promise<boolean> {
        return this.client.invoke('?', [topic, id], { type: Boolean });
    }
    public idlist(topic: string): Promise<string[]> {
        return this.client.invoke('|', [topic], { type: Array });
    }
}