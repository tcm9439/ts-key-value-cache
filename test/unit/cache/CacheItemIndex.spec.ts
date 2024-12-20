import { expect, describe, it, vi } from "vitest"
import { CacheItemIndex } from "@/cache/CacheItemIndex"
import { Duration } from "@/util/Duration"
import { MockCurrentTime } from "@test/util/mockTime"

describe("CacheItemIndex", () => {
    it("fromTtl", () => {
        MockCurrentTime.startMocking()
        MockCurrentTime.time = new Date("2024-09-05T12:34:00Z").getTime()

        const itemIndex = CacheItemIndex.fromTtl("A", new Duration({ seconds: 10 }))
        expect(itemIndex.expiredTS).toBe(new Date("2024-09-05T12:34:10Z").getTime())

        const itemIndex2 = CacheItemIndex.fromTtl("A", null)
        expect(itemIndex2.expiredTS).toBeNull()
    })

    it("compare", () => {
        // (earlier) A == C , B (later)
        const itemIndexA = new CacheItemIndex("A", new Date("2024-09-05T12:34:00Z").getTime())
        const itemIndexB = new CacheItemIndex("B", new Date("2024-09-05T12:36:00Z").getTime())
        const itemIndexC = new CacheItemIndex("C", new Date("2024-09-05T12:34:00Z").getTime())
        const itemIndexD = CacheItemIndex.fromTtl("D", null)

        expect(itemIndexA.compare(itemIndexB)).toBeLessThan(0)
        expect(itemIndexB.compare(itemIndexA)).toBeGreaterThan(0)

        expect(itemIndexA.compare(itemIndexC)).toBe(0)
        expect(itemIndexC.compare(itemIndexA)).toBe(0)

        expect(itemIndexD.compare(itemIndexA)).toBeGreaterThan(0)
        expect(itemIndexA.compare(itemIndexD)).toBeLessThan(0)
    })

    it("hasExpired", () => {
        MockCurrentTime.startMocking()
        const itemIndex = new CacheItemIndex("A", new Date("2024-09-05T12:34:00Z").getTime())

        MockCurrentTime.time = new Date("2024-09-05T12:33:00Z").getTime()
        expect(itemIndex.hasExpired()).toBe(false)
        MockCurrentTime.time = new Date("2024-09-05T12:34:00Z").getTime()
        expect(itemIndex.hasExpired()).toBe(true)
        MockCurrentTime.time = new Date("2024-09-05T12:35:00Z").getTime()
        expect(itemIndex.hasExpired()).toBe(true)

        const itemIndex2 = CacheItemIndex.fromTtl("A", null)
        MockCurrentTime.time = new Date("2025-09-05T12:35:00Z").getTime()
        expect(itemIndex2.hasExpired()).toBe(false)
    })
})
