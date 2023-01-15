import { mockGetNow, MockCurrentTimeState, mockTimeByState } from './mockTime';

describe("ts test util", () => {
    it("mock current timestamp", () => {
        let fakeNow = 1673519428
        let times = [fakeNow, fakeNow+10000]
        mockGetNow(times)
        expect(Date.now()).toBe(fakeNow);
        expect(Date.now()).toBe(fakeNow+10000);
    });

    it("mock status", () => {
        mockTimeByState();
        MockCurrentTimeState.time = 0;
        expect(Date.now()).toBe(0);
        MockCurrentTimeState.time = 100;
        expect(Date.now()).toBe(100);
    })
});
