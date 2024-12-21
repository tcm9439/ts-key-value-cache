import { CacheItemIndex } from "@/cache/CacheItemIndex.js"

export class TimeoutIndexMinHeap {
    /**
     * Maximum elements that can be stored in heap
     */
    private _maxSize: number
    /**
     * Current number of elements in heap
     */
    private _currentSize: number = 0
    /**
     * Array to store elements in heap
     */
    private _array: (CacheItemIndex | null)[]

    constructor(maxSize: number) {
        this._maxSize = maxSize
        this._array = new Array<CacheItemIndex | null>(maxSize).fill(null)
    }

    /**
     * Returns the parent index of the i-th Node
     */
    private _parent(index: number): number {
        return Math.floor((index - 1) / 2)
    }

    /**
     * Returns the left child index of the i-th Node
     */
    private _left(index: number): number {
        return 2 * index + 1
    }

    /**
     * Returns the right child index of the i-th Node
     */
    private _right(index: number): number {
        return 2 * index + 2
    }

    /**
     * Inserts a new element in the heap
     * @returns true if success ; false if the heap is full
     */
    insert(cacheIndex: CacheItemIndex): boolean {
        if (this._currentSize === this._maxSize) {
            return false
        }

        this._array[this._currentSize] = cacheIndex
        cacheIndex.heapIndex = this._currentSize
        let childIndex = this._currentSize
        let parentIndex = this._parent(childIndex)
        this._currentSize++

        while (childIndex !== 0 && this._array[parentIndex]!.expiredTS! > this._array[childIndex]!.expiredTS!) {
            this._swap(childIndex, parentIndex)
            childIndex = parentIndex
            parentIndex = this._parent(childIndex)
        }

        return true
    }

    private _swap(indexA: number, indexB: number): void {
        const oriA = this._array[indexA]!
        const oriB = this._array[indexB]!
        this._array[indexA] = oriB
        this._array[indexB] = oriA
        // update the items' indices
        oriA.heapIndex = indexB
        oriB.heapIndex = indexA
    }

    /**
     * Returns the minimum element of the heap.
     * Returns null if the heap is empty.
     * Will not remove the element from the heap.
     */
    readMin(): CacheItemIndex | null {
        if (this._currentSize <= 0) {
            return null
        }
        return this._array[0]
    }

    /**
     * Clear the heap
     */
    clear(): void {
        this._array = new Array<CacheItemIndex | null>(this._maxSize).fill(null)
        this._currentSize = 0
    }

    private _heapify(index: number): void {
        const rightChildIndex = this._right(index)
        const leftChildIndex = this._left(index)

        let smallest = index
        if (
            leftChildIndex < this._currentSize &&
            this._array[leftChildIndex]!.expiredTS! < this._array[smallest]!.expiredTS!
        ) {
            smallest = leftChildIndex
        }
        if (
            rightChildIndex < this._currentSize &&
            this._array[rightChildIndex]!.expiredTS! < this._array[smallest]!.expiredTS!
        ) {
            smallest = rightChildIndex
        }
        if (smallest !== index) {
            this._swap(index, smallest)
            this._heapify(smallest)
        }
    }

    /**
     * Extracts the minimum element from the heap.
     * Returns null if the heap is empty.
     * Complexity: O(log n)
     */
    popMin(): CacheItemIndex | null {
        if (this._currentSize <= 0) {
            return null
        }
        if (this._currentSize === 1) {
            this._currentSize--
            this._array[0]!.heapIndex = null
            return this._array[0]
        }

        const minItemKey = this._array[0]!
        this._array[0] = this._array[this._currentSize - 1]
        this._array[0]!.heapIndex = 0
        this._currentSize--
        this._heapify(0)
        minItemKey.heapIndex = null
        return minItemKey
    }

    /**
     * Decrease the value of the element at index to value
     * Complexity: O(log n)
     */
    private _decreaseKey(index: number, value: number): void {
        this._array[index]!.expiredTS = value
        let parentIndex = this._parent(index)
        while (index !== 0 && this._array[parentIndex]!.expiredTS! > this._array[index]!.expiredTS!) {
            this._swap(index, parentIndex)
            index = this._parent(index)
            parentIndex = this._parent(index)
        }
    }

    /**
     * Deletes the element at index.
     * Complexity: O(log n)
     */
    delete(cacheIndex: CacheItemIndex): void {
        if (cacheIndex.heapIndex === null) {
            return
        }

        if (this._array[0]!.heapIndex === cacheIndex.heapIndex) {
            this.popMin()
        } else {
            const oriExp = cacheIndex.expiredTS!
            this._decreaseKey(cacheIndex.heapIndex!, -1)
            this.popMin()!
            cacheIndex.expiredTS = oriExp
        }
    }
}
