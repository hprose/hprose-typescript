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
| hprose/io/serializers/BigIntArraySerializer.ts           |
|                                                          |
| hprose bigint array serializer for TypeScript.           |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';
import { writeBigInt } from './ValueWriter';
import { register } from '../Serializers';

if ((typeof BigInt64Array !== 'undefined') && (typeof BigUint64Array !== 'undefined')) {
    class BigIntArraySerializer extends ReferenceSerializer<ArrayLike<bigint>> {
        constructor () { super(); }
        public write(writer: Writer, value: ArrayLike<bigint>): void {
            super.write(writer, value);
            const stream = writer.stream;
            stream.writeByte(Tags.TagList);
            const n = value.length;
            if (n > 0) stream.writeAsciiString('' + n);
            stream.writeByte(Tags.TagOpenbrace);
            for (let i = 0; i < n; i++) {
                writeBigInt(stream, value[i]);
            }
            stream.writeByte(Tags.TagClosebrace);
        }
    }
    const bigintArraySerializer = new BigIntArraySerializer();
    register(BigInt64Array, bigintArraySerializer);
    register(BigUint64Array, bigintArraySerializer);
}