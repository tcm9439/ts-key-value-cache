import { expect, describe, it, beforeEach } from "vitest";
import { Queue } from "@/util/Queue.js";
import { arrayEqual } from "../../util/assert.js";

describe("Queue", () => {
    let queue: Queue<string>;

    beforeEach(() => {
        queue = new Queue();
        queue.enqueue("A");
        queue.enqueue("B");
        queue.enqueue("C");
    })

    it("enqueue", () => {
        expect(arrayEqual(["A", "B", "C"], queue["_store"])).toBeTruthy();
    })

    it("dequeue", () => {
        expect(queue.dequeue()).toBe("A");
        expect(arrayEqual(["B", "C"], queue["_store"])).toBeTruthy();
    })

    it("peek", () => {
        expect(queue.peek()).toBe("A");
        expect(arrayEqual(["A", "B", "C"], queue["_store"])).toBeTruthy();
    })

    it("size", () => {
        expect(queue.size()).toBe(3);
    })

    it("clear", () => {
        queue.clear()
        expect(arrayEqual([], queue["_store"])).toBeTruthy();
    })
})