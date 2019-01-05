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
| hprose/io/serializers/DictionarySerializer.ts            |
|                                                          |
| hprose dictionary serializer for TypeScript.             |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from "./Writer";

export class DictionarySerializer extends ReferenceSerializer<any> {
    public write(writer: Writer, value: any): void {
        super.write(writer, value);
        const stream = writer.stream;
        const fields = [];
        if (value.hasOwnProperty === undefined) {
            for (const key in value) {
                if (typeof value[key] !== 'function') {
                    fields[fields.length] = key;
                }
            }
        } else {
            for (const key in value) {
                if (value.hasOwnProperty(key) && typeof value[key] !== 'function') {
                    fields[fields.length] = key;
                }
            }
        }
        const n = fields.length;
        stream.writeByte(Tags.TagMap);
        if (n > 0) stream.writeAsciiString('' + n);
        stream.writeByte(Tags.TagOpenbrace);
        for (let i = 0; i < n; i++) {
            writer.serialize(fields[i]);
            writer.serialize(value[fields[i]]);
        }
        stream.writeByte(Tags.TagClosebrace);
    }
}