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
| hprose/io/serializers/MapSerializer.ts                   |
|                                                          |
| hprose Map serializer for TypeScript.                    |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';

export class MapSerializer extends ReferenceSerializer<Map<any, any>> {
    public write(writer: Writer, value: Map<any, any>): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagMap);
        const n = value.size;
        if (n > 0) stream.writeAsciiString('' + n);
        stream.writeByte(Tags.TagOpenbrace);
        value.forEach((v, k) => {
            writer.serialize(k);
            writer.serialize(v);
        });
        stream.writeByte(Tags.TagClosebrace);
    }
}