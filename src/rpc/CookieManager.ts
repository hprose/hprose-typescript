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
| hprose/rpc/CookieManager.ts                              |
|                                                          |
| CookieManager for TypeScript.                            |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

const cookieManager = Object.create(null);

export function setCookie(headers: { [name: string]: string | string[] }, host: string): void {
    function _setCookie(value: string) {
        let cookies: string[] = value.trim().split(';');
        let cookie = Object.create(null);
        [cookie.name, cookie.value] = cookies[0].trim().split('=', 2);
        for (let i = 1; i < cookies.length; i++) {
            const [k, v] = cookies[i].trim().split('=', 2);
            cookie[k.toUpperCase()] = v;
        }
        // Tomcat can return SetCookie2 with path wrapped in "
        if (cookie.PATH) {
            const n = cookie.PATH.length;
            if (n > 2 && cookie.PATH.charAt(0) === '"' && cookie.PATH.charAt(n - 1) === '"') {
                cookie.PATH = cookie.PATH.substr(1, n - 2);
            }
        }
        else {
            cookie.PATH = '/';
        }
        if (cookie.EXPIRES) {
            cookie.EXPIRES = Date.parse(cookie.EXPIRES);
        }
        if (cookie.DOMAIN) {
            cookie.DOMAIN = cookie.DOMAIN.toLowerCase();
        }
        else {
            cookie.DOMAIN = host;
        }
        cookie.SECURE = (cookie.SECURE !== undefined);
        if (cookieManager[cookie.DOMAIN] === undefined) {
            cookieManager[cookie.DOMAIN] = Object.create(null);
        }
        cookieManager[cookie.DOMAIN][cookie.name] = cookie;
    }
    for (let name in headers) {
        name = name.toLowerCase();
        if ((name === 'set-cookie') || (name === 'set-cookie2')) {
            const value = headers[name];
            (typeof value === 'string' ? [value] : value).forEach(_setCookie);
        }
    }
}

export function getCookie(host: string, path: string, secure: boolean) {
    let cookies: string[] = [];
    for (const domain in cookieManager) {
        if (host.indexOf(domain) > -1) {
            const names: string[] = [];
            for (const name in cookieManager[domain]) {
                const cookie = cookieManager[domain][name];
                if (cookie.EXPIRES && ((new Date()).getTime() > cookie.EXPIRES)) {
                    names.push(name);
                }
                else if (path.indexOf(cookie.PATH) === 0) {
                    if (((secure && cookie.SECURE) ||
                        !cookie.SECURE) && (cookie.value !== null)) {
                        cookies.push(cookie.name + '=' + cookie.value);
                    }
                }
            }
            for (let i = 0, n = names.length; i < n; ++i) {
                delete cookieManager[domain][names[i]];
            }
        }
    }
    if (cookies.length > 0) {
        return cookies.join('; ');
    }
    return '';
}