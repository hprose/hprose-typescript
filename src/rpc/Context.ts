/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/Context.ts                                    |
|                                                          |
| hprose Context for TypeScript.                           |
|                                                          |
| LastModified: Jan 9, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export interface Context {
    readonly requestHeaders: { [name: string]: any };
    readonly responseHeaders: { [name: string]: any };
    [name: string]: any;
}