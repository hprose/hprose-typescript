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
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { BaseDeserializer } from "./BaseDeserializer";
import { Deserializer } from "./Deserializer";

export class FunctionDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new FunctionDeserializer();
    constructor() { super('function'); }
}