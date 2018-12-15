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
| hprose/io/serializers/GuidSerializer.ts                  |
|                                                          |
| hprose Guid serializer for TypeScript.                   |
|                                                          |
| LastModified: Dec 15, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import WriterInterface from './WriterInterface';
import ReferenceSerializer from './ReferenceSerializer';
import { Guid } from 'guid-typescript';

export default class GuidSerializer extends ReferenceSerializer<Guid> {
    public write(writer: WriterInterface, value: Guid): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagGuid);
        stream.writeByte(Tags.TagOpenbrace);
        stream.writeAsciiString(value.toString());
        stream.writeByte(Tags.TagClosebrace);
    }
}