/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-loadbalance for TypeScript.           |
|                                                          |
| LastModified: Feb 25, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextIOHandler } from '@hprose/rpc-core';

export interface WeightedURIList {
    [uri: string]: number
}

export abstract class WeightedLoadBalance {
    protected readonly uris: string[] = [];
    protected readonly weights: number[] = [];
    public constructor(uriList: WeightedURIList) {
        if (!uriList) {
            throw new Error('uriList cannot be null or undefined');
        }
        for (const uri in uriList) {
            if (!uriList.hasOwnProperty || uriList.hasOwnProperty(uri)) {
                this.uris.push(uri);
                const weight = uriList[uri] | 0;
                if (weight <= 0) {
                    throw new Error('Weight must be great than 0');
                }
                this.weights.push(weight);
            }
        }
        if (this.uris.length === 0) {
            throw new Error('uriList cannot be empty');
        }
    }
    public abstract handler(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array>;
}

export class RandomLoadBalance {
    public handler(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> {
        const uris = context.client.uris;
        const n = uris.length;
        context.uri = uris[Math.floor(Math.random() * n)];
        return next(request, context);
    }
}

export class WeightedRandomLoadBalance extends WeightedLoadBalance {
    private readonly effectiveWeights: number[];
    public constructor(uriList: WeightedURIList) {
        super(uriList);
        this.effectiveWeights = this.weights.slice();
    }
    public handler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const n = this.uris.length;
        let index = n - 1;
        const totalWeight = this.effectiveWeights.reduce((x, y) => x + y);
        if (totalWeight > 0) {
            let currentWeight = Math.floor(Math.random() * totalWeight);
            for (let i = 0; i < n; ++i) {
                currentWeight -= this.effectiveWeights[i];
                if (currentWeight < 0) {
                    index = i;
                    break;
                }
            }
        } else {
            index = Math.floor(Math.random() * n);
        }
        context.uri = this.uris[index];
        try {
            const response = await next(request, context);
            if (this.effectiveWeights[index] < this.weights[index]) {
                this.effectiveWeights[index]++;
            }
            return response;
        }
        catch (e) {
            if (this.effectiveWeights[index] > 0) {
                this.effectiveWeights[index]--;
            }
            throw e;
        }
    }
}

export class RoundRobinLoadBalance {
    private index: number = -1;
    public handler = (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const uris = context.client.uris;
        const n = uris.length;
        if (n > 1) {
            this.index = (this.index + 1) % n;
            context.uri = uris[this.index];
        }
        return next(request, context);
    }
}

function gcd(x: number, y: number): number {
    if (x < y) {
        [x, y] = [y, x];
    }
    while (y !== 0) {
        [x, y] = [y, x % y];
    }
    return x;
}

export class WeightedRoundRobinLoadBalance extends WeightedLoadBalance {
    private readonly maxWeight: number;
    private readonly gcdWeight: number;
    private index: number = -1;
    private currentWeight: number = 0;
    public constructor(uriList: WeightedURIList) {
        super(uriList);
        this.maxWeight = Math.max(...this.weights);
        this.gcdWeight = this.weights.reduce(gcd);
    }
    public handler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const n = this.uris.length;
        while (true) {
            this.index = (this.index + 1) % n;
            if (this.index === 0) {
                this.currentWeight -= this.gcdWeight;
                if (this.currentWeight <= 0) {
                    this.currentWeight = this.maxWeight;
                }
            }
            if (this.weights[this.index] >= this.currentWeight) {
                context.uri = this.uris[this.index];
                return next(request, context);
            }
        }
    }
}

export class NginxRoundRobinLoadBalance extends WeightedLoadBalance {
    private readonly effectiveWeights: number[];
    private readonly currentWeights: number[];
    public constructor(uriList: WeightedURIList) {
        super(uriList);
        const n = this.uris.length;
        this.effectiveWeights = this.weights.slice();
        this.currentWeights = new Array(n).fill(0);
    }
    public handler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const n = this.uris.length;
        let index = -1;
        const totalWeight = this.effectiveWeights.reduce((x, y) => x + y);
        if (totalWeight > 0) {
            let currentWeight: number;
            [currentWeight, index] = this.effectiveWeights.reduce((previous, current, index) => {
                const currentWeight = (this.currentWeights[index] += current);
                return (previous[0] < currentWeight) ? [currentWeight, index] : previous;
            }, [-Infinity, -1]);
            this.currentWeights[index] = currentWeight - totalWeight;
        } else {
            index = Math.floor(Math.random() * n);
        }
        context.uri = this.uris[index];
        try {
            const response = await next(request, context);
            if (this.effectiveWeights[index] < this.weights[index]) {
                this.effectiveWeights[index]++;
            }
            return response;
        }
        catch (e) {
            if (this.effectiveWeights[index] > 0) {
                this.effectiveWeights[index]--;
            }
            throw e;
        }
    }
}

export class LeastActiveLoadBalance {
    private readonly actives: number[] = [];
    public handler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const uris = context.client.uris;
        const n = uris.length;
        if (this.actives.length < n) {
            this.actives.length = n;
            this.actives.fill(0);
        }
        const leastActive = Math.min(...(this.actives.length > n ? this.actives.slice(0, n) : this.actives));
        const leastActiveIndexes: number[] = [];
        for (let i = 0; i < n; ++i) {
            if (this.actives[i] === leastActive) {
                leastActiveIndexes.push(i);
            }
        }
        let index = leastActiveIndexes[0];
        const count = leastActiveIndexes.length;
        if (count > 1) {
            index = leastActiveIndexes[Math.floor(Math.random() * count)];
        }
        context.uri = uris[index];
        this.actives[index]++;
        try {
            const response = await next(request, context);
            this.actives[index]--;
            return response;
        }
        catch (e) {
            this.actives[index]--;
            throw e;
        }
    }
}

export class WeightedLeastActiveLoadBalance extends WeightedLoadBalance {
    private readonly effectiveWeights: number[];
    private readonly actives: number[];
    public constructor(uriList: WeightedURIList) {
        super(uriList);
        const n = this.uris.length;
        this.effectiveWeights = this.weights.slice();
        this.actives = new Array(n).fill(0);
    }
    public handler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const leastActive = Math.min(...this.actives);
        const leastActiveIndexes: number[] = [];
        let totalWeight = 0;
        for (let i = 0; i < this.weights.length; ++i) {
            if (this.actives[i] === leastActive) {
                leastActiveIndexes.push(i);
                totalWeight += this.effectiveWeights[i];
            }
        }
        let index = leastActiveIndexes[0];
        const n = leastActiveIndexes.length;
        if (n > 1) {
            if (totalWeight > 0) {
                let currentWeight = Math.floor(Math.random() * totalWeight);
                for (let i = 0; i < n; ++i) {
                    currentWeight -= this.effectiveWeights[leastActiveIndexes[i]];
                    if (currentWeight < 0) {
                        index = leastActiveIndexes[i];
                        break;
                    }
                }
            } else {
                index = leastActiveIndexes[Math.floor(Math.random() * n)];
            }
        }
        context.uri = this.uris[index];
        this.actives[index]++;
        try {
            const response = await next(request, context);
            this.actives[index]--;
            if (this.effectiveWeights[index] < this.weights[index]) {
                this.effectiveWeights[index]++;
            }
            return response;
        }
        catch (e) {
            this.actives[index]--;
            if (this.effectiveWeights[index] > 0) {
                this.effectiveWeights[index]--;
            }
            throw e;
        }
    }
}