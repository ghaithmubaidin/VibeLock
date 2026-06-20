export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isFatal: boolean = false,
  ) {
    super(message)
    this.name = 'AppError'
  }
}