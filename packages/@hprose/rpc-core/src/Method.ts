/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Method.ts                                                |
|                                                          |
| Method for TypeScript.                                   |
|                                                          |
| LastModified: Mar 28, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export class Method {
    public missing?: boolean;
    public passContext?: boolean;
    [name: string]: any;
    constructor(
        public method: Function,
        public name?: string,
        public target?: any,
        public paramTypes?: (Function | undefined | null)[],
    ) {
        if (name === '' || name === undefined) {
            if (method.name === '') {
                throw new Error('name must not be empty');
            }
            name = method.name
        }
    }
}

export interface MethodLike extends Method {
    // Deprecated
    fullname?: string
}