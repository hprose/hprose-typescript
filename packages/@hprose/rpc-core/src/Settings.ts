/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Settings.ts                                              |
|                                                          |
| Settings for TypeScript.                                 |
|                                                          |
| LastModified: Jan 26, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export interface Settings {
    simple?: boolean;
    utc?: boolean;
    longType?: 'number' | 'bigint' | 'string';
    dictType?: 'object' | 'map';
    type?: Function | null;
    requestHeaders?: { [name: string]: any };
    context?: { [name: string]: any };
}