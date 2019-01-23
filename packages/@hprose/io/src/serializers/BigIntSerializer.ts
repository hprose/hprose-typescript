/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| BigIntSerializer.ts                                      |
|                                                          |
| hprose bigint serializer for TypeScript.                 |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { writeBigInt } from '../ValueWriter';
import { BaseSerializer } from './BaseSerializer';
import { Writer } from './Writer';
import { register } from '../Serializer';

if (typeof BigInt !== 'undefined') {
    class BigIntSerializer extends BaseSerializer<bigint> {
        public write(writer: Writer, value: bigint): void {
            writeBigInt(writer.stream, value);
        }
    }
    register(BigInt, new BigIntSerializer());
}
