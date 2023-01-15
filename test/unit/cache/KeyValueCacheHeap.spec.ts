import { KeyValueCacheHeap } from "@/cache";
import { cacheContentEqual } from "@test/util/assert";
import { CacheItemIndex } from '@/types';
import { Integer } from "@/util/CommonTypes";
import { MockCurrentTimeState, mockTimeByState } from "@test/util/mockTime";

/**
 * Check if the heap first item is as expected.
 * Check the heap size.
 * Won't modify the heap
 */
function indexSizeAndFirstEqual<T>(cache:KeyValueCacheHeap<T>,  expectedSize: Integer, expectedFirstKey?: string): boolean {
    let cacheIndexSize: Integer = cache["_itemExpiredTSIndexHeap"].size

    // -1 for the taken out _smallestExpiredTSItem
    if (cacheIndexSize !== expectedSize - 1){
        return false;
    }

    let cacheFirstIndex: CacheItemIndex | null = cache["_smallestExpiredTSItem"];

    if (expectedFirstKey === undefined && cacheFirstIndex == null){
        // empty index
        return true;
    }

    if (cacheFirstIndex && cacheFirstIndex.key === expectedFirstKey){
        return true;
    }
    return false;
}

/**
 * Will pop all item out of the cache heap.
 * Make sure no call to the cache after this function.
 */
function indexOrderEqual<T>(cache:KeyValueCacheHeap<T>, expectedIndexOrder: string[]): boolean {
    let cacheIndexSize: Integer = cache["_itemExpiredTSIndexHeap"].size

    // -1 for the taken out _smallestExpiredTSItem
    if (cacheIndexSize !== expectedIndexOrder.length - 1){
        return false;
    }

    let cacheFirstIndex: CacheItemIndex | null;
    for (const key of expectedIndexOrder){
        cacheFirstIndex = cache["_smallestExpiredTSItem"];
        if (!cacheFirstIndex || cacheFirstIndex.key !== key){
            return false;
        }
        cache["_smallestExpiredTSItem"] = cache["_itemExpiredTSIndexHeap"].removeHead();
    }

    if (cache["_smallestExpiredTSItem"] !== null){
        return false;
    }
    return true;
}

describe("KeyValueCacheHeap", () => {
    let cache: KeyValueCacheHeap<string>;
    let expectedCache: Map<string, string> = new Map();

    it("put & get & index", () => {
        cache = new KeyValueCacheHeap(100);
        cache.put("A", "aa"); // forever => no index
        expectedCache.set("A", "aa");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        indexSizeAndFirstEqual(cache, 1);

        cache.put("B", "bb", 100);
        expectedCache.set("B", "bb");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        // new smaller index
        indexSizeAndFirstEqual(cache, 2, "B");

        cache.put("C", "cc", 60);
        expectedCache.set("C", "cc");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        // replace old smallest index
        indexSizeAndFirstEqual(cache, 3, "C");

        cache.put("D", "dd", 1000);
        expectedCache.set("D", "dd");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        // not replace old smallest index
        indexSizeAndFirstEqual(cache, 4, "C");

        indexOrderEqual(cache, ["C", "B", "D"]);
    })

    it("clear", () => {
        cache = new KeyValueCacheHeap(100);
        expectedCache = new Map();
        cache.put("A", "aa");
        cache.put("B", "bb", 100);
        cache.put("C", "cc", 60);

        cache.clear()
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        indexSizeAndFirstEqual(cache, 0);
    })

    it("clearExpiredItems", () => {
        let fakeNow = 1673519400;
        mockTimeByState()

        MockCurrentTimeState.time = fakeNow;
        cache = new KeyValueCacheHeap(100);
        expectedCache = new Map();
        cache.put("A", "aa"); // forever
        expectedCache.set("A", "aa");
        cache.put("B", "bb", 100);
        expectedCache.set("B", "bb");
        cache.put("C", "cc", 60);
        expectedCache.set("C", "cc");
        cache.put("D", "dd", 100);
        expectedCache.set("D", "dd");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        indexSizeAndFirstEqual(cache, 3, "C"); // B & C & old D

        MockCurrentTimeState.time = fakeNow + 80*1000;
        // only C timeout
        cache.clearExpiredItems();
        expectedCache.delete("C");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        indexSizeAndFirstEqual(cache, 2, "B"); // B & old D

        cache.put("D", "new dd", 1000);
        expectedCache.set("D", "new dd");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        indexSizeAndFirstEqual(cache, 3, "B"); // B & old D & new D

        MockCurrentTimeState.time = fakeNow + 200*1000;
        // B timeout & old D timeout
        cache.clearExpiredItems();
        expectedCache.delete("B");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        indexSizeAndFirstEqual(cache, 1); // new D

        MockCurrentTimeState.time = fakeNow + 2000*1000;
        // new D timeout
        cache.clearExpiredItems();
        expectedCache.delete("D");
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy();
        indexSizeAndFirstEqual(cache, 0);
    })
})