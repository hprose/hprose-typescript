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
| hprose/io/serializers/SetSerializer.ts                   |
|                                                          |
| hprose Set serializer for TypeScript.                    |
|                                                          |
| LastModified: Dec 12, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReferenceSerializer from './ReferenceSerializer';
import WriterInterface from './WriterInterface';

export default class SetSerializer extends ReferenceSerializer<Set<any>> {
    public write(writer: WriterInterface, value: Set<any>): void {
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