import { Integer } from "@/util/CommonTypes.js"

/**
 * Interface IMapStorage to abstract Map-like object methods
 * so that it support external storage
 */
export interface IMapStorage<V> {
    get(key: string): V | null
    set(key: string, value: V): void
    has(key: string): boolean
    delete(key: string): boolean
    clear(): void
    size(): Integer
}
