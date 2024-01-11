import { Integer } from "@/util/CommonTypes.js";
import { CachedValue } from "@/types/CachedValue.js";

/**
 * Interface IMapStorage to abstract Map-like object methods
 * so that it support external storage
 */
export interface IMapStorage<V> {
    get(key: string): CachedValue<V> | undefined;

    set(key: string, value: CachedValue<V>): void;

    has(key: string): boolean;

    delete(key: string): boolean;

    deleteFirst(): boolean;

    clear(): void;

    size(): Integer;

    entries(): IterableIterator<[string, CachedValue<V>]>;
}