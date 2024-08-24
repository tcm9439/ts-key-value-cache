import { KeyValueCacheMap } from "./KeyValueCacheMap.js"
import { CacheItemIndex, orderByExpiredTSScoreFunction, CachedValue } from "@/types/index.js"
import { Integer } from "@/util/CommonTypes.js"
import { IMapStorage } from "./IMapStorage.js"
import MinHeap from "min-heap"

/**
 * A extant of MAP which use a min-heap to store a index of item's expireTS
 * to achieve faster expired item management.
 * Support arbitrary ttl.
 *
 * !!! Important !!!
 * delete(key) won't remove the index as it require a O(N) operation to search for the index with the given key.
 * The index (of deleted item) only got remove when clearExpiredItems() / deleteFirstExpiredItem() / rebuildIndex() is called.
 */
export class KeyValueCacheHeap<V> extends KeyValueCacheMap<V> {
    /**
     * The index for all cache item that will expire (has ttl & expireTS)
     * except the one that will expire first (_smallestExpiredTSItem)
     */
    private _itemExpiredTSIndexHeap: MinHeap<CacheItemIndex> = new MinHeap(orderByExpiredTSScoreFunction)
    /**
     * The cache item which will expire first.
     * For fast check if every items are not expired yet.
     * This item will not exists in _itemExpiredTSIndexHeap
     * Null if no item is going to expire.
     */
    private _smallestExpiredTSItem: CacheItemIndex | null = null

    constructor(defaultTTL?: Integer, maxSize?: Integer, storage?: IMapStorage<V>) {
        super(defaultTTL, maxSize, false, storage)
    }

    /**
     * Add the index to the heap for a more effective housekeep
     * Complexity:
     *      - O(1) to insert the value
     *      - O(log N) to insert the index
     *      - Overall: O(log N)
     * @param key
     * @param value
     * @param ttl
     */
    put(key: string, value: V, ttl?: number | undefined): void {
        super.put(key, value, ttl)
        let expireTS = this.getStoredItem(key)?.expireTS

        if (expireTS != undefined) {
            // this item will expire
            if (this._smallestExpiredTSItem == null) {
                // no current smallest, take the place
                this._smallestExpiredTSItem = new CacheItemIndex(key, expireTS)
            } else {
                if (expireTS < this._smallestExpiredTSItem.expiredTS) {
                    // this item should be the smallest

                    // put the current smallest back to the heap
                    this._itemExpiredTSIndexHeap.insert(this._smallestExpiredTSItem)

                    // take the place of the smallest
                    this._smallestExpiredTSItem = new CacheItemIndex(key, expireTS)
                } else {
                    // the smallest remains
                    // put the new item to the heap
                    this._itemExpiredTSIndexHeap.insert(new CacheItemIndex(key, expireTS))
                }
            }
        }
    }

    indexSize(): Integer {
        return this._itemExpiredTSIndexHeap.size
    }

    /**
     * Clear the cache values and the index
     */
    clear(): void {
        super.clear()
        this._itemExpiredTSIndexHeap.clear()
        this._smallestExpiredTSItem = null
    }

    /**
     * Complexity:
     *      O(k log N) where k is the number of expired item
     */
    clearExpiredItems(): void {
        // pop out the item with the smallest expired ts & remove it
        // stop when the next one has not yet expired
        while (this._smallestExpiredTSItem != null && this._smallestExpiredTSItem.expiredTS < Date.now()) {
            if (CachedValue.hasExpired(this.getStoredItem(this._smallestExpiredTSItem.key))) {
                // is still the same item
                this.delete(this._smallestExpiredTSItem.key)
            }
            this._smallestExpiredTSItem = this._itemExpiredTSIndexHeap.removeHead()
        }
    }

    deleteFirstExpiredItem(): void {
        let deleteOneItem = false
        while (
            !deleteOneItem && // stop when one item is deleted
            this._smallestExpiredTSItem != null && // there is a smallest expired item
            this._smallestExpiredTSItem.expiredTS < Date.now() // the smallest item has expired
        ) {
            if (CachedValue.hasExpired(this.getStoredItem(this._smallestExpiredTSItem.key))) {
                // the item get by the _smallestExpiredTSItem.key is still the same item
                this.delete(this._smallestExpiredTSItem.key)
                deleteOneItem = true
            }
            this._smallestExpiredTSItem = this._itemExpiredTSIndexHeap.removeHead()
        }
    }

    /**
     * Complexity: O(N log N)
     */
    rebuildIndex(): void {
        let newHeap: MinHeap<CacheItemIndex> = new MinHeap(orderByExpiredTSScoreFunction)
        let currentCacheItem: CachedValue<V> | undefined

        // for each item in the old heap index,
        // check if the item is still in the cache
        // if yes, put it to the new heap

        // put the smallest expired item back to the heap
        if (this._smallestExpiredTSItem != null) {
            this._itemExpiredTSIndexHeap.insert(this._smallestExpiredTSItem)
        }

        while (this._itemExpiredTSIndexHeap.size > 0) {
            let item = this._itemExpiredTSIndexHeap.removeHead()
            currentCacheItem = this.getStoredItem(item.key)
            if (currentCacheItem != undefined) {
                if (CachedValue.hasExpired(currentCacheItem)) {
                    // the item has expired, don't put it back
                    this.delete(item.key)
                } else if (item.expiredTS === currentCacheItem.expireTS) {
                    // the index is still for the same item
                    newHeap.insert(item)
                }
            }
        }

        // replace the old heap with the new one
        this._itemExpiredTSIndexHeap = newHeap
        this._smallestExpiredTSItem = this._itemExpiredTSIndexHeap.removeHead()
    }
}
