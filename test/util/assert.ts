import { IKeyValueCache } from "@/cache/IKeyValueCache";

export function mapEqual(mapA: Map<any, any>, mapB: Map<any, any>): boolean {
    if (mapA.size !== mapB.size){
        return false;
    }

    for (const pair of mapA){
        if (mapB.get(pair[0]) !== pair[1]){
            return false;
        }
    }
    return true;
}

export function cacheContentEqual(actualCache: IKeyValueCache<any>, expectedCache: Map<string, any>): boolean {
    if (actualCache.size() !== expectedCache.size){
        return false;
    }

    for (const pair of expectedCache){
        if (actualCache.get(pair[0]) !== pair[1]){
            return false;
        }
    }
    return true;
}