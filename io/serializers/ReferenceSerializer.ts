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
| hprose/io/serializers/ReferenceSerializer.ts             |
|                                                          |
| hprose reference serializer for TypeScript.              |
|                                                          |
| LastModified: Dec 10, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import WriterInterface from './WriterInterface';
import Serializer from './Serializer';

export default class ReferenceSerializer<T> extends Serializer<T> {
    public write(writer: WriterInterface, value: T): void {
        writer.setReference(value);
    }
    public serialize(writer: WriterInterface, value: T): void {
        if (!writer.writeReference(value)) this.write(writer, value);
    }
}
