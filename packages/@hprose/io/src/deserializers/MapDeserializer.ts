/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| MapDeserializer.ts                                       |
|                                                          |
| hprose Map deserializer for TypeScript.                  |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import * as ReferenceReader from '../ReferenceReader';

export class MapDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new MapDeserializer();
    constructor() { super('Map'); }
    public read(reader: Reader, tag: number): Map<any, any> {
        switch (tag) {
            case Tags.TagEmpty: return new Map();
            case Tags.TagMap: return ReferenceReader.readMap(reader);
            case Tags.TagObject: return ReferenceReader.readObjectAsMap(reader);
            default:
                return super.read(reader, tag);
        }
    }
}