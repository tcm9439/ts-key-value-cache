import { Duration } from "@/util/Duration"
import { IKeyValueCache } from "@/cache/IKeyValueCache"
import { IMapStorage } from "@/cache/IMapStorage"
import { CacheItemIndex } from "@/cache/CacheItemIndex"
import { TimeoutIndexMinHeap } from "@/util/TimeoutIndexMinHeap"

export class KeyValueCacheMap<V> extends IKeyValueCache<V> {
    private _store: IMapStorage<V>
    private _indexMap: Map<string, CacheItemIndex> = new Map()
    private _noTimeoutItemIndex: string[] = []
    private _timeoutHeap: TimeoutIndexMinHeap

    constructor(store: IMapStorage<V>, maxSize: number, defaultTTL?: Duration) {
        super(maxSize, defaultTTL)
        this._timeoutHeap = new TimeoutIndexMinHeap(maxSize)
        this._store = store
    }

    // Override
    clear(): void {
        this._store.clear()
        this._indexMap.clear()
        this._timeoutHeap.clear()
        this._noTimeoutItemIndex = []
    }

    // Override
    clearExpiredItems(): void {
        let minItem = this._timeoutHeap.readMin()
        while (minItem && minItem.hasExpired()) {
            this.delete(minItem.key)
            minItem = this._timeoutHeap.readMin()
        }
    }

    // Override
    delete(key: string): boolean {
        const index = this._indexMap.get(key)
        if (!index) {
            return false
        }
        this._store.delete(key)
        this._indexMap.delete(key)

        // remove index
        if (index.expiredTS) {
            // remove from heap
            this._timeoutHeap.delete(index)
        } else {
            // remove from list
            const idx = this._noTimeoutItemIndex.indexOf(key)
            if (idx !== -1) {
                this._noTimeoutItemIndex.splice(idx, 1)
            }
        }
        return true
    }

    // Override
    deleteFirstExpiredItem(): void {
        const firstExpiredItem = this._timeoutHeap.readMin()
        if (!firstExpiredItem) {
            // no item with expiredTS
            // remove the first item in the un-expired list
            if (this._noTimeoutItemIndex.length > 0) {
                this.delete(this._noTimeoutItemIndex[0])
            }
        } else {
            // remove the item with min expiredTS
            this.delete(firstExpiredItem.key)
        }
    }

    // Override
    get(key: string): V | null {
        const index = this._indexMap.get(key)
        if (!index) {
            return null
        }
        if (index.hasExpired()) {
            this.delete(key)
            return null
        }
        return this._store.get(key)
    }

    // Override
    put(
        key: string,
        value: V,
        param?: {
            ttl?: Duration
            noTtl?: boolean
        }
    ): void {
        const oriValue = this.get(key)
        if (oriValue === null) {
            if (this.size() >= this.maxSize) {
                this.deleteFirstExpiredItem()
            }
        } else {
            this.delete(key)
        }

        const finalTtl = param?.noTtl ? null : param?.ttl || this.defaultTTL
        const index = CacheItemIndex.fromTtl(key, finalTtl)
        this._store.set(key, value)
        this._indexMap.set(key, index)
        if (index.expiredTS === null) {
            this._noTimeoutItemIndex.push(key)
        } else {
            this._timeoutHeap.insert(index)
        }
    }

    // Override
    size(): number {
        return this._store.size()
    }
}
