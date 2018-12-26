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
| hprose/io/deserializers/NullDeserializer.ts              |
|                                                          |
| hprose null deserializer for TypeScript.                 |
|                                                          |
| LastModified: Dec 24, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import Deserializer from './Deserializer';

export default class NullDeserializer extends Deserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new NullDeserializer();
    public read(reader: ReaderInterface, tag: number): any {
        if (tag === Tags.TagNull) return null;
        return super.read(reader, tag);
    }
}