export class ClassError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'ClassError'
    this.code = code
  }
}

export const ErrorCode = {
  INVALID_FORMAT: 1001,
  COURSE_NOT_FOUND: 1002,
  INVALID_WEEK: 1003,
  INVALID_SECTION: 1004,
  INVALID_WEEKDAY: 1005,
  INVALID_PARAM: 1006,
  FILE_ERROR: 1007
}

export function handleError(e, error) {
  if(error instanceof ClassError) {
    return e.reply(`错误: ${error.message}`)
  }
  logger.error(`[Class-Plugin] ${error}`)
  return e.reply('发生未知错误,请联系管理员')
} 