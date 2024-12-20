import { Timestamp, Integer } from "@/util/CommonTypes.js"
import { Duration } from "@/util/Duration.js"

/**
 * Index to keep in the heap / queue.
 * Where expiredTS is the order key and key is used to id the cache item from the cache store.
 */
export class CacheItemIndex {
    /**
     * When the item is expired.
     * If null, will not be expired.
     */
    private _expiredTS: Timestamp | null = null
    private _key: string
    private _heapIndex: Integer | null = null

    constructor(key: string, expiredTS?: Timestamp) {
        this._expiredTS = expiredTS || null
        this._key = key
    }

    static fromTtl(key: string, ttl?: Duration | null): CacheItemIndex {
        if (!ttl) {
            return new CacheItemIndex(key)
        }
        return new CacheItemIndex(key, Date.now() + ttl.inMilliseconds)
    }

    /**
     * Compare this item with another CacheItemIndex for ordering.
     * @param another another CacheItemIndex to compare to
     * @returns positive if this item expire later than another
     */
    public compare(another: CacheItemIndex): number {
        if (this._expiredTS == null && another._expiredTS == null) {
            return 0
        } else if (this._expiredTS == null) {
            // this will not timeout => another timeout before this
            return 1
        } else if (another._expiredTS == null) {
            // another will not timeout => this timeout before another
            return -1
        } else {
            return this._expiredTS - another._expiredTS
        }
    }

    public hasExpired(): boolean {
        if (this._expiredTS == null) {
            return false
        }
        return Date.now() >= this._expiredTS
    }

    public get key(): string {
        return this._key
    }

    public set expiredTS(value: Timestamp | null) {
        this._expiredTS = value
    }

    public get expiredTS(): Timestamp | null {
        return this._expiredTS
    }

    public get heapIndex(): Integer | null {
        return this._heapIndex
    }

    public set heapIndex(value: Integer | null) {
        this._heapIndex = value
    }
}
