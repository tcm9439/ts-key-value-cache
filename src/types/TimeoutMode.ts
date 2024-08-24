export enum TimeoutMode {
    /**
     * Check if the cache item is expired when get(key_of_that_item) is call
     */
    ON_GET_ONLY,
    /**
     * Apart from the checking on get(), each item has its own timeout function emits
     * so that the cache is always at its minium required size.
     * Should only used if there are only a few items.
     * Only applicable to MAP type as I believe calling clearExpiredItems() is more effective for the other type.
     */
    INDIVIDUAL_TIMEOUT,

    // Note: clearExpiredItems() can be called periodically to keep a smaller & effective cache
}
