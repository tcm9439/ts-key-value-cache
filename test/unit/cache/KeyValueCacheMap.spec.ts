import { KeyValueCacheMap } from "@/cache";
import { CachedValue } from "@/types";
import { cacheContentEqual } from "@test/util/assert";
import { MockCurrentTimeState, mockTimeByState } from "@test/util/mockTime";
import { IMapStorage } from "@/cache/IMapStorage";

describe("KeyValueCacheMap", () => {
    // never expired + no size limit
    let baseCache: KeyValueCacheMap<string>;
    let baseCacheExpected: Map<string, string>;

    beforeEach(() => {
        baseCache = new KeyValueCacheMap<string>();
        baseCache.put("A", "aaa");
        baseCache.put("B", "bbb");
        baseCache.put("C", "1234");
        baseCacheExpected = new Map<string, string>([
            ["A", "aaa"],
            ["B", "bbb"],
            ["C", "1234"],
        ]);
    });

    it("put & get", () => {
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy();
        baseCache.put("A", "new aaa!");
        baseCacheExpected.set("A", "new aaa!");
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy();
        expect(baseCache.get("Not in cache")).toBeUndefined();
    });

    it("getStoredItem", () => {
        expect(baseCache["getStoredItem"]("Not in cache")).toBeUndefined();
        let value: CachedValue<string> | undefined = baseCache["getStoredItem"]("A");
        expect(value?.value).toBe("aaa");
    });

    it("put invalid", () => {
        expect(() => {
            baseCache.put("NULL", "");
        }).toThrowError();

        expect(() => {
            baseCache.put("Float ttl", "3.14", 3.14);
        }).toThrowError();

        expect(() => {
            baseCache.put("Negative ttl", "-9", -9);
        }).toThrowError();
    });

    it("size", () => {
        expect(baseCache.size()).toBe(3);
    });

    it("delete", () => {
        baseCache.delete("B");
        baseCacheExpected.delete("B");
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy();
    });

    it("clear", () => {
        baseCache.clear();
        baseCacheExpected.clear();
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy();
    });
});

describe("KeyValueCacheMap with ttl", () => {
    let fakeNow = 1673519400;
    let ttlCache: KeyValueCacheMap<string>;
    let ttlCacheExpected: Map<string, string>;

    beforeEach(() => {
        mockTimeByState();
        MockCurrentTimeState.time = fakeNow;

        // default ttl = 10s
        ttlCache = new KeyValueCacheMap<string>(10);
        ttlCache.put("TA", "ta", undefined); // forever
        ttlCache.put("TB", "tb", 60); // 1 minute
        ttlCache.put("TC", "t1234", null); // default = 10s

        ttlCacheExpected = new Map<string, string>([
            ["TA", "ta"],
            ["TB", "tb"],
            ["TC", "t1234"],
        ]);
    });

    it("ttl", () => {
        MockCurrentTimeState.time = fakeNow + 5 * 1000;
        expect(ttlCache.get("TA")).toBe("ta");

        MockCurrentTimeState.time = fakeNow + 11 * 1000;
        expect(ttlCache.get("TC")).toBeUndefined();
        ttlCacheExpected.delete("TC");

        MockCurrentTimeState.time = fakeNow + 30 * 1000;
        expect(ttlCache.get("TB")).toBe("tb");

        MockCurrentTimeState.time = fakeNow + 65 * 1000;
        expect(ttlCache.get("TB")).toBeUndefined();
        ttlCacheExpected.delete("TB");

        MockCurrentTimeState.time = fakeNow + 70 * 1000;
        ttlCache.put("TD", "t-middle", null); // default = 10s
        ttlCacheExpected.set("TD", "t-middle");
        expect(ttlCache.get("TD")).toBe("t-middle");

        MockCurrentTimeState.time = fakeNow + 82 * 1000;
        expect(ttlCache.get("TD")).toBeUndefined();
        ttlCacheExpected.delete("TD");

        // afterwards
        MockCurrentTimeState.time = fakeNow + 1000 * 1000;
        expect(ttlCache.get("TA")).toBe("ta");
    });

    it("clearExpiredItems", () => {
        MockCurrentTimeState.time = fakeNow + 82 * 1000;
        // TB & TC timeout
        ttlCacheExpected.delete("TB");
        ttlCacheExpected.delete("TC");
        ttlCache.clearExpiredItems();
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBeTruthy();
    });
});

