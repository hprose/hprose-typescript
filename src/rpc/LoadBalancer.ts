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
| hprose/rpc/LoadBalance.ts                                |
|                                                          |
| hprose LoadBalance for TypeScript.                       |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { NextIOHandler, IOHandler } from './HandlerManager';

export interface WeightedURIList {
    [uri: string]: number
}

function parseWeightedURIList(urilist?: WeightedURIList): [string[], number[]] {
    const uris: string[] = [];
    const weights: number[] = [];
    if (urilist) {
        for (const uri in urilist) {
            if (urilist.hasOwnProperty && urilist.hasOwnProperty(uri)) {
                uris.push(uri);
                const weight = urilist[uri] | 0;
                if (weight <= 0) {
                    throw new Error('Wrong weight value.');
                }
                weights.push(weight);
            }
        }
    }
    return [uris, weights];
}

export function getRandomLoadBalanceHandler(urilist?: WeightedURIList): IOHandler {
    const [uris, weights] = parseWeightedURIList(urilist);
    if (weights.length === 0) {
        // Random Load Balance
        return (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
            const uris = context.client.uris;
            const n = uris.length;
            context.uri = uris[Math.floor(Math.random() * n)];
            return next(request, context);
        };
    }
    // Weighted Random Load Balance
    const effectiveWeights = weights.slice();
    return async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const totalWeight = effectiveWeights.reduce((x, y) => x + y);
        const n = uris.length;
        let index = n - 1;
        if (totalWeight > 0) {
            let currentWeight = Math.floor(Math.random() * totalWeight);
            for (let i = 0; i < n; ++i) {
                currentWeight -= effectiveWeights[i];
                if (currentWeight < 0) {
                    index = i;
                    break;
                }
            }
        } else {
            index = Math.floor(Math.random() * n);
        }
        context.uri = uris[index];
        try {
            const response = await next(request, context);
            if (effectiveWeights[index] < weights[index]) {
                effectiveWeights[index]++;
            }
            return response;
        }
        catch(e) {
            if (effectiveWeights[index] > 0) {
                effectiveWeights[index]--;
            }
            throw e;
        }
    };
}

// function gcd(x: number, y: number): number {
//     if (x < y) {
//         [x, y] = [y, x];
//     }
//     while (y !== 0) {
//         [x, y] = [y, x % y];
//     }
//     return x;
// }

export function getRoundRobinLoadBalanceHandler(urilist?: WeightedURIList): IOHandler {
    const [uris, weights] = parseWeightedURIList(urilist);
    if (weights.length === 0) {
        //  Round Robin Load Balance
        let index = -1;
        return (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
            const uris = context.client.uris;
            const n = uris.length;
            if (n > 1) {
                index = (index + 1) % n;
                context.uri = uris[index];
            }
            return next(request, context);
        };
    }

    // // Weighted Round Robin Load Balance
    // const maxWeight = Math.max(...weights);
    // const gcdWeight = weights.reduce(gcd);
    // const n = weights.length;
    // let index = -1;
    // let currentWeight = 0;
    // return (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
    //     while (true) {
    //         index = (index + 1) % n;
    //         if (index === 0) {
    //             currentWeight -= gcdWeight;
    //             if (currentWeight <= 0) {
    //                 currentWeight = maxWeight;
    //             }
    //         }
    //         if (weights[index] >= currentWeight) {
    //             context.uri = uris[index];
    //             return next(request, context);
    //         }
    //     }
    // };

    // Nginx Weighted Round Robin Load Balance
    const effectiveWeights: number[] = weights.slice();
    const n = weights.length;
    const currentWeights: number[] = new Array(n).fill(0);
    return async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const totalWeight = effectiveWeights.reduce((x, y) => x + y);
        let index: number;
        if (totalWeight > 0) {
            let currentWeight: number;
            [currentWeight, index] = effectiveWeights.reduce((previous, current, index) => {
                const currentWeight = (currentWeights[index] += current);
                return (previous[0] < currentWeight) ? [currentWeight, index] : previous;
            }, [-Infinity, -1]);
            currentWeights[index] = currentWeight - totalWeight;
        } else {
            index = Math.floor(Math.random() * n);
        }
        context.uri = uris[index];
        try {
            const response = await next(request, context);
            if (effectiveWeights[index] < weights[index]) {
                effectiveWeights[index]++;
            }
            return response;
        }
        catch(e) {
            if (effectiveWeights[index] > 0) {
                effectiveWeights[index]--;
            }
            throw e;
        }
    };
}

export function getLeastActiveLoadBalanceHandler(urilist?: WeightedURIList): IOHandler {
    const [uris, weights] = parseWeightedURIList(urilist);
    const actives: number[] = [];
    if (weights.length === 0) {
        // Least Active Load Balance
        return async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
            const uris = context.client.uris;
            if (actives.length === 0) {
                actives.length = uris.length;
                actives.fill(0);
            }
            const leastActive = Math.min(...actives);
            const leastActiveIndexes = actives.reduce((indexes, active, index) => {
                if (active === leastActive) {
                    indexes.push(index);
                }
                return indexes;
            }, [] as number[]);
            let index = leastActiveIndexes[0];
            const n = leastActiveIndexes.length;
            if (n > 1) {
                index = leastActiveIndexes[Math.floor(Math.random() * n)];
            }
            context.uri = uris[index];
            actives[index]++;
            try {
                const response = await next(request, context);
                actives[index]--;
                return response;
            }
            catch(e) {
                actives[index]--;
                throw e;
            }
        };
    }
    // Weighted Least Active Load Balance
    const effectiveWeights: number[] = weights.slice();
    actives.length = weights.length;
    actives.fill(0);
    return async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const leastActive = Math.min(...actives);
        const leastActiveIndexes = actives.reduce((indexes, active, index) => {
            if (active === leastActive) {
                indexes.push(index);
            }
            return indexes;
        }, [] as number[]);
        let index = leastActiveIndexes[0];
        const n = leastActiveIndexes.length;
        if (n > 1) {
            const totalWeight = effectiveWeights.reduce((x, y, i) => leastActiveIndexes.indexOf(i) > -1 ? x + y : x, 0);
            if (totalWeight > 0) {
                let currentWeight = Math.floor(Math.random() * totalWeight);
                for (let i = 0; i < n; ++i) {
                    currentWeight -= effectiveWeights[leastActiveIndexes[i]];
                    if (currentWeight < 0) {
                        index = leastActiveIndexes[i];
                        break;
                    }
                }
            } else {
                index = leastActiveIndexes[Math.floor(Math.random() * n)];
            }
        }
        context.uri = uris[index];
        actives[index]++;
        try {
            const response = await next(request, context);
            actives[index]--;
            if (effectiveWeights[index] < weights[index]) {
                effectiveWeights[index]++;
            }
            return response;
        }
        catch(e) {
            actives[index]--;
            if (effectiveWeights[index] > 0) {
                effectiveWeights[index]--;
            }
            throw e;
        }
    };
}
