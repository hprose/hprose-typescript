/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Message.ts                                               |
|                                                          |
| Message for TypeScript.                                  |
|                                                          |
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { TypeManager } from '@hprose/io';

export class Message {
    public constructor(public readonly data: any, public readonly from: string) { }
}

TypeManager.register(Message, '@');