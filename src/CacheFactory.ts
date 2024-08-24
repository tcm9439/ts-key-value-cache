import { IKeyValueCache, KeyValueCacheHeap } from "@/cache/index.js"
import { CacheOption } from "@/config/CacheOption.js"
import { InvalidConfigException } from "@/exception/InvalidConfigException.js"
import { IMapStorage } from "@/cache/IMapStorage.js"

export class CacheFactory<T> {
    public static make<T>(options: CacheOption, storage?: IMapStorage<T>): IKeyValueCache<T> {
        this.checkConfig(options)
        return new KeyValueCacheHeap(options.defaultTTL, options.maxSize, storage)
    }

    private static checkConfig(options: CacheOption): boolean {
        // throw new InvalidConfigException("XXX")
        return true
    }
}
