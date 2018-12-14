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
| hprose/io/TypeManager.ts                                 |
|                                                          |
| hprose TypeManager for TypeScript.                       |
|                                                          |
| LastModified: Dec 14, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

const typeCache = Object.create(null);
const nameCache = new WeakMap();

/**
 * Registers a type.
 */
function register(type: Function, name: string = ''): void {
    if (name === '') name = type.name;
    nameCache.set(type, name);
    typeCache[name] = type;
}

/**
 * Returns whether the name has been registered.
 */
function isRegistered(name: string): boolean {
    return name in typeCache;
}

/**
 * Gets name by type.
 */
function getName(type: Function): string {
    if (!type) return '';
    let name = nameCache.get(type);
    if (name) return name;
    if (type.name) {
        name = type.name;
    } else {
        const ctor = type.toString();
        name = ctor.substr(0, ctor.indexOf('(')).replace(/(^\s*function\s*)|(\s*$)/ig, '');
    }
    if (name === '' || name === 'Object') return '';
    nameCache.set(type, name);
    typeCache[name] = type;
    return name;
}
/**
 * Gets type by name.
 */
function getType(name: string): Function {
    return typeCache[name];
}

export default { register, isRegistered, getName, getType };