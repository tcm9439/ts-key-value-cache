import { Integer } from "@/util/CommonTypes.js";
export class Queue<T> {
    private _store: T[] = [];

    enqueue(item: T): void{
        this._store.push(item);
    }

    dequeue(): T | undefined {
        return this._store.shift();
    }

    peek(): T {
        return this._store[0];
    }

    size(): Integer {
        return this._store.length;
    }

    clear(): void {
        this._store.length = 0;
    }
}