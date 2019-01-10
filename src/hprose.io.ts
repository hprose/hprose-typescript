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
| hprose.io.ts                                             |
|                                                          |
| hprose io for TypeScript.                                |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export { ByteStream } from './io/ByteStream';
export { Tags } from './io/Tags';
export { Writer } from './io/Writer';
export { Reader } from './io/Reader';
export { TypeInfo } from './io/TypeInfo';

import * as TypeManager from './io/TypeManager';
import * as Serializer from './io/Serializer';
import * as Deserializer from './io/Deserializer';
import * as Formatter from './io/Formatter';
import * as ReferenceReader from './io/ReferenceReader';
import * as ValueReader from './io/ValueReader';
import * as ValueWriter from './io/ValueWriter';

export {
    TypeManager,
    Serializer,
    Deserializer,
    Formatter,
    ReferenceReader,
    ValueReader,
    ValueWriter
};