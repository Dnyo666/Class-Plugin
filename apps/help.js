import plugin from '../../../lib/plugins/plugin.js';
import { helpCfg, helpList } from '../resources/help/config.js';

export class Help extends plugin {
    constructor() {
        super({
            name: 'Class-帮助',
            dsc: '课表插件帮助',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?(课表|class)(帮助|help)$',
                    fnc: 'help'
                }
            ]
        })
    }

    async help(e) {
        let msg = []
        msg.push('课表插件帮助\n')
        
        for (let group of helpList) {
            msg.push(`\n${group.group}：`)
            for (let item of group.list) {
                msg.push(`\n${item.title}`)
                msg.push(item.desc)
            }
        }

        await e.reply(msg.join('\n'))
        return true
    }
}
