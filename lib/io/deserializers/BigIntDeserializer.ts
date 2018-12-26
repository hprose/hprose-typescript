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
| hprose/io/deserializers/BigIntDeserializer.ts            |
|                                                          |
| hprose bigint deserializer for TypeScript.               |
|                                                          |
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import * as ReferenceReader from './ReferenceReader';

export default class BigIntDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new BigIntDeserializer();
    constructor() { super('bigint'); }
    public read(reader: ReaderInterface, tag: number): bigint {
        if (tag >= 0x30 && tag <= 0x39) {
            return BigInt(tag - 0x30);
        }
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagInteger:
            case Tags.TagLong:
            case Tags.TagDouble: return BigInt(stream.readUntil(Tags.TagSemicolon));
            case Tags.TagTrue: return BigInt(1);
            case Tags.TagFalse:
            case Tags.TagEmpty: return BigInt(0);
            case Tags.TagString: return BigInt(ReferenceReader.readString(reader));
            case Tags.TagUTF8Char: return BigInt(stream.readString(1).charCodeAt(1));
            case Tags.TagDate: return BigInt(ReferenceReader.readDateTime(reader).getTime());
            case Tags.TagTime: return BigInt(ReferenceReader.readTime(reader).getTime());
            default: return super.read(reader, tag);
        }
    }
}