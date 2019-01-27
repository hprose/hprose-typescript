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
| LastModified: Jan 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export interface Settings {
    type?: Function | null;
    requestHeaders?: { [name: string]: any };
    context?: { [name: string]: any };
}