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
| hprose/io/serializers/BaseSerializer.ts                  |
|                                                          |
| hprose BaseSerializer for TypeScript.                    |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { Serializer } from './Serializer';
import { Writer } from './Writer';

export class BaseSerializer<T> implements Serializer {
    public write(writer: Writer, value: T): void {
        writer.stream.writeByte(Tags.TagNull);
    }
    public serialize(writer: Writer, value: T): void {
        this.write(writer, value);
    }
}