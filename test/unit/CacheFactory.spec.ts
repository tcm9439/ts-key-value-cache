import { expect, describe, it } from "vitest"

import { CacheFactory } from "@/CacheFactory.js"
import { CacheOption } from "@/config"
import { IKeyValueCache, KeyValueCacheHeap } from "@/cache"
import { IMapStorage } from "@/cache/IMapStorage.js"
import { MapStorageImpl } from "@/cache/MapStorageImpl.js"

describe("CacheFactory", () => {
    it("checkConfig", () => {
        // expect(() => {
        //     let options: CacheOption = new CacheOption(CacheType.HEAP);
        //     options.timeoutMode = TimeoutMode.INDIVIDUAL_TIMEOUT;
        //     CacheFactory["checkConfig"](options);
        // }).toThrowError("Cannot use TimeoutMode.INDIVIDUAL_TIMEOUT with CacheType other then MAP");
    })

    it("make KeyValueCacheMap", () => {
        // KeyValueCacheMap
        let options: CacheOption = new CacheOption()
        options.defaultTTL = 600
        options.maxSize = 100
        let cacheInstance: IKeyValueCache<string> = CacheFactory.make<string>(options)
        expect(cacheInstance).toBeInstanceOf(KeyValueCacheHeap)

        // use external storage
        let storage: IMapStorage<string> = new MapStorageImpl()
        options = new CacheOption()
        cacheInstance = CacheFactory.make<string>(options, storage)
        expect(cacheInstance).toBeInstanceOf(KeyValueCacheHeap)
    })
})
