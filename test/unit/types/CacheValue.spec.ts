import { MockCurrentTimeState, mockTimeByState } from '@test/util/mockTime';
import { CachedValue } from '@/types/CachedValue';

describe("CacheValue", ()=>{
    let fakeNow = 1673519400;
    mockTimeByState();
    MockCurrentTimeState.time = fakeNow;
    let noExpireValue = new CachedValue("no");
    let withExpireValue = new CachedValue("yes", 60);

    it("constructor", ()=>{
        expect(noExpireValue['_expireTS']).toBeUndefined()
        expect(withExpireValue['_expireTS']).toBe(fakeNow+60*1000)
    })

    it("hasExpired?", ()=>{
        MockCurrentTimeState.time = fakeNow + 25*1000;
        expect(withExpireValue.hasExpired()).toBe(false)
        MockCurrentTimeState.time = fakeNow + 70*1000;
        expect(withExpireValue.hasExpired()).toBe(true)
        MockCurrentTimeState.time = fakeNow + 1000*1000;
        expect(noExpireValue.hasExpired()).toBe(false)
    })
})