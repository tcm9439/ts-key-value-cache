import { Integer } from "./types/CommonTypes";

export enum TimeoutMode {
    /**
     * Check if the cache item is expired when get(key_of_that_item) is call
     */
    ON_GET,
    // INDIVIDUAL_TIMEOUT,
    // SCHEDULE_HOUSEKEEP
}

export enum CacheType {
    /**
     * By js map
     */
    MAP
}

export class CacheOption {
    /**
     * Default ttl (seconds) of key-value pair if no ttl is supply when put()
     * If undefined, never timeout
     */
    private _defaultTTL?: Integer
    /**
     * Max num of key-value pair to store.
     * If undefined, no limit
     */
    private _maxSize?: Integer;
    /**
     * How/When to delete expired cache item
     */
    private _timeoutMode: TimeoutMode = TimeoutMode.ON_GET;
    /**
     * Which cache implementation to use
     */
    private _cacheType: CacheType = CacheType.MAP;

    constructor(cacheType: CacheType = CacheType.MAP) {
        this._cacheType = cacheType;
    }

    /**
     * Getter timeoutMode
     * @return {TimeoutMode }
     */
	public get timeoutMode(): TimeoutMode  {
		return this._timeoutMode;
	}

    /**
     * Setter timeoutMode
     * @param {TimeoutMode } value
     */
	public set timeoutMode(value: TimeoutMode ) {
		this._timeoutMode = value;
	}

    /**
     * Getter cacheType
     * @return {CacheType }
     */
	public get cacheType(): CacheType  {
		return this._cacheType;
	}

    /**
     * Setter cacheType
     * @param {CacheType } value
     */
	public set cacheType(value: CacheType ) {
		this._cacheType = value;
	}

    public set defaultTTL(value: Integer){
        this._defaultTTL = value;
    }

    // @ts-expect-error
    public get defaultTTL(): Integer | undefined {
        return this._defaultTTL;
    }

    public set maxSize(value: Integer){
        this._maxSize = value;
    }

    // @ts-expect-error
    public get maxSize(): Integer | undefined {
        return this._maxSize;
    }
}