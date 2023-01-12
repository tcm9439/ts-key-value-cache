import { mockGetNow } from './mock';

describe("ts test util", () => {
    it("mock current timestamp", () => {
        let fakeNow = 1673519428
        let times = [fakeNow, fakeNow+10000]
        mockGetNow(times)
        expect(Date.now()).toBe(fakeNow);
        expect(Date.now()).toBe(fakeNow+10000);
    });
});
