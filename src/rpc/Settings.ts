/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/Settings.ts                                   |
|                                                          |
| hprose Settings for TypeScript.                          |
|                                                          |
| LastModified: Jan 14, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export interface Settings {
    timeout?: number;
    simple?: boolean;
    utc?: boolean;
    longType?: 'number' | 'bigint' | 'string';
    dictType?: 'object' | 'map';
    type?: Function | null;
    requestHeaders?: { [name: string]: any };
    context?: { [name: string]: any };
}