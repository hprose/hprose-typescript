/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/deserializers/BooleanDeserializer.ts           |
|                                                          |
| hprose boolean deserializer for TypeScript.              |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import * as ValueReader from '../ValueReader';
import * as ReferenceReader from '../ReferenceReader';

export class BooleanDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new BooleanDeserializer();
    constructor() { super('boolean'); }
    public read(reader: Reader, tag: number): boolean {
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagTrue: return true;
            case Tags.TagFalse:
            case Tags.TagEmpty:
            case Tags.TagNaN:
            case 0x30: return false;
            case Tags.TagInteger:
            case Tags.TagLong: return ValueReader.readInt(stream) !== 0;
            case Tags.TagDouble: return ValueReader.readDouble(stream) !== 0;
            case Tags.TagString: return Boolean(ReferenceReader.readString(reader));
            case Tags.TagUTF8Char: return '0\0'.indexOf(stream.readString(1)) === -1;
            case Tags.TagInfinity: stream.readByte(); return true;
            default:
                if (tag >= 0x31 && tag <= 0x39) {
                    return true;
                }
                return super.read(reader, tag);
        }
    }
}