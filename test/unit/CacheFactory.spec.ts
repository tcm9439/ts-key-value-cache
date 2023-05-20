import { CacheFactory } from "@/CacheFactory";
import { CacheOption, QueueConfig } from '@/config';
import { IKeyValueCache, KeyValueCacheMap, KeyValueCacheHeap } from '@/cache';
import { CacheType, TimeoutMode } from "@/types";
import { KeyValueCacheQueues } from '@/cache/KeyValueQueues';
import { IMapStorage } from "@/cache/IMapStorage";
import { MapStorageImpl } from "@/cache/MapStorageImpl";

describe("CacheFactory", () => {
    it("checkConfig", () => {
        expect(() => {
            let options: CacheOption = new CacheOption(CacheType.HEAP);
            options.timeoutMode = TimeoutMode.INDIVIDUAL_TIMEOUT;
            CacheFactory["checkConfig"](options);
        }).toThrowError("Cannot use TimeoutMode.INDIVIDUAL_TIMEOUT with CacheType other then MAP");

        expect(() => {
            let options: CacheOption = new CacheOption(CacheType.MAP);
            let queueConfigs: QueueConfig[] = []
            queueConfigs.push(new QueueConfig(10, 20));
            options.queueConfigs = queueConfigs;
            CacheFactory["checkConfig"](options);
        }).toThrowError("Don't need queueConfigs with CacheType other then QUEUES");

        expect(() => {
            let options: CacheOption = new CacheOption(CacheType.QUEUES);
            CacheFactory["checkConfig"](options);
        }).toThrowError("Require queueConfigs with CacheType QUEUES");
    })

    it("make KeyValueCacheMap", () => {
        // KeyValueCacheMap
        let options: CacheOption = new CacheOption(CacheType.MAP);
        options.defaultTTL = 600;
        options.maxSize = 100;
        let cacheInstance: IKeyValueCache<string> = CacheFactory.make<string>(options);
        expect(cacheInstance).toBeInstanceOf(KeyValueCacheMap)

        // KeyValueCacheHeap
        options = new CacheOption(CacheType.HEAP);
        cacheInstance = CacheFactory.make<string>(options);
        expect(cacheInstance).toBeInstanceOf(KeyValueCacheHeap)

        // KeyValueCacheQueues
        options = new CacheOption(CacheType.QUEUES);
        let queueConfigs: QueueConfig[] = []
        queueConfigs.push(new QueueConfig(10, 20));
        queueConfigs.push(new QueueConfig(30, 20));
        options.queueConfigs = queueConfigs;
        cacheInstance = CacheFactory.make<string>(options);
        expect(cacheInstance).toBeInstanceOf(KeyValueCacheQueues)

        // use external storage
        let storage: IMapStorage<string> = new MapStorageImpl();
        options = new CacheOption(CacheType.MAP);
        cacheInstance = CacheFactory.make<string>(options, storage);
        expect(cacheInstance).toBeInstanceOf(KeyValueCacheMap);
    })
})