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
| hprose/io/deserializers/BaseDeserializer.ts              |
|                                                          |
| hprose base deserializer for TypeScript.                 |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';

function tagToString(tag: number): string {
    switch (tag) {
        case 0x30:
        case 0x31:
        case 0x32:
        case 0x33:
        case 0x34:
        case 0x35:
        case 0x36:
        case 0x37:
        case 0x38:
        case 0x39:
        case Tags.TagInteger: return 'int32 number';
        case Tags.TagLong: return 'long number';
        case Tags.TagDouble: return 'double number';
        case Tags.TagNull: return 'null | undefined';
        case Tags.TagEmpty: return 'empty string';
        case Tags.TagTrue: return 'true';
        case Tags.TagFalse: return 'false';
        case Tags.TagNaN: return 'NaN';
        case Tags.TagInfinity: return 'Infinity';
        case Tags.TagDate:
        case Tags.TagTime: return 'Date';
        case Tags.TagBytes: return 'Uint8Array';
        case Tags.TagUTF8Char:
        case Tags.TagString: return 'string';
        case Tags.TagGuid: return 'guid string';
        case Tags.TagList: return 'Array';
        case Tags.TagMap: return 'object | Map';
        case Tags.TagClass: return 'class';
        case Tags.TagObject: return 'Object';
        case Tags.TagRef: return 'Reference';
        case Tags.TagError: return 'Error';
        default: throw new Error('Unexpected Tag: 0x' + (tag & 0xff).toString(16));
    }
}

export class BaseDeserializer implements Deserializer {
    constructor(public type: string = 'undefined') { };
    public read(reader: Reader, tag: number): any {
        switch (tag) {
            case Tags.TagNull: return undefined;
            case Tags.TagRef: return reader.readReference();
            case Tags.TagClass:
                reader.readClass();
                return this.deserialize(reader);
            case Tags.TagError:
                throw new Error(reader.deserialize(String));
        }
        throw new Error('Cannot convert ' + tagToString(tag) + ' to ' + this.type + '.');
    }
    public deserialize(reader: Reader): any {
        return this.read(reader, reader.stream.readByte());
    }
}