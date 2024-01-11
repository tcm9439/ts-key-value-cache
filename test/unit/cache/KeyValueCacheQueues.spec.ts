import { expect, describe, it, vi } from "vitest";
import { KeyValueCacheQueues, TimeoutQueue } from "@/cache";
import { QueueConfig } from "@/config";
import { CacheItemIndex } from "@/types";
import { Integer } from "@/util/CommonTypes.js";
import { cacheContentEqual } from "@test/util/assert.js";
import { MockCurrentTimeState, mockTimeByState } from "@test/util/mockTime.js";
import { Queue } from "@/util/Queue.js";

/**
 * Check if the index are as expected
 * Won't modify the index queues
 */
function indexOrderEqual<T>(cache:KeyValueCacheQueues<T>, expectedIndexOrder: Map<Integer, string[]>): boolean {
    for (const [ttl, indexes] of expectedIndexOrder.entries()){
        let thisTimeoutQueue: TimeoutQueue | undefined = cache["_timeoutQueues"].get(ttl);
        if (thisTimeoutQueue == undefined){
            return false;
        } else {
            let thisQueue: Queue<CacheItemIndex> = thisTimeoutQueue["_queue"];
            let thisQueueAsArr: CacheItemIndex[] = thisQueue["_store"];
            if (thisQueueAsArr.length !== indexes.length){
                return false;
            }
            for (let i = 0; i < thisQueueAsArr.length; i++){
                if (thisQueueAsArr[i].key !== indexes[i]){
                    return false;
                }
            }
        }
    }
    return true;
}

function getQueueConfigForTest(){
    let queueConfigs: QueueConfig[] = []
    queueConfigs.push(new QueueConfig(undefined, 3));
    queueConfigs.push(new QueueConfig(10, 3));
    queueConfigs.push(new QueueConfig(30, 3));
    queueConfigs.push(new QueueConfig(60, 3));
    return queueConfigs;
}

describe("KeyValueCacheQueues invalid config", () => {
    let cache: KeyValueCacheQueues<string>;
    let queueConfigs: QueueConfig[];

    it("null config", () => {
        expect(() => {
            cache = new KeyValueCacheQueues(undefined);
        }).toThrowError("No queue config is supplied.");
        
        expect(() => {
            cache = new KeyValueCacheQueues([]);
        }).toThrowError("No queue config is supplied.");
    })

    it("duplicated ttl", () => {
        queueConfigs = getQueueConfigForTest();
        queueConfigs.push(new QueueConfig(10, 4));
        expect(() => {
            cache = new KeyValueCacheQueues(queueConfigs);
        }).toThrowError("Require unique ttl for each queue.");
    })
})

describe("KeyValueCacheQueues", () => {
    let cache: KeyValueCacheQueues<string>;
    let expectedCache: Map<string, string>;
    let expectedIndexOrder: Map<Integer, string[]>; // ttl => keys

    beforeEach(() => {
        let queueConfigs: QueueConfig[] = getQueueConfigForTest();
        cache = new KeyValueCacheQueues(queueConfigs);
        expectedIndexOrder = new Map();
        expectedCache = new Map();
        for (const config of queueConfigs){
            expectedIndexOrder.set(config.ttl, []);
        }
    })

    it("check if put() & get() keeps expected store + index", () => {
        cache.put("A", "aa"); // forever
        expectedCache.set("A", "aa");
        expectedIndexOrder.get(0)?.push("A");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));

        cache.put("B", "bb", 10);
        expectedCache.set("B", "bb");
        expectedIndexOrder.get(10)?.push("B");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));

        cache.put("C", "cc", 10);
        expectedCache.set("C", "cc");
        expectedIndexOrder.get(10)?.push("C");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));

        cache.put("D", "dd", 30);
        expectedCache.set("D", "dd");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));

        cache.put("C", "new cc", 10);
        expectedCache.set("C", "new cc");
        expectedIndexOrder.get(10)?.push("C");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));
    })

    it("invalid ttl", () => {
        expect(() => {
            cache.put("error", "throw!", 999);
        }).toThrowError();
    })

    it("maxSize maintain", () => {
        cache.put("A", "aa"); // forever
        cache.put("B", "bb", 10); // be pushed out
        cache.put("C", "cc", 10);
        cache.put("D", "dd", 10);
        cache.put("E", "ee", 10);

        expectedCache.set("A", "aa");
        expectedCache.set("C", "cc");
        expectedCache.set("D", "dd");
        expectedCache.set("E", "ee");
        
        expectedIndexOrder.get(0)?.push("A");
        expectedIndexOrder.get(10)?.push("B"); // not removed yet
        expectedIndexOrder.get(10)?.push("C");
        expectedIndexOrder.get(10)?.push("D");
        expectedIndexOrder.get(10)?.push("E");

        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));
    })

    it("clear", () => {
        cache.put("A", "aa");
        cache.put("B", "bb", 10);
        cache.put("C", "cc", 60);

        cache.clear()
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));
    })

    it("clearExpiredItems", () => {
        let fakeNow = 1673519400;
        mockTimeByState();

        MockCurrentTimeState.time = fakeNow;
        cache.put("A", "aa"); // forever
        expectedCache.set("A", "aa");
        expectedIndexOrder.get(0)?.push("A");

        cache.put("B", "bb", 60);
        expectedCache.set("B", "bb");
        expectedIndexOrder.get(10)?.push("B");

        cache.put("C", "cc", 10);
        expectedCache.set("C", "cc");
        expectedIndexOrder.get(10)?.push("C");

        cache.put("D", "dd", 60);
        expectedCache.set("D", "dd");
        expectedIndexOrder.get(10)?.push("D");

        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));

        MockCurrentTimeState.time = fakeNow + 15*1000;
        // only C timeout
        cache.clearExpiredItems();
        expectedCache.delete("C");
        expectedIndexOrder.get(15)?.pop();
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder)); // B & old D

        cache.put("D", "new dd", 60);
        expectedCache.set("D", "new dd");
        expectedIndexOrder.get(60)?.push("D");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder)); // B & old D & new D

        MockCurrentTimeState.time = fakeNow + 65*1000;
        // B timeout & old D timeout
        cache.clearExpiredItems();
        expectedCache.delete("B");
        expectedIndexOrder.get(60)?.pop(); // B
        expectedIndexOrder.get(60)?.pop(); // old D
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder)); // new D

        MockCurrentTimeState.time = fakeNow + 2000*1000;
        // new D timeout
        cache.clearExpiredItems();
        expectedCache.delete("D");
        expectedIndexOrder.get(60)?.pop(); // D
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        expect(indexOrderEqual<string>(cache, expectedIndexOrder));
    })
})