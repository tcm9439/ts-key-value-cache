import { expect, describe, it, beforeEach } from "vitest"

import { IMapStorage, KeyValueCacheHeap } from "@/cache"
import { cacheContentEqual } from "@test/util/assert.js"
import { CacheItemIndex, CachedValue } from "@/types"
import { Integer } from "@/util/CommonTypes.js"
import { MockCurrentTimeState, mockTimeByState } from "@test/util/mockTime.js"
import { MapStorageImpl } from "@/cache/MapStorageImpl"

/**
 * Check if the heap first item is as expected.
 * Check the heap size.
 * Won't modify the heap
 */
function indexSizeAndFirstEqual<T>(
    cache: KeyValueCacheHeap<T>,
    expectedSize: Integer,
    expectedFirstKey?: string
): boolean {
    let cacheIndexSize: Integer = cache["_itemExpiredTSIndexHeap"].size

    // -1 for the taken out _smallestExpiredTSItem
    if (cacheIndexSize !== expectedSize - 1) {
        return false
    }

    let cacheFirstIndex: CacheItemIndex | null = cache["_smallestExpiredTSItem"]

    if (expectedFirstKey === undefined && cacheFirstIndex == null) {
        // empty index
        return true
    }

    if (cacheFirstIndex && cacheFirstIndex.key === expectedFirstKey) {
        return true
    }
    return false
}

/**
 * Will pop all item out of the cache heap.
 * Make sure no call to the cache after this function.
 */
function indexOrderEqual<T>(cache: KeyValueCacheHeap<T>, expectedIndexOrder: string[]): boolean {
    let cacheIndexSize: Integer = cache["_itemExpiredTSIndexHeap"].size

    // -1 for the taken out _smallestExpiredTSItem
    if (cacheIndexSize !== expectedIndexOrder.length - 1) {
        return false
    }

    let cacheFirstIndex: CacheItemIndex | null
    for (const key of expectedIndexOrder) {
        cacheFirstIndex = cache["_smallestExpiredTSItem"]
        if (!cacheFirstIndex || cacheFirstIndex.key !== key) {
            return false
        }
        cache["_smallestExpiredTSItem"] = cache["_itemExpiredTSIndexHeap"].removeHead()
    }

    if (cache["_smallestExpiredTSItem"] !== null) {
        return false
    }
    return true
}

describe("KeyValueCacheHeap", () => {
    // never expired + no size limit
    let baseCache: KeyValueCacheHeap<string>
    let baseCacheExpected: Map<string, string>

    beforeEach(() => {
        baseCache = new KeyValueCacheHeap<string>()
        baseCache.put("A", "aaa")
        baseCache.put("B", "bbb")
        baseCache.put("C", "1234")
        baseCacheExpected = new Map<string, string>([
            ["A", "aaa"],
            ["B", "bbb"],
            ["C", "1234"],
        ])
    })

    it("put & get", () => {
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy()
        baseCache.put("A", "new aaa!")
        baseCacheExpected.set("A", "new aaa!")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy()
        expect(baseCache.get("Not in cache")).toBeUndefined()
    })

    it("getStoredItem", () => {
        expect(baseCache["getStoredItem"]("Not in cache")).toBeUndefined()
        let value: CachedValue<string> | undefined = baseCache["getStoredItem"]("A")
        expect(value?.value).toBe("aaa")
    })

    it("put invalid", () => {
        expect(() => {
            baseCache.put("NULL", "")
        }).toThrowError()

        expect(() => {
            baseCache.put("Float ttl", "3.14", 3.14)
        }).toThrowError()

        expect(() => {
            baseCache.put("Negative ttl", "-9", -9)
        }).toThrowError()
    })

    it("size", () => {
        expect(baseCache.size()).toBe(3)
    })

    it("delete", () => {
        baseCache.delete("B")
        baseCacheExpected.delete("B")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy()
    })
})

