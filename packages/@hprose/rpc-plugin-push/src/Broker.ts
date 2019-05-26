/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Broker.ts                                                |
|                                                          |
| Broker for TypeScript.                                   |
|                                                          |
| LastModified: Mar 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, Deferred, Service, Method, defer, ServiceContext, NextInvokeHandler } from '@hprose/rpc-core';
import { Message } from './Message';

export interface Producer {
    readonly from: string;
    unicast(data: any, topic: string, id: string): boolean;
    multicast(data: any, topic: string, id: string[]): { [id: string]: boolean };
    broadcast(data: any, topic: string): { [id: string]: boolean };
    push(data: any, topic: string, id?: string | string[]): boolean | { [id: string]: boolean };
    deny(id?: string, topic?: string): void;
    exists(topic: string, id?: string): boolean;
    idlist(topic: string): string[];
}

export interface BrokerContext extends Context {
    producer: Producer;
}

export class Broker {
    protected messages: { [id: string]: { [topic: string]: Message[] | null } } = Object.create(null);
    protected responders: { [id: string]: Deferred<any> } = Object.create(null);
    protected timers: { [id: string]: Deferred<boolean> } = Object.create(null);
    public messageQueueMaxLength: number = 10;
    public timeout: number = 120000;
    public heartbeat: number = 10000;
    public onsubscribe?: (id: string, topic: string, context: ServiceContext) => void;
    public onunsubscribe?: (id: string, topic: string, messages: any[] | null, context: ServiceContext) => void;
    constructor(public readonly service: Service) {
        const subscribe = new Method(this.subscribe, '+', this, [String]);
        subscribe.passContext = true;
        const unsubscribe = new Method(this.unsubscribe, '-', this, [String]);
        unsubscribe.passContext = true;
        const message = new Method(this.message, '<', this);
        message.passContext = true;
        const unicast = new Method(this.unicast, '>', this, [undefined, String, String, String]);
        const multicast = new Method(this.multicast, '>?', this, [undefined, String, Array, String]);
        const broadcast = new Method(this.broadcast, '>*', this, [undefined, String, String]);
        const exists = new Method(this.exists, '?', this, [String, String]);
        const idlist = new Method(this.idlist, '|', this, [String]);
        this.service.add(subscribe)
                    .add(unsubscribe)
                    .add(message)
                    .add(unicast)
                    .add(multicast)
                    .add(broadcast)
                    .add(exists)
                    .add(idlist)
                    .use(this.handler)
    }
    protected send(id: string, responder: Deferred<any>): boolean {
        const topics = this.messages[id];
        if (topics) {
            const result = Object.create(null);
            let count = 0;
            let size = 0;
            for (const topic in topics) {
                ++size;
                const messages = topics[topic];
                if (messages === null || messages.length > 0) {
                    ++count;
                    result[topic] = messages;
                    if (messages === null) {
                        delete topics[topic];
                    } else {
                        topics[topic] = [];
                    }
                }
            }
            if (size === 0) {
                responder.resolve();
            } else if (count > 0) {
                responder.resolve(result);
                if (this.heartbeat > 0) {
                    let timer = defer<boolean>();
                    if (this.timers[id]) {
                        this.timers[id].resolve(false);
                    }
                    this.timers[id] = timer;
                    const timeoutId = setTimeout(() => {
                        timer.resolve(true);
                    }, this.heartbeat);
                    timer.promise.then((value) => {
                        clearTimeout(timeoutId);
                        const topics = this.messages[id];
                        if (value && topics) {
                            for (const topic in topics) {
                                this.offline(topics, id, topic, new ServiceContext(this.service));
                            }
                        }
                    });
                }
            } else {
                return false;
            }
        } else {
            responder.resolve();
        }
        return true;
    }
    protected id(context: ServiceContext): string {
        if (context.requestHeaders['id']) {
            return context.requestHeaders['id'].toString();
        }
        throw new Error('Client unique id not found');
    }
    protected subscribe(topic: string, context: ServiceContext): boolean {
        const id = this.id(context);
        if (this.messages[id] === undefined) {
            this.messages[id] = Object.create(null);
        }
        if (this.messages[id][topic]) {
            return false;
        }
        this.messages[id][topic] = [];
        if (this.onsubscribe) {
            this.onsubscribe(id, topic, context);
        }
        return true;
    }
    protected response(id: string): void {
        if (this.responders[id]) {
            const responder = this.responders[id];
            if (this.send(id, responder)) {
                delete this.responders[id];
            }
        }
    }
    protected offline(topics: { [topic: string]: Message[] | null }, id: string, topic: string, context: ServiceContext): boolean {
        if (topic in topics) {
            const messages = topics[topic];
            delete topics[topic];
            if (this.onunsubscribe) {
                this.onunsubscribe(id, topic, messages, context);
            }
            this.response(id);
            return true;
        }
        return false;
    }
    protected unsubscribe(topic: string, context: ServiceContext): boolean {
        const id = this.id(context);
        if (this.messages[id]) {
            return this.offline(this.messages[id], id, topic, context);
        }
        return false;
    }
    protected async message(context: ServiceContext): Promise<any> {
        const id = this.id(context);
        if (this.responders[id]) {
            const responder = this.responders[id];
            delete this.responders[id];
            responder.resolve();
        }
        if (this.timers[id]) {
            const timer = this.timers[id];
            delete this.timers[id];
            timer.resolve(false);
        }
        const responder = defer<any>();
        if (!this.send(id, responder)) {
            this.responders[id] = responder;
            if (this.timeout > 0) {
                const timeoutId = setTimeout(() => {
                    responder.resolve(Object.create(null));
                }, this.timeout);
                responder.promise.then(() => {
                    clearTimeout(timeoutId);
                });
            }
        }
        return responder.promise;
    }
    public unicast(data: any, topic: string, id: string, from: string = ''): boolean {
        if (this.messages[id]) {
            const messages = this.messages[id][topic];
            if (messages) {
                if (messages.length < this.messageQueueMaxLength) {
                    messages.push(new Message(data, from));
                    this.response(id);
                    return true;
                }
            }
        }
        return false;
    }
    public multicast(data: any, topic: string, ids: string[], from: string = ''): { [id: string]: boolean } {
        const result: { [id: string]: boolean } = Object.create(null);
        for (let i = 0; i < ids.length; ++i) {
            result[ids[i]] = this.unicast(data, topic, ids[i], from);
        }
        return result;
    }
    public broadcast(data: any, topic: string, from: string = ''): { [id: string]: boolean } {
        const result: { [id: string]: boolean } = Object.create(null);
        for (const id in this.messages) {
            const messages = this.messages[id][topic];
            if (messages) {
                if (messages.length < this.messageQueueMaxLength) {
                    messages.push(new Message(data, from));
                    this.response(id);
                    result[id] = true;
                } else {
                    result[id] = false;
                }
            }
        }
        return result;
    }
    public push(data: any, topic: string, id?: string | string[], from: string = ''): boolean | { [id: string]: boolean } {
        switch (typeof id) {
            case 'undefined': return this.broadcast(data, topic, from);
            case 'string': return this.unicast(data, topic, id, from);
            default: return this.multicast(data, topic, id, from);
        }
    }
    public deny(id: string, topic?: string): void {
        if (this.messages[id]) {
            if (topic) {
                if (Array.isArray(this.messages[id][topic])) {
                    this.messages[id][topic] = null;
                }
            } else {
                for (const topic in this.messages[id]) {
                    this.messages[id][topic] = null;
                }
            }
            this.response(id);
        }
    }
    public exists(topic: string, id: string): boolean {
        return (id in this.messages) && Array.isArray(this.messages[id][topic]);
    }
    public idlist(topic: string): string[] {
        const idlist: string[] = [];
        for (const id in this.messages) {
            if (this.messages[id][topic]) {
                idlist.push(id);
            }
        }
        return idlist;
    }
    protected handler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        const from = (context.requestHeaders['id']) ? context.requestHeaders['id'].toString() : '';
        switch(name) {
            case '>':
            case '>?':
                if (args.length === 3) args.push(from);
                break;
            case '>*':
                if (args.length === 2) args.push(from);
                break;
        }
        const producer: Producer = {
            from,
            unicast: (data, topic, id) => this.unicast(data, topic, id, from),
            multicast: (data, topic, ids) => this.multicast(data, topic, ids, from),
            broadcast: (data, topic) => this.broadcast(data, topic, from),
            push: (data, topic, id?) => this.push(data, topic, id, from),
            deny: (id = from, topic?) => this.deny(id, topic),
            exists: (topic, id = from) => this.exists(topic, id),
            idlist: (topic) => this.idlist(topic)
        };
        context.producer = producer;
        return next(name, args, context);
    }
}