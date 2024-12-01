export class ClassError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ClassError'
  }
}

export function handleError(error) {
  if (error instanceof ClassError) {
    return error.message
  } else {
    logger.mark(`[Class-Plugin] ${error}`)
    return '发生未知错误'
  }
} 