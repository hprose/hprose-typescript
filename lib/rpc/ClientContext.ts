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
| hprose/rpc/ClientContext.ts                              |
|                                                          |
| ClientContext for TypeScript.                            |
|                                                          |
| LastModified: Jan 4, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Context from "./Context";
import Client from "./Client";
import InvokeSettings from "./InvokeSettings";

function copy(src: { [name: string]: any } | undefined, dist: { [name: string]: any }): void {
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

export default class ClientContext implements Context {
    public headers: { [name: string]: any } = Object.create(null);
    public simple: boolean;
    public utc: boolean;
    public longType: 'number' | 'bigint' | 'string';
    public dictType: 'object' | 'map';
    public type: Function | null;
    [name: string]: any;
    constructor(client: Client, fullname: string, settings: InvokeSettings = Object.create(null)) {
        const defaultSettings = client.settings[fullname];
        const getValue = function (name: keyof InvokeSettings, defaultValue: any): any {
            return (settings[name] !== undefined)
                ? settings[name]
                : (defaultSettings[name] !== undefined)
                    ? defaultSettings[name]
                    : defaultValue;
        }
        this.simple = getValue('simple', client.simple);
        this.utc = getValue('utc', client.utc);
        this.longType = getValue('longType', client.longType);
        this.dictType = getValue('dictType', client.dictType);
        this.type = getValue('type', client.nullType);
        copy(client.headers, this.headers);
        copy(defaultSettings.headers, this.headers);
        copy(settings.headers, this.headers);
        copy(defaultSettings.context, this);
        copy(settings.context, this);
    }
}