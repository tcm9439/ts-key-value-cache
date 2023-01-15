import _ from "lodash";

export function isPositiveInteger(value: number, canBeZero: boolean = false): boolean {
    if (canBeZero){
        return value >= 0 && _.isInteger(value);
    }
    return value > 0 && _.isInteger(value);
}