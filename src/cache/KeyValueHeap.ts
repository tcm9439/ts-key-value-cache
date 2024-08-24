import { CacheItemIndex, orderByExpiredTSScoreFunction, CachedValue } from "@/types/index.js"
import { Integer, NullableNumber } from "@/util/CommonTypes.js"
import { IMapStorage } from "./IMapStorage.js"
import MinHeap from "min-heap"
import { Queue } from "@/util/Queue.js"
import { IKeyValueCache } from "@/cache/IKeyValueCache.js"
import { MapStorageImpl } from "@/cache/MapStorageImpl.js"
import { isPositiveInteger } from "@/util/CommonConstrains.js"
import { max } from "lodash"

/**
 * Use a min-heap to store a index of item's expireTS to achieve faster expired item management.
 * Support arbitrary ttl.
 *
 * !!! Important !!!
 * delete(key) won't remove the index as it require a O(N) operation to search for the index with the given key.
 * The index (of deleted item) only got remove when clearExpiredItems() / deleteFirstExpiredItem() / rebuildIndex() is called.
 */
export class KeyValueCacheHeap<V> extends IKeyValueCache<V> {
    private _store: IMapStorage<V>

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

    private _insertOrder: Queue<CacheItemIndex> = new Queue<CacheItemIndex>()

    /**
     * @param defaultTTL default time to live in seconds
     * @param maxSize maximum number of items in the cache
     * @param storage the storage object to use
     */
    constructor(defaultTTL?: Integer, maxSize?: Integer, storage?: IMapStorage<V>) {
        super(defaultTTL, maxSize)
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

    public hasExpired(key: string): boolean | undefined {
        let cacheValue: CachedValue<V> | undefined = this.getStoredItem(key)
        if (cacheValue) {
            return CachedValue.hasExpired(cacheValue)
        }
        return undefined
    }

    /**
     * See parent.
     * Complexity: O(1)
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

    /**
     * Add the index to the heap for a more effective housekeep
     * Complexity:
     *      - O(1) to insert the value
     *      - O(log N) to insert the index
     *      - Overall: O(log N)
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
        let newValue: CachedValue<V> = new CachedValue(value, ttl)

        // delete the old item with the same key (if any), ignore its expireTS
        this._store.delete(key)
        this._store.set(key, newValue)

        // insert to index
        let item = this.getStoredItem(key) as CachedValue<V>
        let cacheItemIndex = new CacheItemIndex(key, item.insertTS, item.expireTS)

        this._insertOrder.enqueue(cacheItemIndex)
        if (item.expireTS != undefined) {
            // this item will expire
            if (this._smallestExpiredTSItem == null) {
                // no current smallest, take the place
                this._smallestExpiredTSItem = cacheItemIndex
            } else {
                if (item.expireTS < this._smallestExpiredTSItem.expiredTS) {
                    // this item should be the smallest

                    // put the current smallest back to the heap
                    this._itemExpiredTSIndexHeap.insert(this._smallestExpiredTSItem)

                    // take the place of the smallest
                    this._smallestExpiredTSItem = cacheItemIndex
                } else {
                    // the smallest remains
                    // put the new item to the heap
                    this._itemExpiredTSIndexHeap.insert(cacheItemIndex)
                }
            }
        }

        if (this.isOverflow()) {
            // remove overflow item
            this.deleteFirstExpiredItem()

            // check again if still overflow
            if (this.isOverflow()) {
                this.deleteFirstInsertedItem()
            }
        }

        if (this.isIndexTooBig()) {
            // if the index is too big, rebuild it
            this.rebuildIndex()
        }
    }

    isIndexTooBig(): boolean {
        let indexSize = max([this._itemExpiredTSIndexHeap.size, this._insertOrder.size()]) as number
        return indexSize > 2 * this.size()
    }

    /**
     * Complexity: O(1)
     */
    delete(key: string): boolean {
        return this._store.delete(key)
    }

    /**
     * Clear the cache values and the index
     */
    clear(): void {
        this._store.clear()
        this._itemExpiredTSIndexHeap.clear()
        this._smallestExpiredTSItem = null
    }

    size(): Integer {
        return this._store.size()
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
        console.log("Deleted one item", this._smallestExpiredTSItem?.key)
    }

    deleteFirstInsertedItem(): void {
        let deleteOneItem = false
        while (!deleteOneItem) {
            // no item is deleted as no item is expired
            // delete the first inserted item
            let key = this._insertOrder.dequeue()
            if (key) {
                let cacheValue = this.getStoredItem(key.key)
                if (cacheValue && cacheValue.insertTS == key.insertTS) {
                    // is the same item
                    this.delete(key.key)
                    break
                }
            } else {
                // no item to delete
                break
            }
        }
    }

    /**
     * Complexity: O(N log N)
     */
    rebuildIndex(): void {
        let newHeap: MinHeap<CacheItemIndex> = new MinHeap(orderByExpiredTSScoreFunction)
        let newInsertOrder: Queue<CacheItemIndex> = new Queue<CacheItemIndex>()
        let currentCacheItem: CachedValue<V> | undefined

        // for each item in the old insert order
        // check if the item is still in the cache
        // if yes, put it to the new heap & insert order

        while (this._insertOrder.size() != 0) {
            let key = this._insertOrder.dequeue()
            if (key) {
                currentCacheItem = this.getStoredItem(key.key)
                if (
                    currentCacheItem &&
                    currentCacheItem.insertTS == key.insertTS &&
                    !CachedValue.hasExpired(currentCacheItem)
                ) {
                    newHeap.insert(key)
                    newInsertOrder.enqueue(key)
                }
            }
        }

        // replace the old heap with the new one
        this._itemExpiredTSIndexHeap = newHeap
        this._insertOrder = newInsertOrder
        this._smallestExpiredTSItem = this._itemExpiredTSIndexHeap.removeHead()
    }
}
