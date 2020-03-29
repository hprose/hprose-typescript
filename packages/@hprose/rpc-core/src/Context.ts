/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Context.ts                                               |
|                                                          |
| Context for TypeScript.                                  |
|                                                          |
| LastModified: Mar 29, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export class Context {
    [name: string]: any;
    public requestHeaders: { [name: string]: any } = Object.create(null);
    public responseHeaders: { [name: string]: any } = Object.create(null);
    protected copy(src: { [name: string]: any } | undefined, dist: { [name: string]: any }): void {
        if (src) {
            for (let name in src) {
                if ((name !== 'requestHeaders') &&
                    (name !== 'responseHeaders') &&
                    (!src.hasOwnProperty || src.hasOwnProperty(name))) {
                    dist[name] = src[name];
                }
            }
        }
    }
    public clone(): this {
        let result: this = Object.create(this.constructor.prototype);
        this.copy(this, result);
        this.copy(this.requestHeaders, result.requestHeaders);
        this.copy(this.responseHeaders, result.responseHeaders);
        return result;
    }
}