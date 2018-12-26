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
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import WriterInterface from './WriterInterface';
import Serializer from './Serializer';
import { writeBigInt } from './ValueWriter';

export default class BigIntSerializer extends Serializer<bigint> {
    public write(writer: WriterInterface, value: bigint): void {
        writeBigInt(writer.stream, value);
    }
}
