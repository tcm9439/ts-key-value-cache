export class Duration {
    static readonly microsecondsPerMillisecond = 1000
    static readonly millisecondsPerSecond = 1000
    static readonly secondsPerMinute = 60
    static readonly minutesPerHour = 60
    static readonly hoursPerDay = 24
    static readonly microsecondsPerSecond = Duration.microsecondsPerMillisecond * Duration.millisecondsPerSecond
    static readonly microsecondsPerMinute = Duration.microsecondsPerSecond * Duration.secondsPerMinute
    static readonly microsecondsPerHour = Duration.microsecondsPerMinute * Duration.minutesPerHour
    static readonly microsecondsPerDay = Duration.microsecondsPerHour * Duration.hoursPerDay
    static readonly millisecondsPerMinute = Duration.millisecondsPerSecond * Duration.secondsPerMinute
    static readonly millisecondsPerHour = Duration.millisecondsPerMinute * Duration.minutesPerHour
    static readonly millisecondsPerDay = Duration.millisecondsPerHour * Duration.hoursPerDay
    static readonly secondsPerHour = Duration.secondsPerMinute * Duration.minutesPerHour
    static readonly secondsPerDay = Duration.secondsPerHour * Duration.hoursPerDay
    static readonly minutesPerDay = Duration.minutesPerHour * Duration.hoursPerDay

    // The total microseconds of this Duration object.
    private readonly _duration: number

    constructor({
        days = 0,
        hours = 0,
        minutes = 0,
        seconds = 0,
        milliseconds = 0,
        microseconds = 0,
    }: {
        days?: number
        hours?: number
        minutes?: number
        seconds?: number
        milliseconds?: number
        microseconds?: number
    }) {
        this._duration =
            microseconds +
            Duration.microsecondsPerMillisecond * milliseconds +
            Duration.microsecondsPerSecond * seconds +
            Duration.microsecondsPerMinute * minutes +
            Duration.microsecondsPerHour * hours +
            Duration.microsecondsPerDay * days
    }

    // Adds this Duration and other and
    // returns the sum as a new Duration object.
    add(other: Duration): Duration {
        return new Duration({ microseconds: this._duration + other._duration })
    }

    // Subtracts other from this Duration and
    // returns the difference as a new Duration object.
    subtract(other: Duration): Duration {
        return new Duration({ microseconds: this._duration - other._duration })
    }

    // Whether this Duration is shorter than other.
    lessThan(other: Duration): boolean {
        return this._duration < other._duration
    }

    // Whether this Duration is longer than other.
    greaterThan(other: Duration): boolean {
        return this._duration > other._duration
    }

    // Whether this Duration is shorter than or equal to other.
    lessThanOrEqual(other: Duration): boolean {
        return this._duration <= other._duration
    }

    // Whether this Duration is longer than or equal to other.
    greaterThanOrEqual(other: Duration): boolean {
        return this._duration >= other._duration
    }

    // The number of entire days spanned by this Duration.
    get inDays(): number {
        return Math.floor(this._duration / Duration.microsecondsPerDay)
    }

    // The number of entire hours spanned by this Duration.
    get inHours(): number {
        return Math.floor(this._duration / Duration.microsecondsPerHour)
    }

    // The number of whole minutes spanned by this Duration.
    get inMinutes(): number {
        return Math.floor(this._duration / Duration.microsecondsPerMinute)
    }

    // The number of whole seconds spanned by this Duration.
    get inSeconds(): number {
        return Math.floor(this._duration / Duration.microsecondsPerSecond)
    }

    // The number of whole milliseconds spanned by this Duration.
    get inMilliseconds(): number {
        return Math.floor(this._duration / Duration.microsecondsPerMillisecond)
    }

    // The number of whole microseconds spanned by this Duration.
    get inMicroseconds(): number {
        return this._duration
    }

    // Whether this Duration has the same length as other.
    equals(other: Duration): boolean {
        return other instanceof Duration && this._duration === other._duration
    }

    // Compares this Duration to other, returning zero if the values are equal.
    //
    // Returns a negative integer if this Duration is shorter than
    // other, or a positive integer if it is longer.
    //
    // A negative Duration is always considered shorter than a positive one.
    compareTo(other: Duration): number {
        return this._duration - other._duration
    }
}
