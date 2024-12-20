import { describe, it, expect, beforeEach } from "vitest"
import { Duration } from "@/util/Duration"

describe("Duration", () => {
    it("seconds", () => {
        let duration: Duration = new Duration({ seconds: 60 })
        expect(duration.inMilliseconds).toBe(60 * 1000)
        expect(duration.inSeconds).toBe(60)
        expect(duration.inMinutes).toBe(1)
    })

    it("ms", () => {
        let duration: Duration = new Duration({ milliseconds: 1000 })
        expect(duration.inMilliseconds).toBe(1000)
        expect(duration.inSeconds).toBe(1)
    })
})
