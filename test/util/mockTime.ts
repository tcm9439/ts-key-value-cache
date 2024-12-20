import { vi } from "vitest"
import { Timestamp } from "@/util/CommonTypes.js"

export class MockCurrentTime {
    public static time: Timestamp

    public static setTime(time: Timestamp) {
        MockCurrentTime.time = time
    }

    public static setTimeByDate(time: Date) {
        MockCurrentTime.time = time.getTime()
    }

    public static startMocking() {
        let mockedGetNow = vi.fn()
        mockedGetNow.mockImplementation(() => MockCurrentTime.time)
        Date.now = mockedGetNow
    }
}
