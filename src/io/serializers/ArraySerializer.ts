/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/serializers/ArraySerializer.ts                 |
|                                                          |
| hprose array serializer for TypeScript.                  |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';

export class ArraySerializer extends ReferenceSerializer<ArrayLike<any>> {
    public write(writer: Writer, value: ArrayLike<any>): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagList);
        const n = value.length;
        if (n > 0) stream.writeAsciiString('' + n);
        stream.writeByte(Tags.TagOpenbrace);
        for (let i = 0; i < n; i++) {
            writer.serialize(value[i]);
        }
        stream.writeByte(Tags.TagClosebrace);
    }
}