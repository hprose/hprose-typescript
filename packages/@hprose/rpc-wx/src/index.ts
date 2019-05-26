/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-wx for TypeScript.                           |
|                                                          |
| LastModified: Jan 28, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export { HttpClientContext, HttpTransport } from './HttpTransport';
export { WebSocketTransport } from './WebSocketTransport';

declare const wx: any;

export function wxPromisify(name: string) {
    return function(args: any): Promise<any> {
        args = args || {};
        return new Promise(function(resolve, reject) {
            args.success = resolve;
            args.fail = reject;
            try {
                wx[name](args);
            }
            catch(e) {
                reject(e);
            }
        });
    }
}

const exclusionList = [
    'canIUse',
    'invoke',
    'getLogManager',
    'drawCanvas',
    'canvasToTempFilePath',
    'hideKeyboard',
    'getPublicLibVersion',
    'nextTick'
];

const WX: any = {};

for (let name in wx) {
    if (typeof wx[name] === 'function'
        && wx[name].length > 0
        && exclusionList.indexOf(name) === 1
        && name.search(/(^(on|off|create))|((Sync)$)/) < 0) {
        WX[name] = wxPromisify(name); 
    }
    else {
        WX[name] = wx[name].bind(wx);
    }
}

export default WX;