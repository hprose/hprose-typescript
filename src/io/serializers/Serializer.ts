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
| hprose/io/Serializer.ts                                  |
|                                                          |
| hprose Serializer interface for TypeScript.              |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Writer } from './Writer';

export interface Serializer {
    write(writer: Writer, value: any): void;
    serialize(writer: Writer, value: any): void;
}