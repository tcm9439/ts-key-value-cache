import { expect, describe, it } from "vitest";
import { isPositiveInteger } from "@/util/CommonConstrains.js";

describe("CommonConstrain", () => {
    it("isPositiveInteger", () => {
        expect(isPositiveInteger(9, false)).toBe(true);
        expect(isPositiveInteger(0.2, false)).toBe(false);
        expect(isPositiveInteger(-33, false)).toBe(false);
        expect(isPositiveInteger(0, false)).toBe(false);
        expect(isPositiveInteger(9, true)).toBe(true);
        expect(isPositiveInteger(-33, true)).toBe(false);
        expect(isPositiveInteger(0.2, true)).toBe(false);
        expect(isPositiveInteger(0, true)).toBe(true);
    })
})