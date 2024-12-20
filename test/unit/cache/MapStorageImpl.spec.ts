import { describe, it, expect, beforeEach } from "vitest"
import { MapStorageImpl } from "@/cache/MapStorageImpl"

describe("MapStorageImpl", () => {
    let store: MapStorageImpl<string> = new MapStorageImpl<string>()

    beforeEach(() => {
        store = new MapStorageImpl<string>()
        store.set("A", "aaa")
        store.set("B", "bbb")
        store.set("C", "1234")
    })

    it("get", () => {
        expect(store.get("A")).toBe("aaa")
        expect(store.get("C")).toBe("1234")
        expect(store.get("Not in cache")).toBe(null)
    })

    it("has", () => {
        expect(store.has("A")).toBe(true)
        expect(store.has("Not in cache")).toBe(false)
    })

    it("delete", () => {
        expect(store.has("B")).toBe(true)
        store.delete("B")
        expect(store.has("B")).toBe(false)
    })

    it("clear", () => {
        expect(store.size()).toBe(3)
        store.clear()
        expect(store.size()).toBe(0)
    })

    it("size", () => {
        expect(store.size()).toBe(3)
    })
})
