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
| hprose/io/serializers/BooleanSerializer.ts               |
|                                                          |
| hprose boolean serializer for TypeScript.                |
|                                                          |
| LastModified: Dec 11, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import Serializer from './Serializer';
import WriterInterface from './WriterInterface';

export default class BooleanSerializer extends Serializer<boolean> {
    public write(writer: WriterInterface, value: boolean): void {
        writer.stream.writeByte(value.valueOf() ? Tags.TagTrue : Tags.TagFalse);
    }
}
