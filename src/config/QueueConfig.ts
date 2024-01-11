import { Integer } from "@/util/CommonTypes.js";
import { InvalidConfigException } from "@/exception/index.js";
import { isPositiveInteger } from "@/util/CommonConstrains.js";

export class QueueConfig {
    private _size?: Integer;
    /**
     * 0 stands for no ttl
     */
    private _ttl: Integer;

    /**
     * 
     * @param ttl undefined stands for no ttl
     * @param size maximum size of the queue, undefined if no limit
     */
    constructor(ttl?: Integer, size?: Integer){
        if (size && !isPositiveInteger(size)){
            throw new InvalidConfigException("Size must be positive integer.")
        }
        if (ttl && !isPositiveInteger(ttl, true)){
            throw new InvalidConfigException("ttl must be positive integer.")
        }

        this._size = size

        if (ttl === undefined){
            this._ttl = 0;
        } else {
            this._ttl = ttl;
        }
    }

    /**
     * Getter size
     * @return {Integer}
     */
	public get size(): Integer | undefined {
		return this._size;
	}

    /**
     * Getter ttl
     */
	public get ttl(): Integer {
		return this._ttl;
	}
}