describe("KeyValueCacheMap FIFO", () => {
    it("put more than size", () => {
        let overflowCache: KeyValueCacheMap<string> = new KeyValueCacheMap(undefined, 3);
        overflowCache.put("A", "aaa");
        overflowCache.put("B", "bbb");
        overflowCache.put("C", "1234");
        let overflowCacheExpected: Map<string, string> = new Map<string, string>([
            ["A", "aaa"],
            ["B", "bbb"],
            ["C", "1234"],
        ]);
        expect(cacheContentEqual(overflowCache, overflowCacheExpected)).toBeTruthy();
        expect(cacheContentEqual(overflowCache, overflowCacheExpected)).toBeTruthy();
        overflowCache.put("Z", "Replace A");
        overflowCacheExpected.set("Z", "Replace A");
        overflowCacheExpected.delete("A");
    });
});

describe("Individual timeout", () => {
    jest.useFakeTimers();
    let fakeNow = 1673519400;
    let ttlCache: KeyValueCacheMap<string>;
    let ttlCacheExpected: Map<string, string>;

    beforeEach(() => {
        mockTimeByState();
        MockCurrentTimeState.time = fakeNow;
        ttlCache = new KeyValueCacheMap(1, undefined, true);
        ttlCacheExpected = new Map();
        ttlCache.put("TA", "ta", undefined); // forever
        ttlCache.put("TB", "tb", 2); // 3 seconds
        ttlCache.put("TC", "t1234", null); // default = 1s
        ttlCache.put("TD", "ok", 8); // 8 seconds
        ttlCache.put("TE", "first", 2);

        ttlCacheExpected = new Map<string, string>([
            ["TA", "ta"],
            ["TB", "tb"],
            ["TC", "t1234"],
            ["TD", "ok"],
            ["TE", "first"],
        ]);
    })

    it("Individual timeout", () => {
        // after 1.1 seconds, TC timeout
        MockCurrentTimeState.time = fakeNow+1100;
        jest.advanceTimersByTime(1100);
        ttlCacheExpected.delete("TC");
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBeTruthy();
        // replace an item when the last item with that key is not yet timeout
        ttlCache.put("TE", "second", 100);
        
        // after 5 seconds, TB timeout, TE with new value should not be clear by the last timeout
        MockCurrentTimeState.time = fakeNow+5000;
        jest.advanceTimersByTime(5000);
        ttlCacheExpected.delete("TB");
        ttlCacheExpected.set("TE", "second");
        expect(cacheContentEqual(ttlCache, ttlCacheExpected)).toBeTruthy();
    });

    it("clear", () => {
        jest.spyOn(global, 'clearTimeout');
        ttlCache.clear();
        expect(clearTimeout).toHaveBeenCalledTimes(4);
    })
});

describe("Constructor with external storage", () => {
    // never expired + no size limit
    let baseCache: KeyValueCacheMap<string>;
    let baseCacheExpected: Map<string, string>;

    beforeEach(() => {
        let storage: IMapStorage<string> = new Map();
        baseCache = new KeyValueCacheMap<string>(undefined, undefined, false, storage);
        baseCache.put("A", "aaa");
        baseCache.put("B", "bbb");
        baseCache.put("C", "1234");
        baseCacheExpected = new Map<string, string>([
            ["A", "aaa"],
            ["B", "bbb"],
            ["C", "1234"],
        ]);
    });

    it("put & get", () => {
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy();
        baseCache.put("A", "new aaa!");
        baseCacheExpected.set("A", "new aaa!");
        expect(cacheContentEqual(baseCache, baseCacheExpected)).toBeTruthy();
        expect(baseCache.get("Not in cache")).toBeUndefined();
    });
});