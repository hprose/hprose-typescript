/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose.browser.ts                                        |
|                                                          |
| hprose on browser for TypeScript.                        |
|                                                          |
| LastModified: Jan 19, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export * from './hprose.io';

export { Client, ClientSettings } from './rpc/Client';
export { ClientCodec } from './rpc/ClientCodec';
export { ClientContext } from './rpc/ClientContext';
export { Context } from './rpc/Context';
export { getCookie, setCookie } from './rpc/CookieManager';
export { Deferred, defer } from './rpc/Deferred';
export { HandlerManager, InvokeHandler, NextInvokeHandler, IOHandler, NextIOHandler } from './rpc/HandlerManager';
export { Method, MethodLike } from './rpc/Method';
export { MissingFunction, MethodManager } from './rpc/MethodManager';
export { Settings } from './rpc/Settings';
export { TimeoutError } from './rpc/TimeoutError';
export { URI, parseURI, copy, promisify, normalize, crc32 } from './rpc/Utils';

export { DefaultClientCodec } from './rpc/codec/DefaultClientCodec';

export { Message } from './rpc/plugins/Message';
export { Prosumer } from './rpc/plugins/Prosumer';
export { Provider } from './rpc/plugins/Provider';

import * as Cluster from './rpc/plugins/Cluster';
import * as LoadBalancer from './rpc/plugins/LoadBalancer';
import * as Oneway from './rpc/plugins/Oneway';

export { Cluster, LoadBalancer, Oneway };

export { HttpClient, HttpClientContext } from './rpc/browser/HttpClient';