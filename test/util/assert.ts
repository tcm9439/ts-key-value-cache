import { IKeyValueCache } from "@/cache/IKeyValueCache.js"

export function mapEqual(mapA: Map<any, any>, mapB: Map<any, any>): boolean {
    if (mapA.size !== mapB.size) {
        return false
    }

    for (const pair of mapA) {
        if (mapB.get(pair[0]) !== pair[1]) {
            return false
        }
    }
    return true
}

export function arrayEqual(arrA: any[], arrB: any[]): boolean {
    if (arrA.length !== arrB.length) {
        return false
    }

    for (let i = 0; i < arrA.length; i++) {
        if (arrA[i] !== arrB[i]) {
            return false
        }
    }
    return true
}

export function cacheContentEqual(actualCache: IKeyValueCache<any>, expectedCache: Map<string, any>): boolean {
    if (actualCache.size() !== expectedCache.size) {
        console.log(`Size unmatch: expected ${expectedCache.size} but got ${actualCache.size()}`)
        return false
    }

    for (const pair of expectedCache) {
        let actualValue = actualCache.get(pair[0])
        if (actualValue !== pair[1]) {
            console.log(`Value unmatch: expected '${pair[1]}' but got '${actualValue}' for key '${pair[0]}'`)
            return false
        }
    }
    return true
}
