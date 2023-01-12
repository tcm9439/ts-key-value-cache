import { Integer } from "@/types/CommonTypes";

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
    protected defaultTTL?: Integer;
    /**
     * Max num of key-value pair to store.
     * If undefined, no limit
     */
    protected maxSize?: Integer;

    constructor(defaultTTL?: Integer, maxSize?: Integer) {
        this.defaultTTL = defaultTTL;
        this.maxSize = maxSize;
    }

    /**
     * Return value if found in cache.
     * Otherwise, return undefined
     * @param key
     */
    abstract get(key: string): V | undefined;
    /**
     * 
     * @param key 
     * @param value 
     * @param ttl optional. If not given (undefined): will not expire. If given & is null: use this.defaultTTL 
     */
    abstract put(key: string, value: V, ttl?: number): void;
    abstract delete(key: string): boolean;
    abstract clear(): void;
    abstract size(): Integer;
}
