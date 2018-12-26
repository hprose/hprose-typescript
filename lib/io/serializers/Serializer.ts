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
| hprose/io/serializers/Serializer.ts                      |
|                                                          |
| hprose serializer class for TypeScript.                  |
|                                                          |
| LastModified: Dec 10, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import WriterInterface from './WriterInterface';
import SerializerInterface from './SerializerInterface';

export default class Serializer<T> implements SerializerInterface {
    public write(writer: WriterInterface, value: T): void {
        writer.stream.writeByte(Tags.TagNull);
    }
    public serialize(writer: WriterInterface, value: T): void {
        this.write(writer, value);
    }
}