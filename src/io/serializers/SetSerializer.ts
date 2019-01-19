/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/serializers/SetSerializer.ts                   |
|                                                          |
| hprose Set serializer for TypeScript.                    |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';

export class SetSerializer extends ReferenceSerializer<Set<any>> {
    public write(writer: Writer, value: Set<any>): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagList);
        const n = value.size;
        if (n > 0) stream.writeAsciiString('' + n);
        stream.writeByte(Tags.TagOpenbrace);
        value.forEach((v) => writer.serialize(v));
        stream.writeByte(Tags.TagClosebrace);
    }
}