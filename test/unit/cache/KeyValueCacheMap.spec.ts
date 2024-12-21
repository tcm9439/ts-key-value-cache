import { describe, it, expect, beforeEach } from "vitest"
import { MockCurrentTime } from "@test/util/mockTime"
import { KeyValueCacheMap } from "@/cache/KeyValueCacheMap"
import { cacheContentEqual } from "@test/util/assert"
import { MapStorageImpl } from "@/cache/MapStorageImpl"
import { Duration } from "@/util/Duration"

describe("KeyValueCacheMap that all value will not expire", () => {
    let baseCache: KeyValueCacheMap<string>
    let baseCacheExpected: Map<string, string>

    beforeEach(() => {
        baseCache = new KeyValueCacheMap<string>(new MapStorageImpl(), 5)
        baseCache.put("A", "aaa")
        baseCache.put("B", "bbb")
        baseCache.put("C", "1234")
        baseCacheExpected = new Map([
            ["A", "aaa"],
            ["B", "bbb"],
            ["C", "1234"],
        ])
    })

    it("put & get", async () => {
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
        baseCache.put("A", "new aaa")
        baseCacheExpected.set("A", "new aaa")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
        expect(baseCache.get("Not in cache")).toBeNull()
    })

    it("size", async () => {
        expect(baseCache.size()).toBe(3)
        baseCache.put("D", "ddd")
        baseCache.put("E", "eee")
        expect(baseCache.size()).toBe(5)
    })

    it("delete", async () => {
        baseCache.delete("B")
        baseCacheExpected.delete("B")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
    })

    it("delete - not exists", async () => {
        baseCache.delete("K")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
    })

    it("clear", async () => {
        baseCache.clear()
        baseCacheExpected.clear()
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
    })

    it("isFull", async () => {
        expect(baseCache.isFull()).toBe(false)
        baseCache.put("D", "ddd")
        baseCache.put("E", "eee")
        expect(baseCache.isFull()).toBe(true)
    })

    it("clearExpiredItems", async () => {
        // no timeout => all items remain
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
        baseCache.clearExpiredItems()
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
    })

    it("deleteFirstExpiredItem", async () => {
        // no timeout => remove the first item in the cache
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
        baseCache.deleteFirstExpiredItem()
        baseCacheExpected.delete("A")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
    })

    it("FIFO when put > size", () => {
        expect(baseCache.size()).toBe(3)
        baseCache.put("D", "ddd")
        baseCache.put("E", "eee")
        baseCacheExpected.set("D", "ddd")
        baseCacheExpected.set("E", "eee")
        expect(baseCache.size()).toBe(5)
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)

        baseCache.put("Z", "Replace A")
        baseCacheExpected.set("Z", "Replace A")
        baseCacheExpected.delete("A")
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBe(true)
    })
})

describe("KeyValueCacheMap with ttl", () => {
    const fakeNow = new Date(2024, 10, 23, 12, 30, 0)
    let ttlCache: KeyValueCacheMap<string>
    let ttlCacheExpected: Map<string, string>

    beforeEach(() => {
        MockCurrentTime.startMocking()
        MockCurrentTime.setTimeByDate(fakeNow)
        ttlCache = new KeyValueCacheMap<string>(new MapStorageImpl(), 5, new Duration({ seconds: 10 }))
        ttlCache.put("TA", "ta", { noTtl: true }) // forever
        ttlCache.put("TB", "tb", { ttl: new Duration({ minutes: 1 }) })
        ttlCache.put("TC", "t1234") // default

        ttlCacheExpected = new Map([
            ["TA", "ta"],
            ["TB", "tb"],
            ["TC", "t1234"],
        ])
    })

    it("put & get", async () => {
        // no timeout
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 5 * 1000))
        expect(ttlCache.get("TA")).toBe("ta")
        // expired
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 11 * 1000))
        expect(ttlCache.get("TC")).toBeNull()
        // not expired => expired
        expect(ttlCache.get("TB")).toBe("tb")
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 61 * 1000))
        expect(ttlCache.get("TB")).toBeNull()
        // not exists
        expect(ttlCache.get("Not in cache")).toBeNull()

        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 65 * 1000))
        ttlCache.put("TD", "t-middle")
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 73 * 1000))
        expect(ttlCache.get("TD")).toBe("t-middle")
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 76 * 1000))
        expect(ttlCache.get("TD")).toBeNull()

        // never timeout
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 35 * 24 * 60 * 60 * 1000))
        expect(ttlCache.get("TA")).toBe("ta")

        // update
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 30 * 1000))
        ttlCache.put("TA", "new ta", { ttl: new Duration({ seconds: 10 }) })
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 35 * 1000))
        expect(ttlCache.get("TA")).toBe("new ta")
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 50 * 1000))
        expect(ttlCache.get("TA")).toBeNull()
    })

    it("clear", async () => {
        ttlCache.clear()
        ttlCacheExpected.clear()
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)
    })

    it("clearExpiredItems", () => {
        // no one timeout yet
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 5 * 1000))
        ttlCache.clearExpiredItems()
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)

        // B and C timeout
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 500 * 1000))
        ttlCacheExpected.delete("TB")
        ttlCacheExpected.delete("TC")
        ttlCache.clearExpiredItems()
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)
    })

    it("delete", () => {
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 1 * 1000))
        ttlCache.delete("TB")
        ttlCacheExpected.delete("TB")
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)
    })

    it("deleteFirstExpiredItem", () => {
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 1 * 1000))
        expect(ttlCache.size()).toBe(3)
        ttlCache.deleteFirstExpiredItem()
        ttlCacheExpected.delete("TC")
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)
        expect(ttlCache.size()).toBe(2)
    })

    it("First expired is removed when put > size", () => {
        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 1 * 1000))
        ttlCache.put("TD", "td", { ttl: new Duration({ seconds: 5 }) })
        ttlCacheExpected.set("TD", "td")
        expect(ttlCache.size()).toBe(4)
        expect(ttlCache.isFull()).toBe(false)

        ttlCache.put("TE", "te")
        ttlCacheExpected.set("TE", "te")
        expect(ttlCache.size()).toBe(5)
        expect(ttlCache.isFull()).toBe(true)

        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)

        ttlCache.put("TF", "tf")
        expect(ttlCache.size()).toBe(5)
        expect(ttlCache.isFull()).toBe(true)

        ttlCacheExpected.set("TF", "tf")
        ttlCacheExpected.delete("TD")
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)

        MockCurrentTime.setTimeByDate(new Date(fakeNow.getTime() + 2 * 1000))
        ttlCache.put("TG", "tg", { ttl: new Duration({ seconds: 1 }) })
        // the newly added TG is the earliest timeout
        ttlCacheExpected.set("TG", "tg")
        // but an existing item (with the earliest timeout among the existing items) is removed
        ttlCacheExpected.delete("TC")
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBe(true)
    })
})
