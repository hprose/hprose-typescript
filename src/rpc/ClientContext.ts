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
| LastModified: Jan 14, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Client } from './Client';
import { Settings } from './Settings';
import { copy } from './Utils';

const emptySettings: Settings = Object.create(null);

export class ClientContext implements Context {
    public readonly requestHeaders: { [name: string]: any } = Object.create(null);
    public readonly responseHeaders: { [name: string]: any } = Object.create(null);
    public uri: string;
    public simple: boolean;
    public utc: boolean;
    public longType: 'number' | 'bigint' | 'string';
    public dictType: 'object' | 'map';
    public type: Function | null;
    [name: string]: any;
    constructor(public client: Client, fullname: string, settings: Settings = Object.create(null)) {
        const uris = client.uris;
        if (uris.length <= 0) {
            throw new Error('The service URIs has not been set up yet');
        }
        this.uri = uris[0];
        const defaultSettings = (fullname in client.settings) ? client.settings[fullname] : emptySettings;
        const getValue = (name: keyof Settings, defaultValue: any): any => {
            return (name in settings)
                ? settings[name]
                : (name in defaultSettings)
                    ? defaultSettings[name]
                    : defaultValue;
        };
        this.simple = getValue('simple', client.simple);
        this.utc = getValue('utc', client.utc);
        this.longType = getValue('longType', client.longType);
        this.dictType = getValue('dictType', client.dictType);
        this.type = getValue('type', client.nullType);
        copy(client.requestHeaders, this.requestHeaders);
        copy(defaultSettings.requestHeaders, this.requestHeaders);
        copy(settings.requestHeaders, this.requestHeaders);
        copy(defaultSettings.context, this);
        copy(settings.context, this);
    }
    public clone(): ClientContext {
        let result: ClientContext = Object.create(ClientContext.prototype);
        copy(this, result);
        return result;
    }
}