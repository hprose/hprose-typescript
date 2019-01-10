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
| hprose/rpc/InvokeSettings.ts                             |
|                                                          |
| hprose InvokeSettings for TypeScript.                    |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export interface InvokeSettings {
    simple?: boolean;
    utc?: boolean;
    longType?: 'number' | 'bigint' | 'string';
    dictType?: 'object' | 'map';
    type?: Function | null;
    requestHeaders?: { [name: string]: any };
    context?: { [name: string]: any };
}