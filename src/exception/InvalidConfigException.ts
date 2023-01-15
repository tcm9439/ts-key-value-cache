export class InvalidConfigException extends Error {
    constructor(message: string) {
        super("Invalid Option: " + message)
        this.name = 'InvalidConfigException'
    }
}
