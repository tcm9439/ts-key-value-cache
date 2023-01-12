import { Integer, Timestamp } from "./CommonTypes";

export class CachedValue<V> {
    private _value: V;
    /**
     * time to live in seconds
     * If undefine, never timeout
     */
    private _ttl?: Integer;
    /**
     * Unix timestamp. After this time, this cache is expired.
     * If undefine, never timeout
     */
    private _expireTS?: Timestamp;

    constructor(value: V, ttl?: Integer) {
        this._value = value;
        this._ttl = ttl;
        this._expireTS = ttl != undefined ? Date.now() + ttl*1000 : undefined;
    }

    /**
     * Getter value
     * @return {V}
     */
    public get value(): V {
        return this._value;
    }

    /**
     *
     * @returns true if already expired
     */
    public hasExpired(): boolean {
        let now = Date.now();
        if (this._expireTS != null && this._expireTS < now) {
            return true;
        }
        return false;
    }
}
