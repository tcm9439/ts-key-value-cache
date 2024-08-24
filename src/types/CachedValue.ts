import { Integer, Timestamp } from "@/util/CommonTypes.js"

export class CachedValue<V> {
    private _value: V

    /**
     * Unix timestamp. After this time, this cache is expired.
     * If undefine, never timeout
     */
    private _expireTS?: Timestamp

    private _insertTS: Timestamp

    constructor(value: V, ttl?: Integer) {
        this._value = value
        this._expireTS = ttl != undefined ? Date.now() + ttl * 1000 : undefined
        this._insertTS = Date.now()
    }

    /**
     * Getter value
     * @return {V}
     */
    public get value(): V {
        return this._value
    }

    /**
     * Check if this cache item has already expired,
     * i.e. insertion time + ttl < Date.now
     * @returns true if already expired
     */
    public static hasExpired<V>(cachedValue: CachedValue<V> | undefined): boolean {
        if (cachedValue == undefined) {
            return true
        }
        if (cachedValue?._expireTS != null && cachedValue?._expireTS < Date.now()) {
            return true
        }
        return false
    }

    public get expireTS(): Timestamp | undefined {
        return this._expireTS
    }

    public get insertTS(): Timestamp {
        return this._insertTS
    }
}
