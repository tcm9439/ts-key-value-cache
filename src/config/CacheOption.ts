import { Integer } from "@/util/CommonTypes.js"
import { isPositiveInteger } from "@/util/CommonConstrains.js"
import { Duration } from "@/util/Duration.js"
import { IKeyValueCache } from "@/cache/IKeyValueCache.js"
import { IMapStorage } from "@/cache/IMapStorage.js"
import { KeyValueCacheMap } from "@/cache/KeyValueCacheMap.js"
import { MapStorageImpl } from "@/cache/MapStorageImpl.js"

export class CacheOption<V> {
    static readonly DEFAULT_MAX_SIZE = 100

    /**
     * Default ttl (seconds) of key-value pair if null ttl is supply when put()
     * If null, the item default never timeout
     */
    private _defaultTTL: Duration | null = null

    /**
     * Max num of key-value pair to store.
     */
    private _maxSize: Integer = CacheOption.DEFAULT_MAX_SIZE

    /**
     * The map to store key-value pair
     */
    private _store: IMapStorage<V> = new MapStorageImpl<V>()

    constructor() {}

    public setDefaultTTL(value?: Duration): void {
        if (value == null || value.inMicroseconds <= 0) {
            this._defaultTTL = null
        } else {
            this._defaultTTL = value
        }
    }

    public setMaxSize(value: Integer) {
        if (!isPositiveInteger(value)) {
            throw new Error("Max size must be positive integer.")
        }
        this._maxSize = value
    }

    public setStore(value: IMapStorage<V>) {
        this._store = value
    }

    create(): IKeyValueCache<V> {
        return new KeyValueCacheMap<V>(this._store, this._maxSize, this._defaultTTL || undefined)
    }
}
