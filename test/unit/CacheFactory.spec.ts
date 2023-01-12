import { CacheFactory } from "@/CacheFactory";
import { CacheOption, CacheType } from '@/CacheOption';
import { IKeyValueCache } from '@/cache/IKeyValueCache';
import { KeyValueCacheMap } from "@/cache/KeyValueCacheMap";

describe("CacheFactory", () => {
    it("make KeyValueCacheMap", () => {
        let options: CacheOption = new CacheOption(CacheType.MAP);
        options.defaultTTL = 600;
        options.maxSize = 100;
        let cacheInstance: IKeyValueCache<string> = CacheFactory.make<string>(options);
        expect(cacheInstance).toBeInstanceOf(KeyValueCacheMap)
    })
})