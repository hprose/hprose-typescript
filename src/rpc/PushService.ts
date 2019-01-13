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
| hprose/rpc/PushService.ts                                |
|                                                          |
| hprose PushService for TypeScript.                       |
|                                                          |
| LastModified: Jan 13, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Service } from './Service';
import { Deferred, defer } from './Deferred';
import { Context } from './Context';
import { Method } from './Method';
import { ServiceContext } from './ServiceContext';
import { TimeoutError } from './TimeoutError';
import { Message } from './Message';
import { NextInvokeHandler } from './HandlerManager';
import { PushMethodName } from './PushMethodName';

export interface PushServiceContext extends Context {
    clients: {
        id(context: Context): string;
        deny(id: string, topic?: string): void;
        unicast(data: any, topic: string, id: string, context?: Context): boolean;
        multicast(data: any, topic: string, id: string[], context?: Context): { [id: string]: boolean };
        broadcast(data: any, topic: string, context?: Context): { [id: string]: boolean };
        push(message: any, topic: string, id?: string | string[]): void;
        exist(topic: string, id: string): boolean;
        idlist(topic: string): string[];
    };
}

export class PushService {
    protected messages: { [id: string]: { [topic: string]: Message[] | null } } = Object.create(null);
    protected responders: { [id: string]: Deferred<any> } = Object.create(null);
    protected timers: { [id: string]: Deferred<void> } = Object.create(null);
    public messageQueueMaxLength: number = 10;
    public timeout: number = 120000;
    public heartbeat: number = 10000;
    public onsubscribe?: (id: string, topic: string, context: Context) => void;
    public onunsubscribe?: (id: string, topic: string, messages: any[], context: Context) => void;
    private clients = {
        id: this.id.bind(this),
        deny: this.deny.bind(this),
        unicast: this.unicast.bind(this),
        multicast: this.multicast.bind(this),
        broadcast: this.broadcast.bind(this),
        push: this.push.bind(this),
        exist: this.exist.bind(this),
        idlist: this.idlist.bind(this),
    };
    constructor(public service: Service) {
        const subscribe = new Method(this.subscribe, PushMethodName.subscribe, this, [String]);
        subscribe.passContext = true;
        this.service.add(subscribe);

        const unsubscribe = new Method(this.unsubscribe, PushMethodName.unsubscribe, this, [String]);
        unsubscribe.passContext = true;
        this.service.add(unsubscribe);

        const message = new Method(this.message, PushMethodName.message, this);
        message.passContext = true;
        this.service.add(message);

        const unicast = new Method(this.unicast, PushMethodName.unicast, this, [this.service.nullType, String, String]);
        unicast.passContext = true;
        this.service.add(unicast);

        const multicast = new Method(this.multicast, PushMethodName.multicast, this, [this.service.nullType, String, Array]);
        multicast.passContext = true;
        this.service.add(multicast);

        const broadcast = new Method(this.broadcast, PushMethodName.broadcast, this, [this.service.nullType, String]);
        broadcast.passContext = true;
        this.service.add(broadcast);

        const exist = new Method(this.exist, PushMethodName.exist, this, [String, String]);
        this.service.add(exist);

        const idlist = new Method(this.idlist, PushMethodName.idlist, this, [String]);
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
                responder.resolve(undefined);
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
            responder.resolve(undefined);
        }
        return true;
    }
    protected response(id: string): void {
        if (this.responders[id]) {
            const responder = this.responders[id];
            delete this.responders[id];
            if (!this.send(id, responder)) {
                this.responders[id] = responder;
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
            responder.resolve(undefined);
        }
        if (this.timers[id]) {
            const timer = this.timers[id];
            delete this.timers[id];
            timer.resolve();
        }
        const responder = defer();
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
    public id(context: Context): string {
        if (context.requestHeaders['id']) {
            return context.requestHeaders['id'].toString();
        }
        throw new Error('client unique id not found');
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
    public unicast(data: any, topic: string, id: string, context?: Context): boolean {
        const from: string = context ? this.id(context) : '';
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
    public multicast(data: any, topic: string, id: string[], context?: Context): { [id: string]: boolean } {
        const result: { [id: string]: boolean } = Object.create(null);
        for (let i = 0; i < id.length; ++i) {
            result[id[i]] = this.unicast(data, topic, id[i], context);
        }
        return result;
    }
    public broadcast(data: any, topic: string, context?: Context): { [id: string]: boolean } {
        const from: string = context ? this.id(context) : '';
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
    public push(data: any, topic: string, id?: string | string[]): boolean | { [id: string]: boolean } {
        switch (typeof id) {
            case 'undefined': return this.broadcast(data, topic);
            case 'string': return this.unicast(data, topic, id);
            default: return this.multicast(data, topic, id);
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
        if (context.clients) {
            for (const method in this.clients) {
                context.clients[method] = (this.clients as any)[method];
            }
        } else {
            (context as PushServiceContext).clients = this.clients;
        }
        return next(name, args, context);
    }
}