describe("KeyValueCacheHeap with ttl", () => {
    let fakeNow = 1673519400
    let ttlCache: KeyValueCacheHeap<string>
    let ttlCacheExpected: Map<string, string>

    beforeEach(() => {
        mockTimeByState()
        MockCurrentTimeState.time = fakeNow

        // default ttl = 10s
        ttlCache = new KeyValueCacheHeap<string>(10)
        ttlCache.put("TA", "ta", undefined) // forever
        ttlCache.put("TB", "tb", 60) // 1 minute
        ttlCache.put("TC", "t1234", null) // default = 10s

        ttlCacheExpected = new Map<string, string>([
            ["TA", "ta"],
            ["TB", "tb"],
            ["TC", "t1234"],
        ])
    })

    it("ttl", () => {
        MockCurrentTimeState.time = fakeNow + 5 * 1000
        expect(ttlCache.get("TA")).toBe("ta")

        MockCurrentTimeState.time = fakeNow + 11 * 1000
        expect(ttlCache.get("TC")).toBeUndefined()
        ttlCacheExpected.delete("TC")

        MockCurrentTimeState.time = fakeNow + 30 * 1000
        expect(ttlCache.get("TB")).toBe("tb")

        MockCurrentTimeState.time = fakeNow + 65 * 1000
        expect(ttlCache.get("TB")).toBeUndefined()
        ttlCacheExpected.delete("TB")

        MockCurrentTimeState.time = fakeNow + 70 * 1000
        ttlCache.put("TD", "t-middle", null) // default = 10s
        ttlCacheExpected.set("TD", "t-middle")
        expect(ttlCache.get("TD")).toBe("t-middle")

        MockCurrentTimeState.time = fakeNow + 82 * 1000
        expect(ttlCache.get("TD")).toBeUndefined()
        ttlCacheExpected.delete("TD")

        // afterwards
        MockCurrentTimeState.time = fakeNow + 1000 * 1000
        expect(ttlCache.get("TA")).toBe("ta")
    })

    it("clearExpiredItems", () => {
        MockCurrentTimeState.time = fakeNow + 82 * 1000
        // TB & TC timeout
        ttlCacheExpected.delete("TB")
        ttlCacheExpected.delete("TC")
        ttlCache.clearExpiredItems()
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBeTruthy()
    })

    it("deleteFirstExpiredItem", () => {
        // all items still alive
        MockCurrentTimeState.time = fakeNow + 5 * 1000
        ttlCache.deleteFirstExpiredItem()
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBeTruthy()

        // TC timeout
        MockCurrentTimeState.time = fakeNow + 20 * 1000
        ttlCacheExpected.delete("TC")
        ttlCache.deleteFirstExpiredItem()
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBeTruthy()
    })

    it("deleteFirstExpiredItem2", () => {
        // TC, TB timeout
        // so either TC or TB will be deleted first
        MockCurrentTimeState.time = fakeNow + 82 * 1000
        ttlCache.deleteFirstExpiredItem()
        expect(ttlCache.size()).toBe(2)
    })
})

describe("KeyValueCacheHeap FIFO", () => {
    let fakeNow = 1673519400

    it("deleteFirstInsertedItem", () => {
        // all item will not expire => deleteFirstInsertedItem() when isOverflow()
        let overflowCache: KeyValueCacheHeap<string> = new KeyValueCacheHeap(undefined, 3)
        overflowCache.put("A", "aaa")
        overflowCache.put("B", "bbb")
        overflowCache.put("C", "1234")
        let overflowCacheExpected: Map<string, string> = new Map<string, string>([
            ["A", "aaa"],
            ["B", "bbb"],
            ["C", "1234"],
        ])
        expect(cacheContentEqual(overflowCache, overflowCacheExpected)).toBeTruthy()
        overflowCache.put("Z", "Replace A")
        overflowCacheExpected.set("Z", "Replace A")
        overflowCacheExpected.delete("A")
        expect(cacheContentEqual(overflowCache, overflowCacheExpected)).toBeTruthy()
    })

    it("deleteFirstInsertedItem 2", () => {
        mockTimeByState()
        MockCurrentTimeState.time = fakeNow
        let overflowCache: KeyValueCacheHeap<string> = new KeyValueCacheHeap(undefined, 4)
        overflowCache.put("A", "aaa", 300)
        overflowCache.put("B", "bbb", 300)
        overflowCache.put("C", "ccc", 300)
        overflowCache.put("D", "ddd", 300)
        overflowCache.put("E", "eee", 10)
        overflowCache.put("F", "fff", 300)
        MockCurrentTimeState.time = fakeNow + 20 * 1000
        overflowCache.put("G", "ggg", 300)
        overflowCache.put("H", "hhh", 300)

        let overflowCacheExpected: Map<string, string> = new Map<string, string>([
            ["G", "ggg"],
            ["H", "hhh"],
            ["D", "ddd"],
            ["F", "fff"],
        ])

        expect(cacheContentEqual(overflowCache, overflowCacheExpected)).toBeTruthy()
    })

    it("isIndexTooBig() && rebuildIndex()", () => {
        mockTimeByState()
        MockCurrentTimeState.time = fakeNow
        let overflowCache: KeyValueCacheHeap<string> = new KeyValueCacheHeap(undefined, 2)
        console.log(">>> Put A")
        overflowCache.put("A", "aaa", 100)
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 1
            overflowCache["_itemExpiredTSIndexHeap"].size // 0 (one index in _smallestExpiredTSItem)
        )

        console.log(">>> Put B")
        overflowCache.put("B", "bbb", 100)
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 2
            overflowCache["_itemExpiredTSIndexHeap"].size // 1
        )

        console.log(">>> Put C")
        overflowCache.put("C", "ccc", 100)
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 2
            overflowCache["_itemExpiredTSIndexHeap"].size // 2
        )

        console.log(">>> Put D")
        overflowCache.put("D", "ddd", 100)
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 2
            overflowCache["_itemExpiredTSIndexHeap"].size // 3
        )

        console.log(">>> Put E")
        overflowCache.put("E", "eee", 100)
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 2
            overflowCache["_itemExpiredTSIndexHeap"].size // 4
        )

        console.log(">>> Put F")
        overflowCache.put("F", "fff", 100) // index size = 5 => rebuildIndex()
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 2
            overflowCache["_itemExpiredTSIndexHeap"].size // 5 => 1
            // _smallestExpiredTSItem = E, _itemExpiredTSIndexHeap = [F]
        )
        console.log(">>> Put G")
        overflowCache.put("G", "ggg", 1)
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 2
            overflowCache["_itemExpiredTSIndexHeap"].size // 2
            // _smallestExpiredTSItem = G, _itemExpiredTSIndexHeap = [F, E]
        )
        MockCurrentTimeState.time = fakeNow + 20 * 1000
        console.log(">>> Put H")
        // [G, H] + [F]
        // G => expired
        // _insertOrder = [F, G, H]
        // _smallestExpiredTSItem = F
        // _itemExpiredTSIndexHeap = [E, H]
        overflowCache.put("H", "hhh", 100)
        console.log(
            "overflowCache size",
            overflowCache["_insertOrder"].size(), // 3
            overflowCache["_itemExpiredTSIndexHeap"].size // 2
        )

        let overflowCacheExpected: Map<string, string> = new Map<string, string>([
            ["F", "fff"],
            ["H", "hhh"],
        ])

        expect(cacheContentEqual(overflowCache, overflowCacheExpected)).toBeTruthy()
        expect(overflowCache["_itemExpiredTSIndexHeap"].size).toBeLessThan(5)
        expect(overflowCache["_insertOrder"].size()).toBeLessThan(5)
    })
})

