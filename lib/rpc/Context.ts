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
| hprose/rpc/Context.ts                                    |
|                                                          |
| hprose Context for TypeScript.                           |
|                                                          |
| LastModified: Dec 31, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

interface Context {
    headers: { [name: string]: any };
    [name: string]: any;
};

export default Context;