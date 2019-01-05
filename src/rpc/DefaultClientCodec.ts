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
| hprose/rpc/DefaultClientCodec.ts                         |
|                                                          |
| Default ClientCodec for TypeScript.                      |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags, ByteStream, Writer, Reader } from '../hprose.io';
import { ClientContext } from './ClientContext';
import { ClientCodec } from './ClientCodec';

export class DefaultClientCodec implements ClientCodec {
    public static instance: ClientCodec = new DefaultClientCodec();
    public encode(name: string, args: any[], context: ClientContext): Uint8Array {
        const stream = new ByteStream();
        const writer = new Writer(stream, context.simple, context.utc);
        const headers = context.headers;
        let size = 0;
        for (const _ in headers) { size++; }
        if (size > 0) {
            stream.writeByte(Tags.TagHeader);
            writer.write(headers);
        }
        stream.writeByte(Tags.TagCall);
        writer.write(name);
        if (args.length > 0) {
            writer.write(args);
        }
        stream.writeByte(Tags.TagEnd);
        return stream.takeBytes();
    }
    public decode(response: Uint8Array, context: ClientContext): any {
        const stream = new ByteStream(response);
        const reader = new Reader(stream, false);
        reader.longType = context.longType;
        reader.dictType = context.dictType;
        let tag = stream.readByte();
        if (tag === Tags.TagHeader) {
            const headers = reader.deserialize();
            for (const name in headers) {
                 context.headers[name] = headers[name];
            }
            tag = stream.readByte();
        }
        switch (tag) {
            case Tags.TagResult:
                return reader.deserialize(context.type);
            case Tags.TagError:
                throw new Error(reader.deserialize(String));
            case Tags.TagEnd:
                return context.type === null ? null : undefined;
            default:
                throw new Error('Wrong Response:\r\n' + stream.toString());
        }
    }
}