import { KeyValueCacheMap } from "@/cache/KeyValueCacheMap";
import { cacheContentEqual } from "../../util/assert";
import { mockGetNowWithTimes } from "../../util/mock";

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
    it("ttl", () => {
        // [create, 5 get no timeout, 11 TC timeout, 30 get no timeout, 65 TB get timeout,
        //  70 create TD, 71 get no timeout, 82 get no timeout]
        mockGetNowWithTimes(1673519400, [0, 5, 11, 30, 65, 70, 71, 82]);

        // default ttl = 10s
        let ttlCache: KeyValueCacheMap<string> = new KeyValueCacheMap<string>(10);
        ttlCache.put("TA", "ta", undefined); // forever
        ttlCache.put("TB", "tb", 60); // 1 minute
        ttlCache.put("TC", "t1234", null); // default = 10s

        let ttlCacheExpected: Map<string, string> = new Map<string, string>([
            ["TA", "ta"],
            ["TB", "tb"],
            ["TC", "t1234"],
        ]);

        // +5s
        expect(ttlCache.get("TA")).toBe("ta");
        // +11s
        expect(ttlCache.get("TC")).toBeUndefined();
        ttlCacheExpected.delete("TC");
        // +30s
        expect(ttlCache.get("TB")).toBe("tb");
        // +65s
        expect(ttlCache.get("TB")).toBeUndefined();
        ttlCacheExpected.delete("TB");
        // +70s add anther item
        ttlCache.put("TD", "t-middle", null); // default = 10s
        ttlCacheExpected.set("TD", "t-middle");
        expect(ttlCache.get("TD")).toBe("t-middle");
        // +82
        expect(ttlCache.get("TD")).toBeUndefined();
        ttlCacheExpected.delete("TD");
        // afterwards
        expect(ttlCache.get("TA")).toBe("ta");
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
