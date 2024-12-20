import { Integer, Timestamp } from "@/util/CommonTypes.js"
import { Duration } from "@/util/Duration"

/**
 * A key-value cache with string as key and value of any type.
 * Support
 * - ttl management
 * - size control which remove exceed key-value pair in a FIFO manner
 */
export abstract class IKeyValueCache<V> {
    /**
     * Default ttl (seconds) of key-value pair if no ttl is supply when put()
     * If null, never timeout
     */
    protected defaultTTL: Duration | null = null
    /**
     * Max num of key-value pair to store.
     */
    protected maxSize: Integer

    constructor(maxSize: Integer, defaultTTL?: Duration) {
        if (defaultTTL?.inMicroseconds === 0) {
            // won't timeout
            defaultTTL = undefined
        }
        this.defaultTTL = defaultTTL || null
        this.maxSize = maxSize
    }

    /**
     * Check if this cache is full (>= size).
     * @returns true if is full
     */
    isFull(): boolean {
        return this.size() >= this.maxSize
    }

    /**
     * Return value if found in cache & it is not yet expired.
     * Otherwise, return null
     * @param key
     */
    abstract get(key: string): V | null

    /**
     * Put the item into cache.
     * If there is already a cache with the same key, this will replace the old one
     * & the expiredTS will be renew by the new ttl.
     *
     * If the cache is full, the first expired item will be deleted.
     * (If no item is expired, the first item in the cache will be deleted)
     * (As long as there is item with expiredTS, the un-expired item will not be deleted)
     *
     * @param ttl optional. If null: use defaultTTL
     * @param noTtl If true: the item will never expire
     */
    abstract put(
        key: string,
        value: V,
        param?: {
            ttl?: Duration
            noTtl?: boolean
        }
    ): void

    /**
     * Delete the item from cache with the given key if exists.
     * @param key key for item to delete
     * @returns true if the item exists and is deleted. Otherwise, false
     */
    abstract delete(key: string): boolean

    /**
     * Delete all items in this cache.
     */
    abstract clear(): void

    /**
     * Return the total number of item in this cache
     */
    abstract size(): Integer

    /**
     * Delete all expired items in the cache.
     * Can be call to reduce cache size.
     */
    abstract clearExpiredItems(): void

    /**
     * Delete the first expired item in the cache.
     */
    abstract deleteFirstExpiredItem(): void
}
