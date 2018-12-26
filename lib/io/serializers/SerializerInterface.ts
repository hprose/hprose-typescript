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
| hprose/io/serializers/SerializerInterface.ts             |
|                                                          |
| hprose SerializerInterface for TypeScript.               |
|                                                          |
| LastModified: Dec 11, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import WriterInterface from './WriterInterface';

export default interface SerializerInterface {
    write(writer: WriterInterface, value: any): void;
    serialize(writer: WriterInterface, value: any): void;
}