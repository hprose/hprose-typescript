/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/deserializers/DefaultDeserializer.ts           |
|                                                          |
| hprose DefaultDeserializer for TypeScript.               |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import { StringDeserializer } from './StringDeserializer';
import * as ValueReader from '../ValueReader';
import * as ReferenceReader from '../ReferenceReader';

export class DefaultDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new DefaultDeserializer();
    constructor() { super('any'); }
    public read(reader: Reader, tag: number): any {
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
                switch (reader.longType) {
                    case 'number':
                        return ValueReader.readInt(stream);
                    case 'bigint':
                        if (typeof BigInt !== 'undefined') {
                            return BigInt(stream.readUntil(Tags.TagSemicolon));
                        }
                    // tslint:disable-next-line:no-switch-case-fall-through
                    case 'string':
                        return stream.readUntil(Tags.TagSemicolon);
                }
                break;
            case Tags.TagDouble: return ValueReader.readDouble(stream);
            case Tags.TagNaN: return NaN;
            case Tags.TagInfinity: return ValueReader.readInfinity(stream);
            case Tags.TagUTF8Char: return stream.readString(1);
            case Tags.TagList: return ReferenceReader.readArray(reader);
            case Tags.TagMap: return (reader.dictType === 'map') ? ReferenceReader.readMap(reader) : readDict(reader);
            default: return super.read(reader, tag);
        }
    }
}

function readDict(reader: Reader): any {
    const stream = reader.stream;
    const dict = Object.create(null);
    reader.addReference(dict);
    let count = ValueReader.readCount(stream);
    const strDeserializer = StringDeserializer.instance;
    const deserializer = DefaultDeserializer.instance;
    for (; count > 0; --count) {
        const key = strDeserializer.deserialize(reader);
        const value = deserializer.deserialize(reader);
        dict[key] = value;
    }
    stream.readByte();
    return dict;
}