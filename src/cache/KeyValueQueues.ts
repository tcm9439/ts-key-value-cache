import { KeyValueCacheMap } from "@/cache";
import { InvalidConfigException } from "@/exception";
import { CacheItemIndex, CachedValue } from "@/types";
import { Integer, Timestamp } from "@/util/CommonTypes";
import { QueueConfig } from '@/config';
import { Queue } from "@/util/Queue";
import { IMapStorage } from "@/cache/IMapStorage";

/**
 * Queue (FIFO) for the cache item index by expireTS
 * 
 * delete(key) won't remove the index as it require a O(N) operation to search for the index with the given key. It only got remove when clearExpiredItems() is called.
 */
export class TimeoutQueue {
    /**
     * Queue for the cache item index by expireTS
     * https://github.com/datastructures-js/queue
     */
    private _queue: Queue<CacheItemIndex> = new Queue();
    
    /**
     * Max capacity of this queue.
     * If undefined, means no limit.
     */
    private _maxSize?: Integer;

    constructor(maxSize?: Integer){
        this._maxSize = maxSize;
    }

    clear(): void {
        this._queue.clear();
    }

    /**
     * Find out item that has expired in this queue & delete its index.
     * @returns a list of item key to delete from cache store as it is expired (need to check if the idem it represent is really expired as there may be new value put to the store using the same key)
     */
    clearExpiredItems(): string[] {
        let now: number = Date.now();
        let keysToDelete: string[] = []
        let item: CacheItemIndex | undefined = this._queue.peek(); // doesn't remove
        while (item != undefined){
            if (item.expiredTS <= now){
                item = this._queue.dequeue(); // remove it
                if (item != undefined){
                    keysToDelete.push(item.key);
                }
                item = this._queue.peek();
            } else {
                break;
            }
        }
        return keysToDelete;
    }

    /**
     * If queue is full, pop out the queue first item before insert the new index.
     * @returns the overflow key to remove from store
     */
    push(index: CacheItemIndex): string | undefined {
        if (this._maxSize && this._queue.size() >= this._maxSize){
            return this._queue.dequeue()?.key;
        }
        this._queue.enqueue(index);
        return undefined;
    }
}

/**
 * A extant of MAP which use multiple FIFO queues to store indexes of item's expireTS
 * to achieve faster expired item management. 
 * Each queue with a fixed ttl.
 * Can add item that won't expired.
 * 
 * delete(key) won't remove the index as it require a O(N) operation to search in heap.
 */
export class KeyValueCacheQueues<V> extends KeyValueCacheMap<V>{
    private _timeoutQueues: Map<Integer, TimeoutQueue> = new Map();
    private _availableTTL: Integer[] = []

    constructor(queueConfigs: QueueConfig[] | undefined, storage?: IMapStorage<V>) {
        super(undefined, undefined, false, storage);
        if (queueConfigs === undefined || queueConfigs.length === 0){
            throw new InvalidConfigException("No queue config is supplied.")
        }
        for (const config of queueConfigs){
            if (this._availableTTL.includes(config.ttl)){
                throw new InvalidConfigException("Require unique ttl for each queue.")
            }
            this._availableTTL.push(config.ttl);
            this._timeoutQueues.set(config.ttl, new TimeoutQueue(config.size))
        }
    }

    /**
     * See IKeyValueCache
     * @param key 
     * @param value 
     * @param ttl Under this mode, ttl must be undefined (no TTL) or included in queueConfig
     */
    put(key: string, value: V, ttl?: number): void {
        if (ttl && !this._availableTTL.includes(ttl)){
            throw new InvalidConfigException("Invalid ttl.");
        }

        super.put(key, value, ttl);
        
        // put the index
        let expireTS: Timestamp | undefined = this.getStoredItem(key)?.expireTS;
        let keyToDelete: string | undefined;
        if (ttl && expireTS){
            keyToDelete = this._timeoutQueues.get(ttl)?.push(new CacheItemIndex(key, expireTS));
        } else if (ttl === undefined){
            keyToDelete = this._timeoutQueues.get(0)?.push(new CacheItemIndex(key, Number.MAX_VALUE));
        }
        if (keyToDelete !== undefined){
            this.delete(keyToDelete);
        }
    }

    /**
     * See IKeyValueCache.
     * Clear the index as well.
     */
    clear(): void {
        super.clear()
        for (let queue of this._timeoutQueues.values()){
            queue.clear();
        }
    }

    clearExpiredItems(): void {
        let keysToDelete: string[] = []
        let count = 1;
        for (let queue of this._timeoutQueues.values()){
            keysToDelete = keysToDelete.concat(queue.clearExpiredItems());
        }
        for (const key of keysToDelete){
            if (CachedValue.hasExpired(this.getStoredItem(key))){
                // the key is really pointing to expired item
                // instead of item that get replaced by a new value
                this.delete(key);
            } // else this index refer to a item get replaced => ignore
        }
    }
}