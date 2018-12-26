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
| hprose/io/deserializers/NumberDeserializer.ts            |
|                                                          |
| hprose number deserializer for TypeScript.               |
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

export default class NumberDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new NumberDeserializer();
    constructor() { super('number'); }
    public read(reader: ReaderInterface, tag: number): number {
        if (tag >= 0x30 && tag <= 0x39) {
            return tag - 0x30;
        }
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagInteger:
            case Tags.TagLong: return ValueReader.readInt(stream);
            case Tags.TagDouble: return ValueReader.readDouble(stream);
            case Tags.TagNaN: return NaN;
            case Tags.TagInfinity: return ValueReader.readInfinity(stream);
            case Tags.TagTrue: return 1;
            case Tags.TagFalse:
            case Tags.TagEmpty: return 0;
            case Tags.TagString: return Number(ReferenceReader.readString(reader));
            case Tags.TagUTF8Char: return stream.readString(1).charCodeAt(1);
            case Tags.TagDate: return ReferenceReader.readDateTime(reader).getTime();
            case Tags.TagTime: return ReferenceReader.readTime(reader).getTime();
            default: return super.read(reader, tag);
        }
    }
}