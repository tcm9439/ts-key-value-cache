import { mockGetNowWithTimes } from '../../util/mock';
import { CachedValue } from '../../../src/types/CachedValue';

describe("CacheValue", ()=>{
    let fakeNow = 1673519400;
    mockGetNowWithTimes(fakeNow, [25, 70, 1000])
    let noExpireValue = new CachedValue("no");
    let withExpireValue = new CachedValue("yes", 60);

    it("constructor", ()=>{
        expect(noExpireValue['_expireTS']).toBeUndefined()
        expect(withExpireValue['_expireTS']).toBe(fakeNow+60*1000)
    })

    it("hasExpired?", ()=>{
        // +25
        expect(withExpireValue.hasExpired()).toBe(false)
        // +70
        expect(withExpireValue.hasExpired()).toBe(true)
        // +1000
        expect(noExpireValue.hasExpired()).toBe(false)
    })
})