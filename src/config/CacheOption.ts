import { Integer } from "@/util/CommonTypes";
import { CacheType, TimeoutMode } from "@/types";
import { QueueConfig } from '@/config/QueueConfig';
import { InvalidConfigException } from "@/exception";
import { isPositiveInteger } from "@/util/CommonConstrains";

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
    private _timeoutMode: TimeoutMode = TimeoutMode.ON_GET_ONLY;

    /**
     * Which cache implementation to use
     */
    private _cacheType: CacheType = CacheType.MAP;

    /**
     * The config for the queues if use CacheType.Queues
     */
    private _queueConfigs?: QueueConfig[];

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

    public set defaultTTL(value: Integer){
        if (!isPositiveInteger(value)){
            throw new InvalidConfigException("Default TTL must be undefined (don't need to call setter) or a positive integer.")
        }
        this._defaultTTL = value;
    }

    // @ts-expect-error
    public get defaultTTL(): Integer | undefined {
        return this._defaultTTL;
    }

    public set maxSize(value: Integer){
        if (!isPositiveInteger(value)){
            throw new InvalidConfigException("Max size must be positive integer.")
        }
        this._maxSize = value;
    }

    // @ts-expect-error
    public get maxSize(): Integer | undefined {
        return this._maxSize;
    }

    public set queueConfigs(queueConfigs: QueueConfig[]){
        if (queueConfigs.length <= 0){
            throw new InvalidConfigException("You must have one or more queues.");
        }
        this._queueConfigs = queueConfigs;
    }

    // @ts-expect-error
    public get queueConfigs(): QueueConfig[] | undefined {
        return this._queueConfigs
    }
}