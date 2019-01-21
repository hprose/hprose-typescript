/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose.html5.ts                                          |
|                                                          |
| hprose on html5 browser or application for TypeScript.   |
|                                                          |
| LastModified: Jan 21, 2019                               |
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
export { JsonRpcClientCodec } from './rpc/codec/JsonRpcClientCodec';

export { Message } from './rpc/plugins/Message';
export { Prosumer } from './rpc/plugins/Prosumer';
export { Provider } from './rpc/plugins/Provider';

import * as Cluster from './rpc/plugins/Cluster';
import * as LoadBalancer from './rpc/plugins/LoadBalancer';
import * as Oneway from './rpc/plugins/Oneway';

export { Cluster, LoadBalancer, Oneway };

export { HttpTransport, HttpClient, HttpClientContext } from './rpc/html5/HttpClient';
export { WebSocketTransport, WebSocketClient } from './rpc/html5/WebSocketClient';