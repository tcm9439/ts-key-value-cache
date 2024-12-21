# Typescript Local Key Value Cache

A key-value cache with string as key and value of any type. It support
- time-to-live management
- size control which remove exceed key-value pair in a FIFO manner
- housekeep function to clear the expired item in cache with O(k log N) times, where k is the number of expired items.
- in-memory or external storage (e.g. localStorage, Redis) for storing the key-value pair

## Installation
```
npm i ts-key-value-cache
```

## Examples

TypeScript

```ts
import { CacheOption, IKeyValueCache, Duration, IMapStorage } from "ts-key-value-cache";

// ===============
// init a cache
// ===============
const cacheOption = new CacheOption<string>()
cacheOption.setMaxSize(100)                                 // this cache keep 100 key-value pair at most
cacheOption.setDefaultTTL(new Duration({ minutes: 10 }))    // default TTL is 10 minutes

// One cache can only accept one type of value
// For IKeyValueCache<V>, V is the type of the value it accept
let cache: IKeyValueCache<string> = cacheOption.create()
// E.g. the value must be string for this cache

// ===============
// basic usage
// ===============
// insert a pair with 30 minute TTL
cache.put("key1", "first", { ttl: new Duration({ minutes: 30 }) })
// update the value of key1, and renew the ttl to the default on (i.e. 10 minutes)
cache.put("key1", "testing")
// insert a pair with no TTL (i.e. never expired)
// it only get removed when the cache is full and need to push out some items, and it is the first one to expired (being oldest item among all items that will not expire when all items in the cache are without TTL)
cache.put("key2", "123", { noTtl: true })

let value1: string | null = cache.get("not-a-key")
// value1 is null

let value2: string | null = cache.get("key1")
// value2 is "testing"

// ====================
// use external storage
// ====================
class SomeMapStorageImplementation implements IMapStorage<string> {...}
const cacheOption = new CacheOption<string>()
cacheOption.setStorage(new SomeMapStorageImplementation())
let cache: IKeyValueCache<string> = cacheOption.create()
```

## Operations on IKeyValueCache
`get(key: string): V | null`
Return value if found in cache and it is not yet expired. 
Otherwise, return undefined.

`put(key: string, value: V, param?: { ttl?: Duration; noTtl?: boolean; }): void`
Put the item into cache.
If there is already a cache with the same key, this will replace the old one and the expired timestamp will be renew base on the new TTL.
If the cache is full, it will remove 
- the item that will expire first if there exist at least one item with TTL
- the item inserted first if all items in the cache are without TTL

`delete(key: string): boolean`
Delete the item from cache with the given key if exists.

`clear(): void`
Delete all items in the cache.

`size(): Integer`
Return the total number of item in this cache.

`clearExpiredItems(): void`
Delete all expired items in the cache.

## Config

The cache created is config by the `CacheOption` passed to the factory.
Set up the `CacheOption` by the setter of its attributes (listed below).


| Option      | Type             | Default | Description |
| :---------- | ---------------- | ------- | :---------- |
| defaultTTL  | Duration or null | null    | The TTL for a item put() without a TTL.<br />null = never timeout |
| maxSize     | integer > 0      | 100     | The maximum number of key-value pairs the cache can hold. |
