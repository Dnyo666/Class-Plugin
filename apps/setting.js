import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../model/config.js'
import moment from 'moment'

export class Setting extends plugin {
    constructor() {
        super({
            name: 'Class-设置',
            dsc: '课表设置管理',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?(开始|初始化)?课表(配置|设置|初始化)?$',
                    fnc: 'startConfig'
                },
                {
                    reg: '^#?设置开学日期\\s*(\\d{4}[-/]\\d{1,2}[-/]\\d{1,2})$',
                    fnc: 'setStartDate'
                },
                {
                    reg: '^#?设置学期周数\\s*(\\d+)$',
                    fnc: 'setMaxWeek'
                },
                {
                    reg: '^#?(开启|关闭)提醒$',
                    fnc: 'toggleRemind'
                },
                {
                    reg: '^#?设置提醒时间\\s*(\\d+)$',
                    fnc: 'setRemindTime'
                }
            ]
        })
    }

    async startConfig(e) {
        logger.mark(`[Class-Plugin] 触发初始化配置命令: ${e.msg}`)
        try {
            const config = Config.getUserConfig(e.user_id) || {}
            config.base = config.base || {}
            config.courses = config.courses || []
            config.remind = config.remind || {
                enable: false,
                advance: 10,
                mode: 'private'
            }
            
            // 保存初始配置
            if (Config.setUserConfig(e.user_id, config)) {
                const isInitialized = config.base.startDate && config.base.maxWeek

                if (isInitialized) {
                    await e.reply([
                        '您已完成课表配置，当前设置：',
                        `开学日期：${config.base.startDate}`,
                        `学期周数：${config.base.maxWeek}周`,
                        '',
                        '如需修改，请使用以下命令：',
                        '#设置开学日期 2024-02-26',
                        '#设置学期周数 16'
                    ].join('\n'))
                } else {
                    await e.reply([
                        '欢迎使用课表配置向导！',
                        '请按照以下步骤进行设置：',
                        '',
                        '1️⃣ 设置开学日期',
                        '命令：#设置开学日期 2024-02-26',
                        '',
                        '2️⃣ 设置学期周数',
                        '命令：#设置学期周数 16',
                        '',
                        '完成以上设置后，您就可以：',
                        '- 使用 #添加课程 添加课程',
                        '- 使用 #导入课表 导入课表数据',
                        '- 使用 #课表 查看课表'
                    ].join('\n'))
                }
                return true
            } else {
                throw new Error('保存配置失败')
            }
        } catch (err) {
            logger.error(`[Class-Plugin] 初始化配置失败: ${err}`)
            await e.reply('配置失败，请稍后重试')
            return false
        }
    }

    async setStartDate(e) {
        logger.mark(`[Class-Plugin] 触发设置开学日期命令: ${e.msg}`)
        try {
            const match = e.msg.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/)
            if (!match) {
                await e.reply('日期格式错误，请使用 YYYY-MM-DD 格式，例如：2024-02-26')
                return false
            }

            const date = match[1].replace(/\//g, '-')
            if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
                await e.reply('日期格式错误，请使用 YYYY-MM-DD 格式，例如：2024-02-26')
                return false
            }

            // 格式化日期，确保月份和日期是两位数
            const formattedDate = moment(date).format('YYYY-MM-DD')

            const config = Config.getUserConfig(e.user_id)
            config.base = config.base || {}
            config.base.startDate = formattedDate
            
            if (Config.setUserConfig(e.user_id, config)) {
                await e.reply([
                    '✅ 开学日期设置成功！',
                    `开学日期：${formattedDate}`,
                    '',
                    config.base.maxWeek 
                        ? '课表初始化完成，现在可以开始添加课程了！'
                        : '接下来请设置学期周数：\n#设置学期周数 16'
                ].join('\n'))
                return true
            } else {
                throw new Error('保存配置失败')
            }
        } catch (err) {
            logger.error(`[Class-Plugin] 设置开学日期失败: ${err}`)
            await e.reply('设置失败，请检查日期格式是否正确')
            return false
        }
    }

    async setMaxWeek(e) {
        logger.mark(`[Class-Plugin] 触发设置学期周数命令: ${e.msg}`)
        try {
            const match = e.msg.match(/(\d+)/)
            if (!match) {
                await e.reply('请输入正确的周数，例如：#设置学期周数 16')
                return false
            }

            const weeks = parseInt(match[1])
            if (isNaN(weeks) || weeks < 1 || weeks > 30) {
                await e.reply('周数必须在 1-30 之间')
                return false
            }

            const config = Config.getUserConfig(e.user_id)
            config.base = config.base || {}
            config.base.maxWeek = weeks
            
            if (Config.setUserConfig(e.user_id, config)) {
                await e.reply([
                    '✅ 学期周数设置成功！',
                    `学期周数：${weeks}周`,
                    '',
                    config.base.startDate
                        ? '课表初始化完成，现在可以开始添加课程了！'
                        : '接下来请设置开学日期：\n#设置开学日期 2024-02-26'
                ].join('\n'))
                return true
            } else {
                throw new Error('保存配置失败')
            }
        } catch (err) {
            logger.error(`[Class-Plugin] 设置学期周数失败: ${err}`)
            await e.reply('设置失败，请检查输入的周数是否正确')
            return false
        }
    }

    async toggleRemind(e) {
        logger.mark(`[Class-Plugin] 触发提醒开关命令: ${e.msg}`)
        try {
            const enable = e.msg.includes('开启')
            const config = Config.getUserConfig(e.user_id)
            
            // 检查是否已初始化
            if (!config?.base?.startDate || !config?.base?.maxWeek) {
                await e.reply('请先完成课表初始化配置：\n#开始配置课表')
                return false
            }

            config.remind = config.remind || {}
            config.remind.enable = enable
            
            if (Config.setUserConfig(e.user_id, config)) {
                await e.reply(`✅ 已${enable ? '开启' : '关闭'}课程提醒`)
                return true
            } else {
                throw new Error('保存配置失败')
            }
        } catch (err) {
            logger.error(`[Class-Plugin] 设置提醒状态失败: ${err}`)
            await e.reply('设置失败，请稍后重试')
            return false
        }
    }

    async setRemindTime(e) {
        logger.mark(`[Class-Plugin] 触发设置提醒时间命令: ${e.msg}`)
        try {
            const match = e.msg.match(/(\d+)/)
            if (!match) {
                await e.reply('请输入正确的时间，例如：#设置提醒时间 10')
                return false
            }

            const minutes = parseInt(match[1])
            if (isNaN(minutes) || minutes < 1 || minutes > 60) {
                await e.reply('提醒时间必须在 1-60 分钟之间')
                return false
            }

            const config = Config.getUserConfig(e.user_id)
            
            // 检查是否已初始化
            if (!config?.base?.startDate || !config?.base?.maxWeek) {
                await e.reply('请先完成课表初始化配置：\n#开始配置课表')
                return false
            }

            config.remind = config.remind || {}
            config.remind.advance = minutes
            
            if (Config.setUserConfig(e.user_id, config)) {
                await e.reply(`✅ 已设置提前 ${minutes} 分钟提醒`)
                return true
            } else {
                throw new Error('保存配置失败')
            }
        } catch (err) {
            logger.error(`[Class-Plugin] 设置提醒时间失败: ${err}`)
            await e.reply('设置失败，请检查输入的时间是否正确')
            return false
        }
    }
}
