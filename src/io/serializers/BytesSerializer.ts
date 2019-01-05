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
| hprose/io/serializers/BytesSerializer.ts                 |
|                                                          |
| hprose bytes serializer for TypeScript.                  |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ByteStream } from '../ByteStream';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';

export class BytesSerializer extends ReferenceSerializer<ArrayBuffer | Uint8Array | Uint8ClampedArray | ByteStream> {
    public write(writer: Writer, value: ArrayBuffer | Uint8Array | Uint8ClampedArray | ByteStream): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagBytes);
        const n = (value instanceof ArrayBuffer) ? value.byteLength : value.length;
        if (n > 0) stream.writeAsciiString('' + n);
        stream.writeByte(Tags.TagQuote);
        stream.write(value);
        stream.writeByte(Tags.TagQuote);
    }
}
