import { Timestamp } from "@/util/CommonTypes.js";

/**
 * Index to keep in the heap / queue.
 * Where expiredTS is the order key and key is used to id the cache item from the cache store.
 */
export class CacheItemIndex {
    private _expiredTS: Timestamp;
    private _key: string;

    constructor(key: string, expiredTS: number){
        this._expiredTS = expiredTS
        this._key = key
    }

    /**
     * The helper function for the score function
     * to order the index item by expiredTS in ascending.
     * @param another another CacheItemIndex to compare to
     * @returns positive if this item expire later than another
     */
    compare(another: CacheItemIndex): number {
        return this.expiredTS - another.expiredTS;
    }

    /**
     * Getter expiredTS
     * @return {Timestamp}
     */
	public get expiredTS(): Timestamp {
		return this._expiredTS;
	}

    /**
     * Getter key
     * @return {string}
     */
	public get key(): string {
		return this._key;
	}
}

/**
 * The function to pass in to the constructor of the heap. 
 * So the the index can be order by the expireTS in ascending.
 * @param itemA 
 * @param itemB 
 * @returns 
 */
export function orderByExpiredTSScoreFunction(itemA: CacheItemIndex, itemB: CacheItemIndex){
    return itemA.compare(itemB);
}