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
| hprose/io/ClassManager.ts                                |
|                                                          |
| hprose ClassManager for TypeScript.                      |
|                                                          |
| LastModified: Dec 5, 2018                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

const classCache = Object.create(null);
const aliasCache = new WeakMap();

/**
 * Registers a class with an alias.
 */
function register(cls: any, alias: string): void {
    aliasCache.set(cls, alias);
    classCache[alias] = cls;
}
/**
 * Gets class alias by class.
 */
function getClassAlias(cls: any): string | undefined {
    return aliasCache.get(cls);
}
/**
 * Gets class by class alias.
 */
function getClass(alias: string): any {
    return classCache[alias];
}

export default { register, getClassAlias, getClass };