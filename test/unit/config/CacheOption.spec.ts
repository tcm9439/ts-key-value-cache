import { expect, describe, it, vi, beforeEach } from "vitest"
import { CacheOption } from "@/index.js"
import { Duration } from "@/util/Duration"
import { IKeyValueCache } from "@/cache/IKeyValueCache"
import { MapStorageImpl } from "@/cache/MapStorageImpl"

describe("CacheOption", () => {
    it("constructor", () => {
        const cacheOption = new CacheOption<string>()
        expect(cacheOption["_maxSize"]).toBe(100)
        expect(cacheOption["_defaultTTL"]).toBeNull()
        expect(cacheOption.create()).toBeInstanceOf(IKeyValueCache)
    })

    it("setDefaultTTL", () => {
        let cacheOption = new CacheOption<string>()
        cacheOption.setDefaultTTL(new Duration({ seconds: 10 }))
        expect(cacheOption["_defaultTTL"]).toEqual(new Duration({ seconds: 10 }))
        expect(cacheOption.create()).toBeInstanceOf(IKeyValueCache)

        cacheOption = new CacheOption<string>()
        cacheOption.setDefaultTTL(new Duration({ seconds: 0 }))
        expect(cacheOption["_defaultTTL"]).toBeNull()
        expect(cacheOption.create()).toBeInstanceOf(IKeyValueCache)
    })

    it("setMaxSize", () => {
        const cacheOption = new CacheOption<string>()
        cacheOption.setMaxSize(300)
        expect(cacheOption["_maxSize"]).toBe(300)
        expect(cacheOption.create()).toBeInstanceOf(IKeyValueCache)

        expect(() => cacheOption.setMaxSize(0)).toThrow(Error)
        expect(() => cacheOption.setMaxSize(-9)).toThrow(Error)
    })

    it("setStore", () => {
        const cacheOption = new CacheOption<string>()
        cacheOption.setStore(new MapStorageImpl<string>())
        expect(cacheOption["_maxSize"]).toBe(100)
        expect(cacheOption["_defaultTTL"]).toBeNull()
        expect(cacheOption.create()).toBeInstanceOf(IKeyValueCache)
    })
})
