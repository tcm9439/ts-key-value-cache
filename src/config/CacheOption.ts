import { Integer } from "@/util/CommonTypes.js";
import { CacheType, TimeoutMode } from "@/types/index.js";
import { QueueConfig } from "./QueueConfig.js";
import { InvalidConfigException } from "@/exception/index.js";
import { isPositiveInteger } from "@/util/CommonConstrains.js";

export class CacheOption {
    /**
     * Default ttl (seconds) of key-value pair if null ttl is supply when put()
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

    public set defaultTTL(value: Integer | undefined){
        if (value === undefined){
            return
        }
        if (!isPositiveInteger(value, true)){
            throw new InvalidConfigException("Default TTL must be undefined (don't need to call setter) or a positive integer.")
        }
        if (value === 0){
            this._defaultTTL = undefined;
        } else {
            this._defaultTTL = value;
        }
    }

    public get defaultTTL(): Integer | undefined {
        return this._defaultTTL;
    }

    public set maxSize(value: Integer | undefined){
        if (value === undefined){
            return
        }
        if (!isPositiveInteger(value)){
            throw new InvalidConfigException("Max size must be positive integer.")
        }
        this._maxSize = value;
    }

    public get maxSize(): Integer | undefined {
        return this._maxSize;
    }

    public set queueConfigs(queueConfigs: QueueConfig[] | undefined){
        if (queueConfigs === undefined){
            return
        }
        if (queueConfigs.length <= 0){
            throw new InvalidConfigException("You must have one or more queues.");
        }
        this._queueConfigs = queueConfigs;
    }

    public get queueConfigs(): QueueConfig[] | undefined {
        return this._queueConfigs
    }
}