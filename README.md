# Typescript Local Key Value Cache

A local key-value cache with string as key and value of any type which support

- time-to-live management
- size control which remove exceed key-value pair in a FIFO manner
- housekeep function to clear the expired item in cache with O(k) times, where k is the number of expired items (Not applied to MAP implementation. For details, see [config](#config).)

## Examples

TypeScript

```ts
import { CacheFactory, CacheOption, QueueConfig, CacheType, TimeoutMode, IKeyValueCache } from "ts-key-value-cache";

let options: CacheOption = new CacheOption(CacheType.MAP);
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
```

JavaScript (Just refer to Typescript examples for more)

```js
import { CacheFactory, CacheOption, QueueConfig, CacheType, TimeoutMode, IKeyValueCache } from "ts-key-value-cache";

let options = new CacheOption(CacheType.MAP);
let cache = CacheFactory.make(options);

cache.put("abc", "testing");

cache.get("not exists"); // return undefined
cache.get("abc"); // return "testing"
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
| cacheType   | `CacheType`               | `CacheType.MAP`           | The implementation of `IKeyValueCache` to use. See [CacheType](#CacheType) for details. |
| defaultTTL  | integer > 0               | `undefined`               | The ttl (in seconds) for a item pit with a null ttl. `undefined` means never timeout. |
| maxSize     | integer > 0 or `undefined` | `undefined`               | The maximum number of key-value pairs the cache can hold. The exceed items are push out in a FIFO manner, regardless of its ttl and expired timestamp. If `undefined`, means there is no size limit. <br />If the cache is of `cacheType.Queues`, keep this attribute undefined (meaningless) and set the one in QueueConfig instead. |
| timeoutMode | `TimeoutMode`             | `TimeoutMode.ON_GET_ONLY` | State when is the expired is removed. See [TimeoutMode](#TimeoutMode) for details. |
| queueConfig | `QueueConfig[]`           | `undefined`               | Only used if using `cacheType.Queues`.<br />The config for each index queue. See [QueueConfig](#QueueConfig) for details. |

### CacheType

#### MAP
- Simple JS Map that provide the basic cache without index for expiredTS (timestamp).
- Support arbitrary ttl.
- Complicity
  - get, put, delete, clear, size: O(1)
  - clearExpiredItems: O(N)

#### HEAP
- An extension of MAP which use a min-heap for faster expired item management. 
- Support arbitrary ttl.
- Complicity
  - get, put, delete, clear, size: O(1)
  - put: O(log N) for index insertion
  - clearExpiredItems: O(k log N), where k is the number of expired items

> If only a few cache item will time out, consider to use MAP instead.
#### QUEUES
- An extension of MAP which use multiple FIFO queues for expired item management. Each with a fixed ttl.
- Can have a queue with items that won't expired.
- Complicity
  - get, put, delete, clear, size: O(1)
  - clearExpiredItems: O(k), where k is the number of expired items

> If there are many possible ttl values, consider to use MAP instead.

> If there is only one queue, consider to use MAP or HEAP instead.

### TimeoutMode

| Mode               | Description |
| ------------------ | :---------- |
| ON_GET_ONLY        | When get(key) is called, check if the cache item found is expired. |
| INDIVIDUAL_TIMEOUT | - Apart from the checking on get(), each item has its own timeout function emits so that the cache is always at its minium required size.<br />- Should only used if there are only a few items. <br />- Only applicable to MAP type as I believe calling clearExpiredItems() is more effective for the other type. |

### QueueConfig

| Option | Type                      | Default | Description |
| :----- | ------------------------- | ------- | :---------- |
| ttl    | integer > 0 or `undefined` | `undefined` | Default ttl (in seconds) of key-value pair if null ttl is supply when put(). `undefined` for item that won't timeout. |
| size   | integer > 0 or `undefined` | `undefined` | The maximum size of this queue, `undefined` means no limit. |

## Documentation
Download the module from [git](https://github.com/tcm9439/ts-type-value-cache) and run `npm run doc` to get a full version of doc.