# Typescript Local Key Value Cache

A key-value cache with string as key and value of any type which support

- time-to-live management
- size control which remove exceed key-value pair in a FIFO manner
- housekeep function to clear the expired item in cache with O(k log N) times, where k is the number of expired items.
- in-memory or external storage (e.g. localStorage, Redis) for storing the key-value pair.

## A cache with HEAP index
- Use a min-heap for faster expired item management. 
- Support arbitrary ttl.
- Complicity
  - get, delete, clear, size: O(1)
  - put: O(log N) for index insertion
  - clearExpiredItems: O(k log N), where k is the number of expired items

## Installation
```
npm i ts-key-value-cache
```

## Examples

TypeScript

```ts
import { CacheFactory, CacheOption, TimeoutMode, IKeyValueCache, CachedValue, IMapStorage } from "ts-key-value-cache";

let options: CacheOption = new CacheOption();
options.defaultTTL = 60 * 30; // 30 min
options.maxSize = 100; // this cache keep 100 key-value pair at most

let cache: IKeyValueCache<string> = CacheFactory.make<string>(options);
// One cache can only accept one type of value
// For IKeyValueCache<V>, V is the type of the value it accept
// E.g. the value must be string for this cache

cache.put("abc", "first", 60); // with 60s ttl
cache.put("abc", "testing", null); // replace the last one & using default ttl (30 min)
cache.put("Z", "123"); // will never expired unless it get push out due to cache size limit

cache.get("not exists"); // return undefined
cache.get("abc"); // return "testing"

// use external storage
class SomeMapStorageImplementation implements IMapStorage<string> {...}
cacheInstance = CacheFactory.make<string>(options, new SomeMapStorageImplementation());
```

## Operations on IKeyValueCache
> Refer to the index.d.ts, comments in code, or the [generated documentation](#Documentation) for details.

`get(key: string): V | undefined`
Return value if found in cache and it is not yet expired. 
Otherwise, return undefined.

`put(key: string, value: V, ttl?: number): void`
Put the item into cache.
If there is already a cache with the same key, this will replace the old one and the expired timestamp will be renew ny the new ttl.

`delete(key: string): boolean`
Delete the item from cache with the given key if exists.

`clear(): void`
Clear the cache (& the index for some implementation).

`size(): Integer`
Return the total number of item in this cache.

`clearExpiredItems(): void`
Delete all expired items in the cache. 
> May take O(N) time (where N is cache current size) for some implementation without index. See [CacheType](#CacheType) for details.

## Config

The cache created is config by the `CacheOption` passed to the factory.
Set up the `CacheOption` by the setter of its attributes (listed below).


| Option      | Type                      | Default                   | Description |
| :---------- | ------------------------- | ------------------------- | :---------- |
| defaultTTL  | integer > 0               | `undefined`               | The ttl (in seconds) for a item pit with a null ttl. `undefined` (or 0) means never timeout. |
| maxSize     | integer > 0 or `undefined` | `undefined`               | The maximum number of key-value pairs the cache can hold. The exceed items are push out in a FIFO manner, regardless of its ttl and expired timestamp. If `undefined`, means there is no size limit. <br />If the cache is of `cacheType.Queues`, keep this attribute undefined (meaningless) and set the one in QueueConfig instead. |

## Documentation
Download the module from [git](https://github.com/tcm9439/ts-key-value-cache) and run `npm run doc` to get a full version of doc.