describe("Constructor with external storage", () => {
    // never expired + no size limit
    let baseCache: KeyValueCacheHeap<string>
    let baseCacheExpected: Map<string, string>

    beforeEach(() => {
        let storage: IMapStorage<string> = new MapStorageImpl()
        baseCache = new KeyValueCacheHeap<string>(undefined, undefined, storage)
        baseCache.put("A", "aaa")
        baseCache.put("B", "bbb")
        baseCache.put("C", "1234")
        baseCacheExpected = new Map<string, string>([
            ["A", "aaa"],
            ["B", "bbb"],
            ["C", "1234"],
        ])
    })

    it("put & get", () => {
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy()
        baseCache.put("A", "new aaa!")
        baseCacheExpected.set("A", "new aaa!")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy()
        expect(baseCache.get("Not in cache")).toBeUndefined()
    })
})

describe("KeyValueCacheHeap with Index", () => {
    let cache: KeyValueCacheHeap<string>
    let expectedCache: Map<string, string> = new Map()

    it("put & get & index", () => {
        cache = new KeyValueCacheHeap(100)
        cache.put("A", "aa") // forever => no index
        expectedCache.set("A", "aa")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        indexSizeAndFirstEqual(cache, 1)

        cache.put("B", "bb", 100)
        expectedCache.set("B", "bb")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        // new smaller index
        indexSizeAndFirstEqual(cache, 2, "B")

        cache.put("C", "cc", 60)
        expectedCache.set("C", "cc")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        // replace old smallest index
        indexSizeAndFirstEqual(cache, 3, "C")

        cache.put("D", "dd", 1000)
        expectedCache.set("D", "dd")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        // not replace old smallest index
        indexSizeAndFirstEqual(cache, 4, "C")

        indexOrderEqual(cache, ["C", "B", "D"])
    })

    it("clear", () => {
        cache = new KeyValueCacheHeap(100)
        expectedCache = new Map()
        cache.put("A", "aa")
        cache.put("B", "bb", 100)
        cache.put("C", "cc", 60)

        cache.clear()
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        indexSizeAndFirstEqual(cache, 0)
    })

    it("clearExpiredItems", () => {
        let fakeNow = 1673519400
        mockTimeByState()

        MockCurrentTimeState.time = fakeNow
        cache = new KeyValueCacheHeap(100)
        expectedCache = new Map()
        cache.put("A", "aa") // forever
        expectedCache.set("A", "aa")
        cache.put("B", "bb", 100)
        expectedCache.set("B", "bb")
        cache.put("C", "cc", 60)
        expectedCache.set("C", "cc")
        cache.put("D", "dd", 100)
        expectedCache.set("D", "dd")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        indexSizeAndFirstEqual(cache, 3, "C") // B & C & old D

        MockCurrentTimeState.time = fakeNow + 80 * 1000
        // only C timeout
        cache.clearExpiredItems()
        expectedCache.delete("C")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        indexSizeAndFirstEqual(cache, 2, "B") // B & old D

        cache.put("D", "new dd", 1000)
        expectedCache.set("D", "new dd")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        indexSizeAndFirstEqual(cache, 3, "B") // B & old D & new D

        MockCurrentTimeState.time = fakeNow + 200 * 1000
        // B timeout & old D timeout
        cache.clearExpiredItems()
        expectedCache.delete("B")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        indexSizeAndFirstEqual(cache, 1) // new D

        MockCurrentTimeState.time = fakeNow + 2000 * 1000
        // new D timeout
        cache.clearExpiredItems()
        expectedCache.delete("D")
        expect(cacheContentEqual(cache, expectedCache)).toBeTruthy()
        indexSizeAndFirstEqual(cache, 0)
    })
})
