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
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import { register } from '../Deserializer';
import * as ReferenceReader from '../ReferenceReader';

if (typeof BigInt !== 'undefined') {
    class BigIntDeserializer extends BaseDeserializer implements Deserializer {
        public static instance: Deserializer = new BigIntDeserializer();
        constructor() { super('bigint'); }
        public read(reader: Reader, tag: number): bigint {
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
    register(BigInt, BigIntDeserializer.instance);
}