/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Prosumer.ts                                              |
|                                                          |
| Prosumer for TypeScript.                                 |
|                                                          |
| LastModified: Feb 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client } from '@hprose/rpc-core';
import { Message } from './Message';

export class Prosumer {
    private readonly callbacks: { [topic: string]: (message: Message) => void } = Object.create(null);
    public onerror?: (error: Error) => void;
    public onsubscribe?: (topic: string) => void;
    public onunsubscribe?: (topic: string) => void;
    constructor(public readonly client: Client, id?: string) {
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
    private async dispatch(topics: { [topic: string]: Message[] }): Promise<void> {
        for (const topic in topics) {
            const callback = this.callbacks[topic];
            if (callback) {
                const messages = topics[topic];
                if (messages) {
                    for (let i = 0, n = messages.length; i < n; ++i) {
                        setTimeout(() => {
                            try {
                                callback(messages[i]);
                            }
                            catch(e) {
                                if (this.onerror) {
                                    this.onerror(e);
                                }
                            }
                        }, 0);
                    }
                } else {
                    delete this.callbacks[topic];
                    if (this.onunsubscribe) {
                        this.onunsubscribe(topic);
                    }
                }
            }
        }
    }
    private async message(): Promise<void> {
        while(true) {
            try {
                const topics: { [topic: string]: Message[] } | undefined = await this.client.invoke('<');
                if (!topics) return;
                this.dispatch(topics);
            }
            catch (e) {
                if (this.onerror) {
                    this.onerror(e);
                }
            }
        }
    }
    public async subscribe(topic: string, callback: (message: Message) => void): Promise<boolean> {
        if (this.id) {
            this.callbacks[topic] = callback;
            const result: boolean = await this.client.invoke('+', [topic], Boolean);
            this.message();
            if (this.onsubscribe) {
                this.onsubscribe(topic);
            }
            return result;
        }
        return false;
    }
    public async unsubscribe(topic: string): Promise<boolean> {
        if (this.id) {
            const result: boolean = await this.client.invoke('-', [topic], Boolean);
            delete this.callbacks[topic];
            if (this.onunsubscribe) {
                this.onunsubscribe(topic);
            }
            return result;
        }
        return false;
    }
    public unicast(data: any, topic: string, id: string): Promise<boolean> {
        return this.client.invoke('>', [data, topic, id], Boolean);
    }
    public multicast(data: any, topic: string, ids: string[]): Promise<{ [id: string]: boolean }> {
        return this.client.invoke('>?', [data, topic, ids]);
    }
    public broadcast(data: any, topic: string): Promise<{ [id: string]: boolean }> {
        return this.client.invoke('>*', [data, topic]);
    }
    public push(data: any, topic: string, id?: string | string[]): Promise<boolean | { [id: string]: boolean }> {
        switch (typeof id) {
            case 'undefined': return this.broadcast(data, topic);
            case 'string': return this.unicast(data, topic, id);
            default: return this.multicast(data, topic, id);
        }
    }
    public exists(topic: string, id: string = this.id): Promise<boolean> {
        return this.client.invoke('?', [topic, id], Boolean);
    }
    public idlist(topic: string): Promise<string[]> {
        return this.client.invoke('|', [topic], Array);
    }
}