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
| hprose/io/deserializers/SetDeserializer.ts               |
|                                                          |
| hprose Set deserializer for TypeScript.                  |
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

export default class SetDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new SetDeserializer();
    constructor() { super('Set'); }
    public read(reader: ReaderInterface, tag: number): Set<any> {
        switch (tag) {
            case Tags.TagEmpty: return new Set();
            case Tags.TagList: return ReferenceReader.readSet(reader);
            default:
                return super.read(reader, tag);
        }
     }
}