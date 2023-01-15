export enum CacheType {
    /**
     * Simple JS Map. 
     * Support arbitrary ttl.
     */
    MAP,
    /**
     * A extant of MAP which use a min-heap for faster expired item management. 
     * Support arbitrary ttl.
     * 
     * If only a few cache item will time out, use MAP instead.
     */
    HEAP,
    /**
     * A extant of MAP which use multiple FIFO queues for expired item management. 
     * Each with a fixed ttl.
     * Can add item that won't expired.
     * 
     * If there are many possible ttl values, use MAP instead.
     * If there is only one queue, use MAP or HEAP instead.
     */
    QUEUES
}