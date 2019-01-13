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
| hprose/rpc/Method.ts                                     |
|                                                          |
| hprose Method for TypeScript.                            |
|                                                          |
| LastModified: Jan 7, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export class Method {
    public debug?: boolean;
    public simple?: boolean;
    public utc?: boolean;
    public longType?: 'number' | 'bigint' | 'string';
    public dictType?: 'object' | 'map';
    public missing?: boolean;
    public passContext?: boolean;
    [name: string]: any;
    constructor(
        public method: Function,
        public fullname: string = method.name,
        public obj?: any,
        public paramTypes?: (Function | undefined | null)[],
    ) {
        if (fullname === '') {
            throw new Error('fullname must not be empty');
        }
     }
}

export interface MethodLike extends Method { }