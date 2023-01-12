import { Integer, Timestamp } from "@/types/CommonTypes";

export function mockGetNow(timestamps: Timestamp[]): void {
    let mockedGetNow: jest.Mock<any, any> = jest.fn()
    for (const ts of timestamps){
        mockedGetNow.mockImplementationOnce(() => ts);
    }
    Date.now = mockedGetNow
}

export function mockGetNowWithTimes(firstTS: Timestamp, secondsAfterFirst: Integer[]) {
    let timestamps: Timestamp[] = [firstTS];
    for (const after of secondsAfterFirst) {
        timestamps.push(firstTS + after * 1000);
    }
    mockGetNow(timestamps);
}