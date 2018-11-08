/**********************************************************\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: http://www.hprose.com/                 |
|                   http://www.hprose.org/                 |
|                                                          |
\**********************************************************/

/**********************************************************\
 *                                                        *
 * hprose/io/ClassManager.ts                              *
 *                                                        *
 * hprose ClassManager for TypeScript.                    *
 *                                                        *
 * LastModified: Nov 8, 2018                              *
 * Author: Ma Bingyao <andot@hprose.com>                  *
 *                                                        *
\**********************************************************/

const classCache = Object.create(null);
const aliasCache = new WeakMap();

/**
 * Registers a class with an alias.
 */
function register(cls: object, alias: string): void {
    aliasCache.set(cls, alias);
    classCache[alias] = cls;
}
/**
 * Gets class alias by class.
 */
function getClassAlias(cls: object): string {
    return aliasCache.get(cls);
}
/**
 * Gets class by class alias.
 */
function getClass(alias: string): object {
    return classCache[alias];
}

export default { register, getClassAlias, getClass };