/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ClientCodec.ts                                           |
|                                                          |
| ClientCodec for TypeScript.                              |
|                                                          |
| LastModified: Jan 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags, ByteStream, Writer, Reader } from '@hprose/io';
import { ClientContext } from './ClientContext';

export interface ClientCodec {
    encode(name: string, args: any[], context: ClientContext): Uint8Array;
    decode(response: Uint8Array, context: ClientContext): any;
}
export class DefaultClientCodec {
    public static instance: ClientCodec = new DefaultClientCodec();
    public simple: boolean = false;
    public utc: boolean = false;
    public longType: 'number' | 'bigint' | 'string' = 'number';
    public dictType: 'object' | 'map' = 'object';
    public encode(name: string, args: any[], context: ClientContext): Uint8Array {
        const stream = new ByteStream();
        const writer = new Writer(stream, this.simple, this.utc);
        const headers = context.requestHeaders;
        if (this.simple) {
            headers.simple = true;
        }
        let size = 0;
        for (const _ in headers) { size++; }
        if (size > 0) {
            stream.writeByte(Tags.TagHeader);
            writer.serialize(headers);
            writer.reset();
        }
        stream.writeByte(Tags.TagCall);
        writer.serialize(name);
        if (args.length > 0) {
            writer.reset();
            writer.serialize(args);
        }
        stream.writeByte(Tags.TagEnd);
        return stream.takeBytes();
    }
    public decode(response: Uint8Array, context: ClientContext): any {
        const stream = new ByteStream(response);
        let reader = new Reader(stream, false);
        reader.longType = this.longType;
        reader.dictType = this.dictType;
        let tag = stream.readByte();
        if (tag === Tags.TagHeader) {
            const headers = reader.deserialize();
            for (const name in headers) {
                context.responseHeaders[name] = headers[name];
            }
            reader.reset();
            tag = stream.readByte();
        }
        switch (tag) {
            case Tags.TagResult:
                if (context.responseHeaders.simple) {
                    reader = new Reader(stream, true);
                }
                return reader.deserialize(context.type);
            case Tags.TagError:
                throw new Error(reader.deserialize(String));
            case Tags.TagEnd:
                return context.type === null ? null : undefined;
            default:
                throw new Error('Invalid response:\r\n' + stream.toString());
        }
    }
}