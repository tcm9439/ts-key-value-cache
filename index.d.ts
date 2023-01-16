export declare class CacheFactory<T> {
    static make<T>(options: CacheOption): IKeyValueCache<T>;
    private static checkConfig;
}

export declare class CacheOption {
    /**
     * Default ttl (seconds) of key-value pair if no ttl is supply when put()
     * If undefined, never timeout
     */
    private _defaultTTL?;
    /**
     * Max num of key-value pair to store.
     * If undefined, no limit
     */
    private _maxSize?;
    /**
     * How/When to delete expired cache item
     */
    private _timeoutMode;
    /**
     * Which cache implementation to use
     */
    private _cacheType;
    /**
     * The config for the queues if use CacheType.Queues
     */
    private _queueConfigs?;
    constructor(cacheType?: CacheType);
    /**
     * Getter timeoutMode
     * @return {TimeoutMode }
     */
    get timeoutMode(): TimeoutMode;
    /**
     * Setter timeoutMode
     * @param {TimeoutMode } value
     */
    set timeoutMode(value: TimeoutMode);
    /**
     * Getter cacheType
     * @return {CacheType }
     */
    get cacheType(): CacheType;
    set defaultTTL(value: Integer);
    get defaultTTL(): Integer | undefined;
    set maxSize(value: Integer);
    get maxSize(): Integer | undefined;
    set queueConfigs(queueConfigs: QueueConfig[]);
    get queueConfigs(): QueueConfig[] | undefined;
}

export declare enum CacheType {
    /**
     * Simple JS Map.
     * Support arbitrary ttl.
     */
    MAP = 0,
    /**
     * A extant of MAP which use a min-heap for faster expired item management.
     * Support arbitrary ttl.
     *
     * If only a few cache item will time out, use MAP instead.
     */
    HEAP = 1,
    /**
     * A extant of MAP which use multiple FIFO queues for expired item management.
     * Each with a fixed ttl.
     * Can add item that won't expired.
     *
     * If there are many possible ttl values, use MAP instead.
     * If there is only one queue, use MAP or HEAP instead.
     */
    QUEUES = 2
}

/**
 * A key-value cache with string as key and value of any type.
 * Support
 * - ttl management
 * - size control which remove exceed key-value pair in a FIFO manner
 */
export declare abstract class IKeyValueCache<V> {
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
    /**
     * Whether to emit one timeout for each
     */
    protected emitIndividualTimeout: boolean;
    constructor(defaultTTL?: Integer, maxSize?: Integer, emitIndividualTimeout?: boolean);
    /**
     * Check if this cache is full.
     * @returns true if is full
     */
    protected isFull(): boolean;
    /**
     * Remove the timeout item if it is still the ori item (not replaced by a new item with the same key).
     * The callback function for the individual timeout.
     */
    protected removeTimeoutItem(key: string): void;
    /**
     * Check if the item with the given key has already expired
     * @param key
     */
    protected abstract hasExpired(key: string): boolean | undefined;
    /**
     * Return value if found in cache.
     * Otherwise, return undefined
     * @param key
     */
    abstract get(key: string): V | undefined;
    /**
     * Put the item into cache.
     * If there is already a cache with the same key, this will replace the old one.
     * @param key
     * @param value
     * @param ttl optional. If not given (undefined): will not expire. If given & is null: use this.defaultTTL
     */
    abstract put(key: string, value: V, ttl?: number): void;
    /**
     * Delete the item from cache with the given key if exists.
     * @param key key for item to delete
     * @returns true if the item exists and is deleted. Otherwise, false
     */
    abstract delete(key: string): boolean;
    /**
     * Delete all items in this cache.
     */
    abstract clear(): void;
    /**
     * Total number of item in this cache
     */
    abstract size(): Integer;
    /**
     * Delete all expired items in the cache.
     * Can be call to reduce cache size.
     */
    abstract clearExpiredItems(): void;
}

declare type Integer = number;

export declare class QueueConfig {
    private _size?;
    /**
     * 0 stands for no ttl
     */
    private _ttl;
    /**
     *
     * @param ttl undefined stands for no ttl
     * @param size
     */
    constructor(ttl?: Integer, size?: Integer);
    /**
     * Getter size
     * @return {Integer}
     */
    get size(): Integer | undefined;
    /**
     * Getter ttl
     */
    get ttl(): Integer;
}

export declare enum TimeoutMode {
    /**
     * Check if the cache item is expired when get(key_of_that_item) is call
     */
    ON_GET_ONLY = 0,
    /**
     * Apart from the checking onGet, each item has its own timeout function emits
     * so that the cache is always at its minium required size.
     * Should only used if there are only a few items.
     * Only applicable to MAP type as I believe calling clearExpiredItems() is more effective for the other type.
     */
    INDIVIDUAL_TIMEOUT = 1
}

export { }
