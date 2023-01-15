declare module 'min-heap' {
    export default class MinHeap<T> {
        constructor(scoreFunction?: any);
        insert(item: T): void;
        removeHead(): T;
        /**
         * O(n) & use === to compare item (doesn't work if item is object)
         */
        remove(item: T): boolean; 
        contains(item: T): boolean;
        clear(): void;
        size: number;
    }
}
