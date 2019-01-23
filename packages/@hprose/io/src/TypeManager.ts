/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| TypeManager.ts                                           |
|                                                          |
| hprose TypeManager for TypeScript.                       |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

const typeCache = Object.create(null);
const nameCache = new WeakMap();

if (!('name' in Function.prototype)) {
    Object.defineProperty(Function.prototype, 'name', {
        get() {
            const ctor = this.toString();
            return ctor.substr(0, ctor.indexOf('(')).replace(/(^\s*function\s*)|(\s*$)/ig, '');
        },
        writable: false,
        enumerable: false,
        configurable: true
    });
}

/**
 * Registers a type.
 */
export function register(type: Function, name?: string): void {
    if (name === undefined) name = type.name;
    nameCache.set(type, name);
    typeCache[name] = type;
}

/**
 * Returns whether the name has been registered.
 */
export function isRegistered(name: string): boolean {
    return name in typeCache;
}

/**
 * Gets name by type.
 */
export function getName(type: Function): string {
    if (!type) return '';
    let name = nameCache.get(type);
    if (name) return name;
    name = type.name;
    if (name === '' || name === 'Object') return '';
    nameCache.set(type, name);
    typeCache[name] = type;
    return name;
}

declare var global: any;
declare var window: any;

let root: any = null;

try {
    root = typeof global === 'object' ? global : window;
}
catch (e) { }

function loadType(name: string): Function | undefined {
    if (!root) return undefined;
    let obj = root;
    const names = name.split('.');
    for (let i = 0; i < names.length; i++) {
        obj = obj[names[i]];
        if (obj === undefined) {
            return undefined;
        }
    }
    if (typeof (obj) !== 'function') return undefined;
    return obj;
}

function findType(alias: string[], positions: number[], i: number, c: string): Function | undefined {
    if (i < positions.length) {
        alias[positions[i++]] = c;
        let type = findType(alias, positions, i, '.');
        if (type === undefined && i < positions.length) {
            type = findType(alias, positions, i, '_');
        }
        return type;
    }
    return loadType(alias.join(''));
}

/**
 * Gets type by name.
 */
export function getType(name: string): Function {
    let type: Function | undefined = typeCache[name];
    if (type) return type;
    type = loadType(name);
    if (type) {
        register(type, name);
        return type;
    }
    const positions: number[] = [];
    let pos = name.indexOf('_');
    while (pos >= 0) {
        positions[positions.length] = pos;
        pos = name.indexOf('_', pos + 1);
    }
    if (positions.length > 0) {
        const alias = name.split('');
        type = findType(alias, positions, 0, '.');
        if (type === undefined) {
            type = findType(alias, positions, 0, '_');
        }
        if (type) {
            register(type, name);
            return type;
        }
    }
    type = function () { };
    Object.defineProperty(type, 'name', { value: name });
    register(type, name);
    return type;
}