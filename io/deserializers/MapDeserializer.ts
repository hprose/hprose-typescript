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
| hprose/io/deserializers/MapDeserializer.ts               |
|                                                          |
| hprose Map deserializer for TypeScript.                  |
|                                                          |
| LastModified: Dec 24, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import * as ReferenceReader from './ReferenceReader';

export default class MapDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new MapDeserializer();
    constructor() { super('Map'); }
    public read(reader: ReaderInterface, tag: number): Map<any, any> {
        switch (tag) {
            case Tags.TagEmpty: return new Map();
            case Tags.TagMap: return ReferenceReader.readMap(reader);
            case Tags.TagObject: return ReferenceReader.readObjectAsMap(reader);
            default:
                return super.read(reader, tag);
        }
     }
}