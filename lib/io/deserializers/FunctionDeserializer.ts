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
| hprose/io/deserializers/FunctionDeserializer.ts          |
|                                                          |
| hprose function deserializer for TypeScript.             |
|                                                          |
| LastModified: Dec 31, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';

export default class FunctionDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new FunctionDeserializer();
    constructor() { super('function'); }
}
