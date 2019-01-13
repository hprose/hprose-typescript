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
| hprose/rpc/PushMethodName.ts                             |
|                                                          |
| hprose PushMethodName for TypeScript.                    |
|                                                          |
| LastModified: Jan 13, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export const enum PushMethodName {
    subscribe   = '+',
    unsubscribe = '-',
    message     = '<',
    unicast     = '>',
    multicast   = '>?',
    broadcast   = '>*',
    exist       = '?',
    idlist      = '|',
}