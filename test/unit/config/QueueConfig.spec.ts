import { expect, describe, it, vi } from "vitest";
import { QueueConfig } from "@/config";

describe("QueueConfig", () => {
    it("constructor validation", () => {
        let config: QueueConfig = new QueueConfig(10);
        expect(config.size).toBeUndefined();
        expect(config.ttl).toBe(10);

        expect(() => {
            config = new QueueConfig(-10);
        }).toThrowError("ttl must be positive integer");

        expect(() => {
            config = new QueueConfig(10, -8);
        }).toThrowError("Size must be positive integer");
    })
})