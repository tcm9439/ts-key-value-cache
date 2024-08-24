import { Integer } from "@/util/CommonTypes.js"
import { InvalidConfigException } from "@/exception/index.js"
import { isPositiveInteger } from "@/util/CommonConstrains.js"

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
    private _maxSize?: Integer

    constructor() {}

    public set defaultTTL(value: Integer | undefined) {
        if (value === undefined) {
            return
        }
        if (!isPositiveInteger(value, true)) {
            throw new InvalidConfigException(
                "Default TTL must be undefined (don't need to call setter) or a positive integer."
            )
        }
        if (value === 0) {
            this._defaultTTL = undefined
        } else {
            this._defaultTTL = value
        }
    }

    public get defaultTTL(): Integer | undefined {
        return this._defaultTTL
    }

    public set maxSize(value: Integer | undefined) {
        if (value === undefined) {
            return
        }
        if (!isPositiveInteger(value)) {
            throw new InvalidConfigException("Max size must be positive integer.")
        }
        this._maxSize = value
    }

    public get maxSize(): Integer | undefined {
        return this._maxSize
    }
}
