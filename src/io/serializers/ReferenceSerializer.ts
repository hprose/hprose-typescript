/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/serializers/ReferenceSerializer.ts             |
|                                                          |
| hprose reference serializer for TypeScript.              |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { BaseSerializer } from './BaseSerializer';
import { Writer } from './Writer';

export class ReferenceSerializer<T> extends BaseSerializer<T> {
    public write(writer: Writer, value: T): void {
        writer.setReference(value);
    }
    public serialize(writer: Writer, value: T): void {
        if (!writer.writeReference(value)) this.write(writer, value);
    }
}
