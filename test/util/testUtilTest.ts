import { describe, it, expect } from "vitest"
import { MockCurrentTime } from "./mockTime.js"

describe("ts test util", () => {
    it("mock status", () => {
        MockCurrentTime.startMocking()
        MockCurrentTime.time = 0
        expect(Date.now()).toBe(0)
        MockCurrentTime.time = 100
        expect(Date.now()).toBe(100)
    })
})
