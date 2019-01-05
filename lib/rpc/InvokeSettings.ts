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
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export default interface InvokeSettings {
    simple?: boolean;
    utc?: boolean;
    longType?: 'number' | 'bigint' | 'string';
    dictType?: 'object' | 'map';
    type?: Function | null;
    headers?: { [name: string]: any };
    context?: { [name: string]: any };
}