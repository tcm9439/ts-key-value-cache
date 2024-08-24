import { expect, describe, it, vi } from "vitest"
import MinHeap from "min-heap"

import { CacheItemIndex, orderByExpiredTSScoreFunction } from "@/types"

describe("CacheItemIndex", () => {
    it("compare", () => {
        let itemIndexA = new CacheItemIndex("A", 1673519300, 1673519400) // expire first
        let itemIndexB = new CacheItemIndex("B", 1673519300, 1673519500)
        expect(itemIndexA.compare(itemIndexB) < 0).toBeTruthy()
        let itemIndexC = new CacheItemIndex("A", 1673519300, 1673519400)
        expect(itemIndexA.compare(itemIndexC) == 0).toBeTruthy()
    })

    it("heap with orderByExpiredTSScoreFunction", () => {
        let heap: MinHeap<CacheItemIndex> = new MinHeap(orderByExpiredTSScoreFunction)
        heap.insert(new CacheItemIndex("A", 1673519300, 1673519500)) // 1
        heap.insert(new CacheItemIndex("B", 1673519300, 1673519600)) // 3
        heap.insert(new CacheItemIndex("C", 1673519300, 1673519500)) // 2

        let popItem = heap.removeHead()
        expect(popItem["_key"]).toBe("A")
        popItem = heap.removeHead()
        expect(popItem["_key"]).toBe("C")
        popItem = heap.removeHead()
        expect(popItem["_key"]).toBe("B")
        popItem = heap.removeHead()
        expect(popItem).toBeUndefined()
    })
})
