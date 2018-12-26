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
| hprose/io/deserializers/Deserializer.ts                  |
|                                                          |
| hprose deserializer for TypeScript.                      |
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

export default class Deserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Deserializer();
    constructor() { super('any'); }
    public read(reader: ReaderInterface, tag: number): any {
        if (tag >= 0x30 && tag <= 0x39) {
            return tag - 0x30;
        }
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagInteger: return ValueReader.readInt(stream);
            case Tags.TagString: return ReferenceReader.readString(reader);
            case Tags.TagBytes: return ReferenceReader.readBytes(reader);
            case Tags.TagTrue: return true;
            case Tags.TagFalse: return false;
            case Tags.TagEmpty: return '';
            case Tags.TagObject: return ReferenceReader.readObject(reader);
            case Tags.TagDate: return ReferenceReader.readDateTime(reader);
            case Tags.TagTime: return ReferenceReader.readTime(reader);
            case Tags.TagGuid: return ReferenceReader.readGuid(reader);
            case Tags.TagLong:
                switch(reader.longType) {
                    case 'number':
                        return ValueReader.readInt(stream);
                    case 'bigint':
                        return BigInt(stream.readUntil(Tags.TagSemicolon));
                    case 'string':
                        return stream.readUntil(Tags.TagSemicolon);
                }
                break;
            case Tags.TagDouble: return ValueReader.readDouble(stream);
            case Tags.TagNaN: return NaN;
            case Tags.TagInfinity: return ValueReader.readInfinity(stream);
            case Tags.TagUTF8Char: return stream.readString(1);
            case Tags.TagList: return ReferenceReader.readArray(reader);
            case Tags.TagMap: return (reader.dictType === 'map') ? ReferenceReader.readMap(reader) : ReferenceReader.readDict(reader);
            default: return super.read(reader, tag);
        }
    }
}