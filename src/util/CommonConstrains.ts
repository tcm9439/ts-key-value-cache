export function isInteger(value: number): boolean {
    return Number.isInteger(value)
}

export function isPositiveInteger(value: number, canBeZero: boolean = false): boolean {
    if (canBeZero) {
        return value >= 0 && isInteger(value)
    }
    return value > 0 && isInteger(value)
}
