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
| hprose/io/deserializers/DeserializerInterface.ts         |
|                                                          |
| hprose DeserializerInterface for TypeScript.             |
|                                                          |
| LastModified: Dec 13, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ReaderInterface from './ReaderInterface';

export default interface DeserializerInterface {
    read(reader: ReaderInterface, tag: number): any;
    deserialize(reader: ReaderInterface): any;
}