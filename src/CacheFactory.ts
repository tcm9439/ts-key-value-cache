import { IKeyValueCache, KeyValueCacheMap, KeyValueCacheHeap, KeyValueCacheQueues } from "@/cache/";
import { CacheOption } from "@/config/CacheOption";
import { CacheType, TimeoutMode } from "@/types";
import { InvalidConfigException } from "./exception/InvalidConfigException";

export class CacheFactory<T> {
    public static make<T>(options: CacheOption): IKeyValueCache<T> {
        this.checkConfig(options);
        switch (options.cacheType) {
            case CacheType.MAP:
                return new KeyValueCacheMap(
                    options.defaultTTL,
                    options.maxSize,
                    options.timeoutMode === TimeoutMode.INDIVIDUAL_TIMEOUT
                );
            case CacheType.HEAP:
                return new KeyValueCacheHeap(options.defaultTTL, options.maxSize);
            case CacheType.QUEUES:
                return new KeyValueCacheQueues(options.queueConfigs);
        }
    }

    private static checkConfig(options: CacheOption): boolean {
        if (options.cacheType !== CacheType.MAP && options.timeoutMode === TimeoutMode.INDIVIDUAL_TIMEOUT){
            throw new InvalidConfigException(
                "Cannot use TimeoutMode.INDIVIDUAL_TIMEOUT with CacheType other then MAP."
            );
        }
        if (options.cacheType !== CacheType.QUEUES && options.queueConfigs !== undefined){
            throw new InvalidConfigException(
                "Don't need queueConfigs with CacheType other then QUEUES."
            );
        }
        if (options.cacheType === CacheType.QUEUES && options.queueConfigs === undefined){
            throw new InvalidConfigException(
                "Require queueConfigs with CacheType QUEUES."
            );
        }
        return true;
    }
}