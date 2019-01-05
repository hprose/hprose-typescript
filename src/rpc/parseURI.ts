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
| hprose/rpc/parseURI.ts                                   |
|                                                          |
| parseURI for TypeScript.                                 |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

interface URI {
    protocol: string;
    host: string;
    hostname: string;
    port: number;
    path: string;
    query: string;
    fragment: string;
}

export function parseURI(uri: string): URI {
    const pattern: RegExp = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?');
    const matches: RegExpMatchArray | null = uri.match(pattern);
    if (matches) {
        const host = matches[4].split(':', 2);
        return {
            protocol: matches[1],
            host: matches[4],
            hostname: host[0],
            port: parseInt(host[1], 10) || 0,
            path: matches[5],
            query: matches[7],
            fragment: matches[9]
        };
    }
    throw new Error('Invalid URI');
}
