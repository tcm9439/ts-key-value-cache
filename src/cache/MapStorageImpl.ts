import { IMapStorage } from "./IMapStorage.js"
import { CachedValue } from "@/types/CachedValue.js"

export class MapStorageImpl<V> implements IMapStorage<V> {
    private _store: Map<string, CachedValue<V>> = new Map()

    get(key: string): CachedValue<V> | undefined {
        return this._store.get(key)
    }

    set(key: string, value: CachedValue<V>): void {
        this._store.set(key, value)
    }

    has(key: string): boolean {
        return this._store.has(key)
    }

    delete(key: string): boolean {
        return this._store.delete(key)
    }

    clear(): void {
        this._store.clear()
    }

    size(): number {
        return this._store.size
    }

    entries(): IterableIterator<[string, CachedValue<V>]> {
        return this._store.entries()
    }
}
