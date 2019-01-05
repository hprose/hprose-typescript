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
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseSerializer } from './BaseSerializer';
import { Writer } from './Writer';

export class BooleanSerializer extends BaseSerializer<boolean> {
    public write(writer: Writer, value: boolean): void {
        writer.stream.writeByte(value.valueOf() ? Tags.TagTrue : Tags.TagFalse);
    }
}
