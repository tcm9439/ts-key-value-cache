import { Integer, Timestamp, ID } from "@/util/CommonTypes";

export class CachedValue<V> {
    /**
     * Next sequence number as unique ID for each CachedValue object.
     */
    private static nextItemID: ID = 1;

    // private _itemID: ID;

    private _value: V;

    /**
     * Unix timestamp. After this time, this cache is expired.
     * If undefine, never timeout
     */
    private _expireTS?: Timestamp;

    /**
     * The ID returned by the setTimeout if individualTimeout mode is on & this item has ttl
     */
    private _timeoutID?: NodeJS.Timeout;

    // private static getID(): ID{
    //     return this.nextItemID++;
    // }

    constructor(value: V, ttl?: Integer, timeoutID?: NodeJS.Timeout) {
        // this._itemID = CachedValue.getID();
        this._value = value;
        this._expireTS = ttl != undefined ? Date.now() + ttl*1000 : undefined;
        this._timeoutID = timeoutID;
    }

    /**
     * Getter value
     * @return {V}
     */
    public get value(): V {
        return this._value;
    }

    /**
     * Check if this cache item has already expired,
     * i.e. insertion time + ttl < Date.now
     * @returns true if already expired
     */
    public hasExpired(): boolean {
        if (this._expireTS != null && this._expireTS < Date.now()) {
            return true;
        }
        return false;
    }

    public get expireTS(): Timestamp | undefined {
        return this._expireTS;
    }

    /**
     * Getter timeoutID
     * @return {NodeJS.Timeout}
     */
	public get timeoutID(): NodeJS.Timeout | undefined {
		return this._timeoutID;
	}

    // public isTheSameItem(itemToCompare: CachedValue<V>): boolean {
    //     return this._itemID === itemToCompare._itemID;
    // }

    // /**
    //  * Getter itemID
    //  * @return {ID}
    //  */
	// public get itemID(): ID {
	// 	return this._itemID;
	// }
}
