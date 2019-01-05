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
| hprose/io/serializers/BigIntSerializer.ts                |
|                                                          |
| hprose bigint serializer for TypeScript.                 |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { writeBigInt } from './ValueWriter';
import { BaseSerializer } from './BaseSerializer';
import { Writer } from './Writer';
import { register } from '../Serializers';

if (typeof BigInt !== 'undefined') {
    class BigIntSerializer extends BaseSerializer<bigint> {
        public write(writer: Writer, value: bigint): void {
            writeBigInt(writer.stream, value);
        }
    }
    register(BigInt, new BigIntSerializer());
}
