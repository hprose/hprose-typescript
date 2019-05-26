/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| TimeoutError.ts                                          |
|                                                          |
| TimeoutError for TypeScript.                             |
|                                                          |
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export class TimeoutError extends Error {
    constructor(message: string = 'timeout') { super(message); }
}