import { Integer } from "@/util/CommonTypes";
import { CachedValue } from '@/types/CachedValue';

/**
 * interface IMapStorage
 * abstract Map() object methods
 * so that it support external storage
 */
export interface IMapStorage<V> {
    get(key: string): CachedValue<V> | undefined;

    set(key: string, value: CachedValue<V>): this;

    has(key: string): boolean;

    delete(key: string): boolean;

    clear(): void;

    size: number;
    //size(): () => number;

    entries(): IterableIterator<[string, CachedValue<V>]>;

    keys(): IterableIterator<string>;

    //values(): IterableIterator<CachedValue<V>>;

    [Symbol.iterator]: () => IterableIterator<[string, CachedValue<V>]>;

}