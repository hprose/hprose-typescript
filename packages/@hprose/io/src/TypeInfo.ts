/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| TypeInfo.ts                                              |
|                                                          |
| hprose TypeInfo for TypeScript.                          |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

export interface TypeInfo {
    name: string;
    names: string[];
    type: Function;
}