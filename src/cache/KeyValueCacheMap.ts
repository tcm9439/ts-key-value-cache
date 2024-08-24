import { IKeyValueCache } from "./IKeyValueCache.js"
import { CachedValue } from "@/types/index.js"
import { Integer, NullableNumber } from "@/util/CommonTypes.js"
import { isPositiveInteger } from "@/util/CommonConstrains.js"
import { IMapStorage } from "./IMapStorage.js"
import { MapStorageImpl } from "./MapStorageImpl.js"

export class KeyValueCacheMap<V> extends IKeyValueCache<V> {
    private _store: IMapStorage<V>

    constructor(
        defaultTTL?: Integer,
        maxSize?: Integer,
        emitIndividualTimeout: boolean = false,
        storage?: IMapStorage<V>
    ) {
        super(defaultTTL, maxSize, emitIndividualTimeout)
        if (storage) {
            // use provided storage object
            this._store = storage
        } else {
            // otherwise, use default storage which is a Map
            this._store = new MapStorageImpl<V>()
        }
    }

    protected getStoredItem(key: string): CachedValue<V> | undefined {
        return this._store.get(key)
    }

    /**
     * See parent.
     * Complexity: O(1)
     * @param key
     * @returns
     */
    get(key: string): V | undefined {
        let cacheValue: CachedValue<V> | undefined = this.getStoredItem(key)
        if (cacheValue) {
            // if in cache, check if expired
            if (CachedValue.hasExpired(cacheValue)) {
                this.delete(key)
                return undefined
            } else {
                return cacheValue.value
            }
        }
        return undefined
    }

    protected hasExpired(key: string): boolean | undefined {
        return CachedValue.hasExpired(this._store.get(key))
    }

    /**
     * See parent.
     * Complexity: O(1)
     * @param key
     * @param value
     * @param ttl
     */
    put(key: string, value: V, ttl?: NullableNumber): void {
        // validation
        if (!value) {
            throw new Error("Value cannot be a null")
        }

        if (ttl && !isPositiveInteger(ttl)) {
            throw new Error("Timeout is not a number, or less then or equal to 0")
        } else if (ttl === null) {
            ttl = this.defaultTTL
        }

        // create new item
        let newValue: CachedValue<V>
        if (ttl && this.emitIndividualTimeout) {
            let timeoutID = setTimeout(() => {
                this.removeTimeoutItem(key)
            }, ttl * 1000)
            newValue = new CachedValue(value, ttl, timeoutID)
        } else {
            newValue = new CachedValue(value, ttl)
        }

        // start insert

        // delete the old item with the same key (if any), ignore its expireTS
        this._store.delete(key)
        this._store.set(key, newValue)

        if (this.isOverflow()) {
            // remove overflow item
            this.deleteFirstExpiredItem()
        }

        if (this.indexSize() > 2 * this.size()) {
            // if the index is too big, rebuild it
            this.rebuildIndex()
        }
    }

    /**
     * Complexity: O(1)
     */
    delete(key: string): boolean {
        let item: CachedValue<V> | undefined = this.getStoredItem(key)
        if (this.emitIndividualTimeout && item && item.timeoutID != null) {
            clearTimeout(item?.timeoutID)
        }
        return this._store.delete(key)
    }

    /**
     * Complexity: O(n)
     */
    clear(): void {
        if (this.emitIndividualTimeout) {
            // clear all the timeout
            for (const [key, item] of this._store.entries()) {
                if (item.timeoutID != null) {
                    clearTimeout(item?.timeoutID)
                }
            }
        }
        this._store.clear()
    }

    size(): Integer {
        return this._store.size()
    }

    indexSize(): Integer {
        return 0
    }

    /**
     * Complexity: O(n)
     */
    clearExpiredItems(): void {
        for (const [key, item] of this._store.entries()) {
            if (CachedValue.hasExpired(item)) {
                this._store.delete(key)
            }
        }
    }

    /**
     * Complexity: O(n)
     */
    deleteFirstExpiredItem(): void {
        for (const [key, item] of this._store.entries()) {
            if (CachedValue.hasExpired(item)) {
                this._store.delete(key)
                break
            }
        }
    }

    rebuildIndex(): void {
        // do nothing as no index is used
    }
}
