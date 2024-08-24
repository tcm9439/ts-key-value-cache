import { Integer, NullableNumber } from "@/util/CommonTypes.js"

/**
 * A key-value cache with string as key and value of any type.
 * Support
 * - ttl management
 * - size control which remove exceed key-value pair in a FIFO manner
 */
export abstract class IKeyValueCache<V> {
    /**
     * Default ttl (seconds) of key-value pair if no ttl is supply when put()
     * If undefined, never timeout
     */
    protected defaultTTL?: Integer
    /**
     * Max num of key-value pair to store.
     * If undefined, no limit
     */
    protected maxSize?: Integer

    /**
     * Whether to emit one timeout for each
     */
    protected emitIndividualTimeout: boolean = false

    constructor(defaultTTL?: Integer, maxSize?: Integer, emitIndividualTimeout: boolean = false) {
        if (defaultTTL === 0) {
            // won't timeout
            defaultTTL = undefined
        }
        this.defaultTTL = defaultTTL
        this.maxSize = maxSize
        this.emitIndividualTimeout = emitIndividualTimeout
    }

    /**
     * Check if this cache is full (> size).
     * If maxSize is not set, return false
     * If size == maxSize, return false
     * @returns true if is full
     */
    protected isOverflow(): boolean {
        return this.maxSize ? this.size() > this.maxSize : false
    }

    /**
     * Remove the timeout item if it is still the ori item (not replaced by a new item with the same key).
     * The callback function for the individual timeout.
     */
    protected removeTimeoutItem(key: string): void {
        if (this.hasExpired(key)) {
            this.delete(key)
        }
    }

    /**
     * Check if the item with the given key has already expired
     * @param key
     */
    protected abstract hasExpired(key: string): boolean | undefined

    /**
     * Return value if found in cache & it is not yet expired.
     * Otherwise, return undefined
     * @param key
     */
    abstract get(key: string): V | undefined

    /**
     * Put the item into cache.
     * If there is already a cache with the same key, this will replace the old one
     * & the expiredTS will be renew by the new ttl.
     * @param key
     * @param value
     * @param ttl optional. If not given (undefined): will not expire. If given & is null: use this.defaultTTL
     */
    abstract put(key: string, value: V, ttl?: NullableNumber): void

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

    /**
     * Return the number of item in the cache index.
     * This is not the same as the size() method as it only return the number of item in the index.
     */
    abstract indexSize(): Integer

    /**
     * Rebuild the index of the cache.
     * As the delete() method will not remove the index of the item.
     */
    abstract rebuildIndex(): void
}
