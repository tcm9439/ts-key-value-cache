import { describe, it, expect, beforeEach } from "vitest"
import { TimeoutIndexMinHeap } from "@/util/TimeoutIndexMinHeap"
import { CacheItemIndex } from "@/cache/CacheItemIndex"

describe("TimeoutIndexMinHeap", () => {
    it("insert & clear & full", () => {
        let heap = new TimeoutIndexMinHeap(2)
        let currentMin = heap.readMin()
        expect(currentMin).toBeNull()

        const itemA = new CacheItemIndex("A", new Date(2024, 2, 4, 12, 45).getTime())
        const itemB = new CacheItemIndex("B", new Date(2024, 2, 4, 12, 30).getTime())
        const itemC = new CacheItemIndex("C", new Date(2024, 2, 4, 12, 25).getTime())

        let success = heap.insert(itemA)
        currentMin = heap.readMin()
        expect(success).toBe(true)
        expect(currentMin).toEqual(itemA)

        success = heap.insert(itemB)
        currentMin = heap.readMin()
        expect(success).toBe(true)
        expect(currentMin).toEqual(itemB)

        success = heap.insert(itemC)
        currentMin = heap.readMin()
        expect(success).toBe(false)
        expect(currentMin).toEqual(itemB)

        heap.clear()
        currentMin = heap.readMin()
        expect(currentMin).toBeNull()
    })

    it("basic insert & min - without duplication", () => {
        let heap = new TimeoutIndexMinHeap(10)
        let currentMin = heap.readMin()
        expect(currentMin).toBeNull()

        const itemA = new CacheItemIndex("A", new Date(2024, 2, 4, 12, 45).getTime()) // 3
        const itemB = new CacheItemIndex("B", new Date(2024, 2, 4, 12, 30).getTime()) // 1
        const itemC = new CacheItemIndex("C", new Date(2024, 2, 4, 12, 35).getTime()) // 2

        heap.insert(itemA)
        currentMin = heap.readMin()
        expect(currentMin).toEqual(itemA)

        heap.insert(itemB)
        currentMin = heap.readMin()
        expect(currentMin).toEqual(itemB)

        heap.insert(itemC)
        currentMin = heap.readMin()
        expect(currentMin).toEqual(itemB)

        let min = heap.popMin()
        expect(min!.key).toEqual("B")
        min = heap.popMin()
        expect(min!.key).toEqual("C")
        min = heap.popMin()
        expect(min!.key).toEqual("A")

        // no more item in heap
        min = heap.popMin()
        expect(min).toBeNull()
    })

    it("delete - without duplication", () => {
        let heap = new TimeoutIndexMinHeap(10)
        const itemA = new CacheItemIndex("A", new Date(2024, 2, 4, 12, 45).getTime()) // 3
        const itemB = new CacheItemIndex("B", new Date(2024, 2, 4, 12, 30).getTime()) // 1
        const itemC = new CacheItemIndex("C", new Date(2024, 2, 4, 12, 35).getTime()) // 2

        heap.insert(itemA)
        // A
        expect(itemA.heapIndex).toEqual(0)

        heap.insert(itemB)
        //   B
        //  /
        // A
        expect(itemA.heapIndex).toEqual(1)
        expect(itemB.heapIndex).toEqual(0)

        heap.insert(itemC)
        //   B
        //  / \
        // A   C
        expect(heap.readMin()!.key).toEqual("B")
        expect(itemA.heapIndex).toEqual(1)
        expect(itemB.heapIndex).toEqual(0)
        expect(itemC.heapIndex).toEqual(2)

        heap.delete(itemB)
        //   C
        //  /
        // A
        expect(heap.readMin()!.key).toEqual("C")
        expect(itemA.heapIndex).toEqual(1)
        expect(itemB.heapIndex).toBeNull()
        expect(itemC.heapIndex).toEqual(0)

        heap.insert(itemB)
        //   B
        //  / \
        // A   C
        expect(heap.readMin()!.key).toEqual("B")
        expect(itemA.heapIndex).toEqual(1)
        expect(itemB.heapIndex).toEqual(0)
        expect(itemC.heapIndex).toEqual(2)

        heap.delete(itemA)
        //   B
        //  /
        // C
        expect(heap.readMin()!.key).toEqual("B")
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toEqual(0)
        expect(itemC.heapIndex).toEqual(1)

        heap.delete(itemC)
        // B
        expect(heap.readMin()!.key).toEqual("B")
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toEqual(0)
        expect(itemC.heapIndex).toBeNull()

        heap.insert(itemC)
        //   B
        //  /
        // C
        expect(heap.readMin()!.key).toEqual("B")
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toEqual(0)
        expect(itemC.heapIndex).toEqual(1)

        heap.delete(itemB)
        // C
        expect(heap.readMin()!.key).toEqual("C")
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toBeNull()
        expect(itemC.heapIndex).toEqual(0)

        heap.delete(itemC)
        expect(heap.readMin()).toBeNull()
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toBeNull()
        expect(itemC.heapIndex).toBeNull()
    })

    it("basic insert & min - with duplication", () => {
        let heap = new TimeoutIndexMinHeap(10)
        let currentMin = heap.readMin()
        expect(currentMin).toBeNull()

        const itemA = new CacheItemIndex("A", new Date(2024, 2, 4, 12, 45).getTime()) // 2
        const itemB = new CacheItemIndex("B", new Date(2024, 2, 4, 12, 30).getTime()) // 1
        const itemC = new CacheItemIndex("C", new Date(2024, 2, 4, 12, 30).getTime()) // 1

        heap.insert(itemA)
        currentMin = heap.readMin()
        expect(currentMin!.expiredTS).toEqual(itemA.expiredTS)

        heap.insert(itemB)
        currentMin = heap.readMin()
        expect(currentMin!.expiredTS).toEqual(itemB.expiredTS)

        heap.insert(itemC)
        currentMin = heap.readMin()
        expect(currentMin!.expiredTS).toEqual(itemB.expiredTS)

        let min = heap.popMin()
        expect(min!.key === "B" || min!.key === "C").toBe(true)
        min = heap.popMin()
        expect(min!.key === "B" || min!.key === "C").toBe(true)
        min = heap.popMin()
        expect(min!.key).toEqual("A")

        // no more item in heap
        min = heap.popMin()
        expect(min).toBeNull()
    })

    it("delete - without duplication", () => {
        let heap = new TimeoutIndexMinHeap(10)
        const itemA = new CacheItemIndex("A", new Date(2024, 2, 4, 12, 45).getTime()) // 2
        const itemB = new CacheItemIndex("B", new Date(2024, 2, 4, 12, 30).getTime()) // 1
        const itemC = new CacheItemIndex("C", new Date(2024, 2, 4, 12, 30).getTime()) // 1

        heap.insert(itemA)
        // A
        expect(itemA.heapIndex).toEqual(0)

        heap.insert(itemB)
        //   B
        //  /
        // A
        expect(itemA.heapIndex).toEqual(1)
        expect(itemB.heapIndex).toEqual(0)

        heap.insert(itemC)
        //   B
        //  / \
        // A   C
        if (heap.readMin()!.key === "B") {
            expect(itemA.heapIndex).toEqual(1)
            expect(itemB.heapIndex).toEqual(0)
            expect(itemC.heapIndex).toEqual(2)
        } else if (heap.readMin()!.key === "C") {
            expect(itemA.heapIndex).toEqual(1)
            expect(itemB.heapIndex).toEqual(2)
            expect(itemC.heapIndex).toEqual(0)
        } else {
            // incorrect
            expect(false).toBe(true)
        }

        heap.delete(itemB)
        //   C
        //  /
        // A
        expect(heap.readMin()!.key).toEqual("C")
        expect(itemA.heapIndex).toEqual(1)
        expect(itemB.heapIndex).toBeNull()
        expect(itemC.heapIndex).toEqual(0)

        heap.insert(itemB)
        //   B
        //  / \
        // A   C
        if (heap.readMin()!.key === "B") {
            expect(itemA.heapIndex).toEqual(1)
            expect(itemB.heapIndex).toEqual(0)
            expect(itemC.heapIndex).toEqual(2)
        } else if (heap.readMin()!.key === "C") {
            expect(itemA.heapIndex).toEqual(1)
            expect(itemB.heapIndex).toEqual(2)
            expect(itemC.heapIndex).toEqual(0)
        } else {
            // incorrect
            expect(false).toBe(true)
        }

        heap.delete(itemA)
        //   B
        //  /
        // C
        if (heap.readMin()!.key === "B") {
            expect(itemA.heapIndex).toBeNull()
            expect(itemB.heapIndex).toEqual(0)
            expect(itemC.heapIndex).toEqual(1)
        } else if (heap.readMin()!.key === "C") {
            expect(itemA.heapIndex).toBeNull()
            expect(itemB.heapIndex).toEqual(1)
            expect(itemC.heapIndex).toEqual(0)
        } else {
            // incorrect
            expect(false).toBe(true)
        }

        heap.delete(itemC)
        // B
        expect(heap.readMin()!.key).toEqual("B")
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toEqual(0)
        expect(itemC.heapIndex).toBeNull()

        heap.insert(itemC)
        //   B
        //  /
        // C
        if (heap.readMin()!.key === "B") {
            expect(itemA.heapIndex).toBeNull()
            expect(itemB.heapIndex).toEqual(0)
            expect(itemC.heapIndex).toEqual(1)
        } else if (heap.readMin()!.key === "C") {
            expect(itemA.heapIndex).toBeNull()
            expect(itemB.heapIndex).toEqual(1)
            expect(itemC.heapIndex).toEqual(0)
        } else {
            // incorrect
            expect(false).toBe(true)
        }

        heap.delete(itemB)
        // C
        expect(heap.readMin()!.key).toEqual("C")
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toBeNull()
        expect(itemC.heapIndex).toEqual(0)

        heap.delete(itemC)
        expect(heap.readMin()).toBeNull()
        expect(itemA.heapIndex).toBeNull()
        expect(itemB.heapIndex).toBeNull()
        expect(itemC.heapIndex).toBeNull()
    })
})
