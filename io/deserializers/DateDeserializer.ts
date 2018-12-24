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
| hprose/io/deserializers/DateDeserializer.ts              |
|                                                          |
| hprose date deserializer for TypeScript.                 |
|                                                          |
| LastModified: Dec 16, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import * as ValueReader from './ValueReader';
import * as ReferenceReader from './ReferenceReader';

export default class DateDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new DateDeserializer();
    constructor() { super('Date'); }
    public read(reader: ReaderInterface, tag: number): Date {
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagDate: return ReferenceReader.readDateTime(reader);
            case Tags.TagTime: return ReferenceReader.readTime(reader);
            case Tags.TagInteger: return new Date(ValueReader.readInt(stream));
            case Tags.TagLong: return new Date(ValueReader.readInt(stream));
            case Tags.TagDouble: return new Date(Math.floor(ValueReader.readDouble(stream)));
            case Tags.TagString: return new Date(ReferenceReader.readString(reader));
            case Tags.TagTrue: return new Date(1);
            case Tags.TagFalse:
            case Tags.TagEmpty: return new Date(0);
            default:
                if (tag >= 0x30 && tag <= 0x39) {
                    return new Date(tag - 0x30);
                }
                return super.read(reader, tag);
        }
    }
}