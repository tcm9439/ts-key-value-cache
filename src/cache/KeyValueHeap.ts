import { KeyValueCacheMap } from "@/cache/KeyValueCacheMap";
import { CacheItemIndex, orderByExpiredTSScoreFunction } from "@/types";
import { Integer } from "@/util/CommonTypes";
import { IMapStorage } from "@/cache/IMapStorage";
import MinHeap from "min-heap";

/**
 * A extant of MAP which use a min-heap to store a index of item's expireTS
 * to achieve faster expired item management. 
 * Support arbitrary ttl.
 * 
 * delete(key) won't remove the index as it require a O(N) operation to search for the index with the given key. It only got remove when clearExpiredItems() is called.
 */
export class KeyValueCacheHeap<V> extends KeyValueCacheMap<V>{
    /**
     * The index for all cache item that will expire (has ttl & expireTS)
     */
    private _itemExpiredTSIndexHeap: MinHeap<CacheItemIndex> = new MinHeap(orderByExpiredTSScoreFunction);
    /**
     * The cache item which will expire first.
     * For fast check if every items are not expired yet.
     * This item will not show up in _itemExpiredTSIndexHeap
     */
    private _smallestExpiredTSItem: CacheItemIndex | null = null;

    constructor(defaultTTL?: Integer, maxSize?: Integer, storage?: IMapStorage<V>) {
        super(defaultTTL, maxSize, false, storage);
    }

    /**
     * See IKeyValueCache.
     * Add the index to the heap for a more effective housekeep
     * Complexity: O(log N) to inset the index as well
     * @param key 
     * @param value 
     * @param ttl 
     */
    put(key: string, value: V, ttl?: number | undefined): void {
        super.put(key, value, ttl);
        let expireTS = this.getStoredItem(key)?.expireTS;

        if (expireTS != undefined){
            // this item will expire
            if (this._smallestExpiredTSItem == null){
                // no current smallest, take the place
                this._smallestExpiredTSItem = new CacheItemIndex(key, expireTS);
            } else {
                if (expireTS < this._smallestExpiredTSItem.expiredTS){
                    // this item should be the smallest
                    this._itemExpiredTSIndexHeap.insert(this._smallestExpiredTSItem);
                    this._smallestExpiredTSItem = new CacheItemIndex(key, expireTS);
                } else {
                    // the smallest remains
                    this._itemExpiredTSIndexHeap.insert(new CacheItemIndex(key, expireTS));
                }
            }
        }
    }

    /**
     * See IKeyValueCache.
     * Clear the index as well.
     */
    clear(): void {
        super.clear();
        this._itemExpiredTSIndexHeap.clear();
        this._smallestExpiredTSItem = null;
    }

    /**
     * See IKeyValueCache.
     * Complexity: O(k log N) where k is the number of expired item
     */
    clearExpiredItems(): void {
        // pop out the item with the smallest expired ts & remove it
        // stop when the next one has not yet expired
        while (this._smallestExpiredTSItem != null && this._smallestExpiredTSItem.expiredTS < Date.now()){
            if (this.getStoredItem(this._smallestExpiredTSItem.key)?.hasExpired()){
                // is still the same item
                this.delete(this._smallestExpiredTSItem.key);
            }
            this._smallestExpiredTSItem = this._itemExpiredTSIndexHeap.removeHead();
        }
    }
}