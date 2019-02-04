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
| LastModified: Feb 5, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export class Context {
    public readonly requestHeaders: { [name: string]: any } = Object.create(null);
    public readonly responseHeaders: { [name: string]: any } = Object.create(null);
    [name: string]: any;
    protected copy(src: { [name: string]: any } | undefined, dist: { [name: string]: any }): void {
        if (src) {
            for (let name in src) {
                if (!src.hasOwnProperty || src.hasOwnProperty(name)) {
                    dist[name] = src[name];
                }
            }
        }
    }
    public clone(): this {
        let result: this = Object.create(this.constructor.prototype);
        this.copy(this, result);
        return result;
    }
}