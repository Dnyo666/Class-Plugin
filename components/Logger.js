import fs from 'fs'
import path from 'path'
import Config from './Config.js'

const _path = process.cwd()
const logPath = path.join(_path, 'plugins', 'class-plugin', 'logs')

class Logger {
    constructor() {
        this.logLevel = Config.get('debug.logLevel') || 'info'
        this.saveLog = Config.get('debug.saveLog') || false
        this.initPath()
    }

    initPath() {
        if (this.saveLog && !fs.existsSync(logPath)) {
            fs.mkdirSync(logPath, { recursive: true })
        }
    }

    getLogLevel(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        }
        return levels[level] || 1
    }

    shouldLog(level) {
        return this.getLogLevel(level) >= this.getLogLevel(this.logLevel)
    }

    formatMessage(level, message) {
        const time = new Date().toISOString()
        return `[${time}] [${level.toUpperCase()}] ${message}`
    }

    async writeLog(message) {
        if (!this.saveLog) return

        try {
            const date = new Date().toISOString().split('T')[0]
            const logFile = path.join(logPath, `${date}.log`)
            await fs.promises.appendFile(logFile, message + '\n')
        } catch (err) {
            console.error(`写入日志失败: ${err}`)
        }
    }

    debug(message) {
        if (!this.shouldLog('debug')) return
        const formatted = this.formatMessage('debug', message)
        console.debug(formatted)
        this.writeLog(formatted)
    }

    info(message) {
        if (!this.shouldLog('info')) return
        const formatted = this.formatMessage('info', message)
        console.info(formatted)
        this.writeLog(formatted)
    }

    warn(message) {
        if (!this.shouldLog('warn')) return
        const formatted = this.formatMessage('warn', message)
        console.warn(formatted)
        this.writeLog(formatted)
    }

    error(message, error) {
        if (!this.shouldLog('error')) return
        const errorMsg = error ? `${message}: ${error.stack || error}` : message
        const formatted = this.formatMessage('error', errorMsg)
        console.error(formatted)
        this.writeLog(formatted)
    }

    mark(message) {
        this.info(message)
    }
}

export default new Logger() 