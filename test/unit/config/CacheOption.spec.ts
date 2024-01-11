import { expect, describe, it, vi, beforeEach } from "vitest";
import { CacheOption, CacheType } from "@/index.js";
import { QueueConfig } from "@/config";

describe("CacheOption", () => {
    let config: CacheOption;
    beforeEach(() => {
        config = new CacheOption(CacheType.MAP);
    })

    it("defaultTTL", () => {
        config.defaultTTL = 10;
        expect(config.defaultTTL).toBe(10);

        expect(() => {
            config.defaultTTL = -1;
        }).toThrowError();
    })

    it("maxSize", () => {
        config.maxSize = 10;
        expect(config.maxSize).toBe(10);

        expect(() => {
            config.maxSize = -1;
        }).toThrowError();
    })

    it("queueConfigs", () => {
        let queueConfigs: QueueConfig[] = []
        queueConfigs.push(new QueueConfig(10, 20));
        config.queueConfigs = queueConfigs;
        expect(config.queueConfigs).toBe(queueConfigs);

        expect(() => {
            queueConfigs = []
            config.queueConfigs = queueConfigs;
        }).toThrowError();
    })
})