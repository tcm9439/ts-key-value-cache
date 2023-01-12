import _ from "lodash";

import { IKeyValueCache } from "./IKeyValueCache";
import { CachedValue } from "@/types/CachedValue";
import { Integer } from "@/types/CommonTypes";
import { NullableNumber } from '../types/CommonTypes';

export class KeyValueCacheMap<V> extends IKeyValueCache<V> {
    private _store: Map<string, CachedValue<V>> = new Map<string, CachedValue<V>>();

    constructor(defaultTTL?: Integer, maxSize?: Integer) {
        super(defaultTTL, maxSize);
    }

    get(key: string): V | undefined {
        let cacheValue: CachedValue<V> | undefined = this._store.get(key);
        if (cacheValue) {
            // if in cache, check if expired
            if (cacheValue.hasExpired()) {
                this.delete(key);
                return undefined;
            } else {
                return cacheValue.value;
            }
        }
        return undefined;
    }

    put(key: string, value: V, ttl?: NullableNumber): void {
        if (!value) {
            throw new Error("Value cannot be a null");
        }
        if (ttl && (!_.isInteger(ttl) || ttl < 0)) {
            throw new Error("Timeout is not a number or less then 0");
        } else if (ttl === null){
            ttl = this.defaultTTL
        }

        this._store.set(key, new CachedValue(value, ttl));

        if (this.maxSize && this.size() > this.maxSize) {
            // remove overflow item
            for (const key of this._store.keys()) {
                this._store.delete(key);
                break;
            }
        }
    }

    delete(key: string): boolean {
        return this._store.delete(key);
    }

    clear(): void {
        this._store.clear();
    }

    size(): Integer {
        return this._store.size;
    }
}
