/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| StringSerializer.ts                                      |
|                                                          |
| hprose string serializer for TypeScript.                 |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';
import { writeStringBody } from '../ValueWriter';

export class StringSerializer extends ReferenceSerializer<string> {
    public write(writer: Writer, value: string): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagString);
        writeStringBody(stream, value);
    }
    public serialize(writer: Writer, value: string): void {
        const stream = writer.stream;
        switch (value.length) {
            case 0:
                stream.writeByte(Tags.TagEmpty);
                break;
            case 1:
                stream.writeByte(Tags.TagUTF8Char);
                stream.writeString(value);
                break;
            default:
                super.serialize(writer, value);
                break;
        }
    }
}
