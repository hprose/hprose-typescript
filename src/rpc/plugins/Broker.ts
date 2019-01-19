/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/plugins/Broker.ts                             |
|                                                          |
| hprose Broker for TypeScript.                            |
|                                                          |
| LastModified: Jan 15, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Service } from '../Service';
import { Deferred, defer } from '../Deferred';
import { Context } from '../Context';
import { Method } from '../Method';
import { ServiceContext } from '../ServiceContext';
import { TimeoutError } from '../TimeoutError';
import { Message } from './Message';
import { NextInvokeHandler } from '../HandlerManager';

export interface Producer {
    unicast(data: any, topic: string, id: string): boolean;
    multicast(data: any, topic: string, id: string[]): { [id: string]: boolean };
    broadcast(data: any, topic: string): { [id: string]: boolean };
    push(data: any, topic: string, id?: string | string[]): boolean | { [id: string]: boolean };
    deny(id?: string, topic?: string): void;
    exist(topic: string, id?: string): boolean;
    idlist(topic: string): string[];
}

export interface BrokerContext extends Context {
    producer: Producer;
}

export class Broker {
    protected messages: { [id: string]: { [topic: string]: Message[] | null } } = Object.create(null);
    protected responders: { [id: string]: Deferred<any> } = Object.create(null);
    protected timers: { [id: string]: Deferred<void> } = Object.create(null);
    public messageQueueMaxLength: number = 10;
    public timeout: number = 120000;
    public heartbeat: number = 10000;
    public onsubscribe?: (id: string, topic: string, context: Context) => void;
    public onunsubscribe?: (id: string, topic: string, messages: any[], context: Context) => void;
    constructor(public service: Service) {
        const subscribe = new Method(this.subscribe, '+', this, [String]);
        subscribe.passContext = true;
        this.service.add(subscribe);

        const unsubscribe = new Method(this.unsubscribe, '-', this, [String]);
        unsubscribe.passContext = true;
        this.service.add(unsubscribe);

        const message = new Method(this.message, '<', this);
        message.passContext = true;
        this.service.add(message);

        const unicast = new Method(this.unicast, '>', this, [this.service.nullType, String, String, String]);
        this.service.add(unicast);

        const multicast = new Method(this.multicast, '>?', this, [this.service.nullType, String, Array, String]);
        this.service.add(multicast);

        const broadcast = new Method(this.broadcast, '>*', this, [this.service.nullType, String, String]);
        this.service.add(broadcast);

        const exist = new Method(this.exist, '?', this, [String, String]);
        this.service.add(exist);

        const idlist = new Method(this.idlist, '|', this, [String]);
        this.service.add(idlist);
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
                    let timer = this.timers[id];
                    if (timer) timer.resolve();
                    timer = defer();
                    const timeoutId = setTimeout(() => {
                        timer.reject(new TimeoutError('timeout'));
                    }, this.heartbeat);
                    timer.promise.then(() => {
                        clearTimeout(timeoutId);
                    }, (reason) => {
                        clearTimeout(timeoutId);
                        if (reason instanceof TimeoutError && this.messages[id]) {
                            for (const topic in this.messages[id]) {
                                const context = new ServiceContext(this.service);
                                context.requestHeaders['id'] = id;
                                this.unsubscribe(topic, context);
                            }
                        }
                    });
                    this.timers[id] = timer;
                }
            } else {
                return false;
            }
        } else {
            responder.resolve();
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
    protected subscribe(topic: string, context: Context): boolean {
        const id = this.id(context);
        if (this.messages[id] === undefined) {
            this.messages[id] = Object.create(null);
        }
        if (!Array.isArray(this.messages[id][topic])) {
            this.messages[id][topic] = [];
            if (this.onsubscribe) {
                this.onsubscribe(id, topic, context);
            }
            return true;
        }
        return false;
    }
    protected unsubscribe(topic: string, context: Context): boolean {
        const id = this.id(context);
        if (this.messages[id]) {
            const messages = this.messages[id][topic];
            if (Array.isArray(messages)) {
                delete this.messages[id][topic];
                if (this.onunsubscribe) {
                    this.onunsubscribe(id, topic, messages, context);
                }
                this.response(id);
                return true;
            }
        }
        return false;
    }
    protected async message(context: Context): Promise<any> {
        const id = this.id(context);
        if (this.responders[id]) {
            const responder = this.responders[id];
            delete this.responders[id];
            responder.resolve();
        }
        if (this.timers[id]) {
            const timer = this.timers[id];
            delete this.timers[id];
            timer.resolve();
        }
        const responder = defer<any>();
        if (!this.send(id, responder)) {
            if (this.timeout > 0) {
                const timeoutId = setTimeout(() => {
                    responder.resolve(Object.create(null));
                }, this.timeout);
                responder.promise.then(() => {
                    clearTimeout(timeoutId);
                });
            }
            this.responders[id] = responder;
        }
        return responder.promise;
    }
    protected id(context: Context): string {
        if (context.requestHeaders['id']) {
            return context.requestHeaders['id'].toString();
        }
        throw new Error('client unique id not found');
    }
    public unicast(data: any, topic: string, id: string, from: string = ''): boolean {
        let result = false;
        if (this.messages[id]) {
            const messages = this.messages[id][topic];
            if (messages) {
                if (messages.length < this.messageQueueMaxLength) {
                    messages.push({ from, data });
                    result = true;
                }
            }
            this.response(id);
        }
        return result;
    }
    public multicast(data: any, topic: string, id: string[], from: string = ''): { [id: string]: boolean } {
        const result: { [id: string]: boolean } = Object.create(null);
        for (let i = 0; i < id.length; ++i) {
            result[id[i]] = this.unicast(data, topic, id[i], from);
        }
        return result;
    }
    public broadcast(data: any, topic: string, from: string = ''): { [id: string]: boolean } {
        const result: { [id: string]: boolean } = Object.create(null);
        for (const id in this.messages) {
            const messages = this.messages[id][topic];
            if (messages) {
                if (messages.length < this.messageQueueMaxLength) {
                    messages.push({ from, data });
                    result[id] = true;
                } else {
                    result[id] = false;
                }
            }
            this.response(id);
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
    public exist(topic: string, id: string): boolean {
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
    public handler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
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
            unicast: (data, topic, id) => this.unicast(data, topic, id, from),
            multicast: (data, topic, id) => this.multicast(data, topic, id, from),
            broadcast: (data, topic) => this.broadcast(data, topic, from),
            push: (data, topic, id?) => this.push(data, topic, id, from),
            deny: (id = from, topic?) => this.deny(id, topic),
            exist: (topic, id = from) => this.exist(topic, id),
            idlist: (topic) => this.idlist(topic)
        };
        context.producer = producer;
        return next(name, args, context);
    }
}