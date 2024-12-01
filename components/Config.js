import fs from 'fs'
import YAML from 'yaml'
import _ from 'lodash'
import path from 'path'

const _path = process.cwd()
const configPath = path.join(_path, 'plugins', 'class-plugin', 'config')
const dataPath = path.join(_path, 'plugins', 'class-plugin', 'data')

class Config {
    constructor() {
        this.config = {}
        this.initConfig()
    }

    initConfig() {
        if (!fs.existsSync(configPath)) {
            fs.mkdirSync(configPath, { recursive: true })
        }
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true })
        }

        // 加载默认配置
        const defaultConfig = path.join(configPath, 'config_default.yaml')
        if (fs.existsSync(defaultConfig)) {
            try {
                this.config = YAML.parse(fs.readFileSync(defaultConfig, 'utf8'))
            } catch (err) {
                logger.error(`[Class-Plugin] 加载默认配置失败: ${err}`)
            }
        }

        // 加载用户配置
        const userConfig = path.join(configPath, 'config.yaml')
        if (fs.existsSync(userConfig)) {
            try {
                const config = YAML.parse(fs.readFileSync(userConfig, 'utf8'))
                _.merge(this.config, config)
            } catch (err) {
                logger.error(`[Class-Plugin] 加载用户配置失败: ${err}`)
            }
        }
    }

    get(key) {
        return _.get(this.config, key)
    }

    set(key, value) {
        _.set(this.config, key, value)
        this.save()
    }

    save() {
        try {
            const userConfig = path.join(configPath, 'config.yaml')
            fs.writeFileSync(userConfig, YAML.stringify(this.config))
            return true
        } catch (err) {
            logger.error(`[Class-Plugin] 保存配置失败: ${err}`)
            return false
        }
    }

    getUserData(userId) {
        const userFile = path.join(dataPath, `${userId}.yaml`)
        try {
            if (fs.existsSync(userFile)) {
                return YAML.parse(fs.readFileSync(userFile, 'utf8'))
            }
        } catch (err) {
            logger.error(`[Class-Plugin] 读取用户数据失败: ${err}`)
        }
        return this.getDefaultUserData()
    }

    setUserData(userId, data) {
        try {
            const userFile = path.join(dataPath, `${userId}.yaml`)
            fs.writeFileSync(userFile, YAML.stringify(data))
            return true
        } catch (err) {
            logger.error(`[Class-Plugin] 保存用户数据失败: ${err}`)
            return false
        }
    }

    getDefaultUserData() {
        return {
            base: {
                startDate: '',
                maxWeek: this.get('base.maxWeek')
            },
            courses: [],
            remind: {
                enable: this.get('remind.enable'),
                advance: this.get('remind.advance'),
                mode: this.get('remind.mode')
            }
        }
    }

    backup(userId) {
        try {
            const userFile = path.join(dataPath, `${userId}.yaml`)
            const backupFile = path.join(dataPath, 'backup', `${userId}_${Date.now()}.yaml`)
            
            if (!fs.existsSync(path.join(dataPath, 'backup'))) {
                fs.mkdirSync(path.join(dataPath, 'backup'), { recursive: true })
            }

            if (fs.existsSync(userFile)) {
                fs.copyFileSync(userFile, backupFile)
                return true
            }
        } catch (err) {
            logger.error(`[Class-Plugin] 备份用户数据失败: ${err}`)
        }
        return false
    }
}

export default new Config() 