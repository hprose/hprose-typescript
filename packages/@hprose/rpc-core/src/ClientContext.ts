/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ClientContext.ts                                         |
|                                                          |
| ClientContext for TypeScript.                            |
|                                                          |
| LastModified: Jan 27, 2019                               |
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
    public type?: Function | null;
    [name: string]: any;
    constructor(public readonly client: Client, fullname: string, settings: Settings = Object.create(null)) {
        const uris = client.uris;
        this.uri = (uris.length > 0) ? uris[0] : '';
        const defaultSettings = (fullname in client.settings) ? client.settings[fullname] : emptySettings;
        this.type = ('type' in settings) ? settings.type : defaultSettings.type;
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