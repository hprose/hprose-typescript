/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| PluginManager.ts                                         |
|                                                          |
| PluginManager for TypeScript.                            |
|                                                          |
| LastModified: Feb 16, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export abstract class PluginManager<Handler, NextHandler> {
    private handlers: Handler[] = [];
    private firstHandler: NextHandler;
    constructor(private readonly defaultHandler: NextHandler) {
        this.firstHandler = defaultHandler;
    }
    protected abstract getNextHandler(handler: Handler, next: NextHandler): NextHandler;
    private rebuildHandler(): void {
        const handlers = this.handlers;
        let next = this.defaultHandler;
        const n = handlers.length;
        for (let i = n - 1; i >= 0; --i) {
            next = this.getNextHandler(handlers[i], next);
        }
        this.firstHandler = next;
    }
    public get handler(): NextHandler {
        return this.firstHandler;
    }
    public use(...handlers: Handler[]): void {
        this.handlers.push(...handlers);
        this.rebuildHandler();
    }
    public unuse(...handlers: Handler[]): void {
        let rebuild = false;
        for (let i = 0, n = handlers.length; i < n; ++i) {
            const index = this.handlers.indexOf(handlers[i]);
            if (index >= 0) {
                this.handlers.splice(index, 1);
                rebuild = true;
            }
        }
        if (rebuild) this.rebuildHandler();
    }
}