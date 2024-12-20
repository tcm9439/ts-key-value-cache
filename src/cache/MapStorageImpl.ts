import { IMapStorage } from "./IMapStorage.js"

export class MapStorageImpl<V> implements IMapStorage<V> {
    private _store: Map<string, V> = new Map()

    get(key: string): V | null {
        return this._store.get(key) || null
    }

    set(key: string, value: V): void {
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
}
