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
| LastModified: Feb 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Client } from './Client';
import { Settings } from './Settings';

const emptySettings: Settings = Object.create(null);

export class ClientContext extends Context {
    public uri: string;
    public type?: Function | null;
    public readonly requestHeaders: { [name: string]: any } = Object.create(null);
    public readonly responseHeaders: { [name: string]: any } = Object.create(null);
    constructor(public readonly client: Client, fullname: string, settings: Settings = Object.create(null)) {
        super();
        const uris = client.uris;
        this.uri = (uris.length > 0) ? uris[0] : '';
        const defaultSettings = (fullname in client.settings) ? client.settings[fullname] : emptySettings;
        this.type = ('type' in settings) ? settings.type : defaultSettings.type;
        this.copy(client.requestHeaders, this.requestHeaders);
        this.copy(defaultSettings.requestHeaders, this.requestHeaders);
        this.copy(settings.requestHeaders, this.requestHeaders);
        this.copy(defaultSettings.context, this);
        this.copy(settings.context, this);
    }
}