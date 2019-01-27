/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ServiceCodec.ts                                          |
|                                                          |
| ServiceCodec for TypeScript.                             |
|                                                          |
| LastModified: Jan 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags, ByteStream, Writer, Reader, ValueReader } from '@hprose/io';
import { ServiceContext } from './ServiceContext';
import { MethodLike } from './Method';

export interface ServiceCodec {
    encode(result: any, context: ServiceContext): Uint8Array;
    decode(request: Uint8Array, context: ServiceContext): [string, any[]];
}

export class DefaultServiceCodec {
    public static instance: ServiceCodec = new DefaultServiceCodec();
    public debug: boolean = false;
    public simple: boolean = false;
    public utc: boolean = false;
    public longType: 'number' | 'bigint' | 'string' = 'number';
    public dictType: 'object' | 'map' = 'object';
    public nullType: undefined | null = undefined;
    public encode(result: any, context: ServiceContext): Uint8Array {
        const stream = new ByteStream();
        const writer = new Writer(stream, this.simple, this.utc);
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
            writer.serialize(this.debug ? result.stack ? result.stack : result.message : result.message);
        } else {
            stream.writeByte(Tags.TagResult);
            writer.serialize(result);
        }
        stream.writeByte(Tags.TagEnd);
        return stream.takeBytes();
    }
    private decodeMethod(fullname: string, context: ServiceContext): MethodLike {
        const service = context.service;
        const method: MethodLike | undefined = service.get(fullname);
        if (method === undefined) {
            throw new Error('Can\'t find this function ' + fullname + '().');
        }
        context.method = method;
        return method;
    }
    private decodeArguments(method: MethodLike, reader: Reader, context: ServiceContext): any[] {
        const stream = reader.stream;
        const tag = stream.readByte();
        let args: any[] = [];
        if (tag === Tags.TagList) {
            reader.reset();
            const count = ValueReader.readCount(stream);
            let paramTypes = method.paramTypes;
            if (paramTypes === undefined) {
                paramTypes = new Array(count).fill(this.nullType);
            } else {
                paramTypes.length = count;
                for (let i = 0; i < count; ++i) {
                    if (paramTypes[i] === undefined) {
                        paramTypes[i] = this.nullType;
                    }
                }
            }
            args = new Array(count);
            reader.addReference(args);
            reader.longType = this.longType;
            reader.dictType = this.dictType;
            for (let i = 0; i < count; ++i) {
                args[i] = reader.deserialize(paramTypes[i]);
            }
            stream.readByte();
        }
        if (method.passContext) args.push(context);
        return args;
    }
    public decode(request: Uint8Array, context: ServiceContext): [string, any[]] {
        const stream = new ByteStream(request);
        const reader = new Reader(stream, false);
        if (request.length === 0) {
            this.decodeMethod('~', context);
            return ['~', []];
        }
        reader.longType = this.longType;
        reader.dictType = this.dictType;
        let tag = stream.readByte();
        if (tag === Tags.TagHeader) {
            const headers = reader.deserialize(this.nullType);
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
                this.decodeMethod('~', context);
                return ['~', []];
            default:
                throw new Error('Invalid request:\r\n' + stream.toString());
        }
    }
}