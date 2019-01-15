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
| hprose/rpc/Utils.ts                                      |
|                                                          |
| Utils for TypeScript.                                    |
|                                                          |
| LastModified: Jan 9, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export interface URI {
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

export function copy(src: { [name: string]: any } | undefined, dist: { [name: string]: any }): void {
    if (src) {
        if (src.hasOwnProperty === undefined) {
            for (let name in src) {
                dist[name] = src[name];
            }
        } else {
            for (let name in src) {
                if (src.hasOwnProperty(name)) {
                    dist[name] = src[name];
                }
            }
        }
    }
}

export function normalize(functions: string[]): any[] {
    const root = [Object.create(null)];
    for (let i = 0, n = functions.length; i < n; ++i) {
        const func = functions[i].split('_');
        const n = func.length - 1;
        if (n > 0) {
            let node = root;
            for (let j = 0; j < n; j++) {
                const f = func[j];
                if (node[0][f] === undefined) {
                    node[0][f] = [Object.create(null)];
                }
                node = node[0][f];
            }
            node.push(func[n]);
        }
        root.push(functions[i]);
    }
    return root;
}

function getCallback(resolve: (value?: any | PromiseLike<any>) => void, reject: (reason?: any) => void): Function {
    return function() {
        switch(arguments.length) {
            case 1:
                const arg = arguments[0];
                if (arg instanceof Error) {
                    reject(arg);
                } else {
                    resolve(arg);
                }
                break;
            case 2:
                const arg1 = arguments[0];
                const arg2 = arguments[1];
                if (arg1 instanceof Error) {
                    reject(arg1);
                } else if (arg2 instanceof Error) {
                    reject(arg2);
                } else if (arg1 === undefined) {
                    resolve(arg2);
                } else {
                    resolve(arg1);
                }
                break;
        }
    };
}

export function promisify(fn: Function, thisArg?: any): ((...args: any[]) => Promise<any>) {
    return (...args: any[]): Promise<any> => {
        return new Promise<any>((resolve, reject) => {
            args.push(getCallback(resolve, reject));
            try {
                fn.apply(thisArg, args);
            }
            catch (error) {
                reject(error);
            }
        });
    };
}