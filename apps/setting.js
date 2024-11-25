import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../model/config.js'

export class Setting extends plugin {
  constructor() {
    super({
      name: 'Class-设置',
      dsc: '课表设置管理',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#?(开启|关闭)提醒$',
          fnc: 'toggleRemind'
        },
        {
          reg: '^#?设置提醒时间\\s*(\\\d+)$',
          fnc: 'setRemindTime'
        },
        {
          reg: '^#?切换提醒方式$',
          fnc: 'toggleRemindMode'
        }
      ]
    })
  }

  async toggleRemind(e) {
    const enable = e.msg.includes('开启')
    const config = Config.getUserConfig(e.user_id)
    config.remind.enable = enable
    Config.setUserConfig(e.user_id, config)
    await e.reply(`已${enable ? '开启' : '关闭'}课程提醒`)
    return true
  }

  async setRemindTime(e) {
    const minutes = parseInt(e.msg.match(/\d+/)[0])
    if(minutes < 1 || minutes > 60) {
      await e.reply('提醒时间需要在1-60分钟之间')
      return true
    }
    
    const config = Config.getUserConfig(e.user_id)
    config.remind.advance = minutes
    Config.setUserConfig(e.user_id, config)
    await e.reply(`已设置提前${minutes}分钟提醒`)
    return true
  }

  async toggleRemindMode(e) {
    const config = Config.getUserConfig(e.user_id)
    config.remind.mode = config.remind.mode === 'private' ? 'group' : 'private'
    Config.setUserConfig(e.user_id, config)
    await e.reply(`已切换为${config.remind.mode === 'private' ? '私聊' : '群聊'}提醒`)
    return true
  }
}
