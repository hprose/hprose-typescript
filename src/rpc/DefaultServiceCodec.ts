/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/DefaultServiceCodec.ts                        |
|                                                          |
| Default ServiceCodec for TypeScript.                     |
|                                                          |
| LastModified: Jan 13, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags, ByteStream, Writer, Reader, ValueReader } from '../hprose.io';
import { ServiceContext } from './ServiceContext';
import { ServiceCodec } from './ServiceCodec';
import { MethodLike } from './Method';

export class DefaultServiceCodec implements ServiceCodec {
    public static instance: ServiceCodec = new DefaultServiceCodec();
    public encode(result: any, context: ServiceContext): Uint8Array {
        const stream = new ByteStream();
        const writer = new Writer(stream, context.simple, context.utc);
        const headers = context.responseHeaders;
        let size = 0;
        for (const _ in headers) { size++; }
        if (size > 0) {
            stream.writeByte(Tags.TagHeader);
            writer.serialize(headers);
            writer.reset();
        }
        if (result instanceof Error) {
            stream.writeByte(Tags.TagError);
            writer.serialize(context.debug ? result.stack ? result.stack : result.message : result.message);
        } else {
            stream.writeByte(Tags.TagResult);
            writer.serialize(result);
        }
        stream.writeByte(Tags.TagEnd);
        return stream.takeBytes();
    }
    private decodeMethod(fullname: string, context: ServiceContext): MethodLike {
        const service = context.service;
        const methods = service.methods;
        const method: MethodLike | undefined = (fullname in methods) ? methods[fullname] : methods['*'];
        if (method === undefined) {
            throw new Error('Can\'t find this function ' + fullname + '().');
        }
        if (method.debug !== undefined) context.debug = method.debug;
        if (method.simple !== undefined) context.simple = method.simple;
        if (method.utc !== undefined) context.utc = method.utc;
        context.missing = !!method.missing;
        context.method = method.method;
        context.obj = method.obj;
        return method;
    }
    private decodeArguments(method: MethodLike, reader: Reader, context: ServiceContext): any[] {
        const service = context.service;
        const stream = reader.stream;
        const tag = stream.readByte();
        let args: any[] = [];
        if (tag === Tags.TagList) {
            reader.reset();
            const count = ValueReader.readCount(stream);
            let paramTypes = method.paramTypes;
            if (paramTypes === undefined) {
                paramTypes = new Array(count).fill(service.nullType);
            } else {
                paramTypes.length = count;
                for (let i = 0; i < count; ++i) {
                    if (paramTypes[i] === undefined) {
                        paramTypes[i] = service.nullType;
                    }
                }
            }
            args = new Array(count);
            reader.addReference(args);
            reader.longType = (method.longType === undefined) ? service.longType : method.longType;
            reader.dictType = (method.dictType === undefined) ? service.dictType : method.dictType;
            for (let i = 0; i < count; ++i) {
                args[i] = reader.deserialize(paramTypes[i]);
            }
            stream.readByte();
        }
        if (method.passContext) args.push(context);
        return args;
    }
    public decode(request: Uint8Array, context: ServiceContext): [string, any[]] {
        const service = context.service;
        const stream = new ByteStream(request);
        const reader = new Reader(stream, false);
        if (request.length === 0) {
            return ['~', this.decodeMethod('~', context).passContext ? [context] : []];
        }
        reader.longType = service.longType;
        reader.dictType = service.dictType;
        let tag = stream.readByte();
        if (tag === Tags.TagHeader) {
            const headers = reader.deserialize(service.nullType);
            for (const name in headers) {
                context.requestHeaders[name] = headers[name];
            }
            reader.reset();
            tag = stream.readByte();
        }
        switch (tag) {
            case Tags.TagCall:
                const fullname = reader.deserialize(String);
                const args = this.decodeArguments(this.decodeMethod(fullname, context), reader, context);
                return [fullname, args];
            case Tags.TagEnd:
                return ['~', this.decodeMethod('~', context).passContext ? [context] : []];
            default:
                throw new Error('Wrong Response:\r\n' + stream.toString());
        }
    }
}