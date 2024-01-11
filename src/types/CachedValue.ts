import { Integer, Timestamp } from "@/util/CommonTypes";

export class CachedValue<V> {
    private _value: V;

    /**
     * Unix timestamp. After this time, this cache is expired.
     * If undefine, never timeout
     */
    private _expireTS?: Timestamp;

    /**
     * The ID returned by the setTimeout if individualTimeout mode is on & this item has ttl
     */
    private _timeoutID?;

    constructor(value: V, ttl?: Integer, timeoutID?: any) {
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
    public static hasExpired<V>(cachedValue: CachedValue<V> | undefined): boolean {
        if (cachedValue == undefined) {
            return true;
        }
        if (cachedValue?._expireTS != null && cachedValue?._expireTS < Date.now()) {
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
	public get timeoutID(): any | undefined {
		return this._timeoutID;
	}
}
