/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| GuidSerializer.ts                                        |
|                                                          |
| hprose Guid serializer for TypeScript.                   |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';
import { Guid } from 'guid-typescript';

export class GuidSerializer extends ReferenceSerializer<Guid> {
    public write(writer: Writer, value: Guid): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagGuid);
        stream.writeByte(Tags.TagOpenbrace);
        stream.writeAsciiString(value.toString());
        stream.writeByte(Tags.TagClosebrace);
    }
}