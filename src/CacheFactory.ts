import { KeyValueCacheMap } from "@/cache/KeyValueCacheMap";
import { IKeyValueCache } from '@/cache/IKeyValueCache';
import { CacheOption, CacheType } from "@/CacheOption";

export class CacheFactory<T>{
    public static make<T>(options: CacheOption): IKeyValueCache<T>{
        switch (options.cacheType){
            case CacheType.MAP:
                return new KeyValueCacheMap(options.defaultTTL, options.maxSize)
        }
    }
}