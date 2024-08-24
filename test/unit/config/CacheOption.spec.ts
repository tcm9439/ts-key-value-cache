import { expect, describe, it, vi, beforeEach } from "vitest"
import { CacheOption } from "@/index.js"

describe("CacheOption", () => {
    let config: CacheOption
    beforeEach(() => {
        config = new CacheOption()
    })

    it("defaultTTL", () => {
        config.defaultTTL = 10
        expect(config.defaultTTL).toBe(10)

        expect(() => {
            config.defaultTTL = -1
        }).toThrowError()
    })

    it("maxSize", () => {
        config.maxSize = 10
        expect(config.maxSize).toBe(10)

        expect(() => {
            config.maxSize = -1
        }).toThrowError()
    })
})
