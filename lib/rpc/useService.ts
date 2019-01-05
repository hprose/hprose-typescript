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
| hprose/rpc/useService.ts                                 |
|                                                          |
| hprose useService for TypeScript.                        |
|                                                          |
| LastModified: Jan 5, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags, ByteStream, Reader } from '../hprose.io';
import Client from './Client';
import Context from './Context';

const GET_FUNCTIONS = new Uint8Array([Tags.TagEnd]);

export async function useService(client: Client): Promise<any> {
    const context: Context = { headers: Object.create(null) };
    const data = await client.transport(GET_FUNCTIONS, context);
    const stream = new ByteStream(data);
    const reader = new Reader(stream, true);
    const tag = stream.readByte();
    switch (tag) {
        case Tags.TagError:
            throw new Error(reader.deserialize(String));
        case Tags.TagFunctions:
            return client.useService(reader.deserialize(Array));
        default:
            throw new Error('Wrong Response:\r\n' + stream.toString());
    }
}