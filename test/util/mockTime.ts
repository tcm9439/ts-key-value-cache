import { vi } from "vitest";
import { Integer, Timestamp } from "@/util/CommonTypes";

export function mockGetNow(timestamps: Timestamp[]): void {
    let mockedGetNow: any = vi.fn()
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

export class MockCurrentTimeState {
    public static time: Timestamp;
}

export function mockTimeByState(){
    let mockedGetNow = vi.fn()
    mockedGetNow.mockImplementation(() => MockCurrentTimeState.time);
    Date.now = mockedGetNow
}

export async function sleep(ms: Integer) {
    return new Promise(resolve => setTimeout(resolve, ms));
}