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
| hprose/io/serializers/StringSerializer.ts                |
|                                                          |
| hprose string serializer for TypeScript.                 |
|                                                          |
| LastModified: Dec 5, 2018                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import WriterInterface from './WriterInterface';
import ReferenceSerializer from './ReferenceSerializer';
import { writeStringBody } from './ValueWriter';

export default class StringSerializer extends ReferenceSerializer<string> {
    public write(writer: WriterInterface, value: string): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagString);
        writeStringBody(stream, value);
    }
    public serialize(writer: WriterInterface, value: string): void {
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
