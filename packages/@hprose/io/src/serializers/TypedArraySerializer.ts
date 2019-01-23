/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| TypedArraySerializer.ts                                  |
|                                                          |
| hprose typed array serializer for TypeScript.            |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '../ByteStream';
import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';

export class TypedArraySerializer extends ReferenceSerializer<ArrayLike<number>> {
    constructor (private readonly writeNumber: (stream: ByteStream, value: number) => void) { super(); }
    public write(writer: Writer, value: ArrayLike<number>): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagList);
        const n = value.length;
        if (n > 0) stream.writeAsciiString('' + n);
        stream.writeByte(Tags.TagOpenbrace);
        for (let i = 0; i < n; i++) {
            this.writeNumber(stream, value[i]);
        }
        stream.writeByte(Tags.TagClosebrace);
    }
}