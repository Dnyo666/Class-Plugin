import plugin from '../../../lib/plugins/plugin.js';
import { Render } from '../model/render.js';
import { helpCfg, helpList } from '../resources/help/config.js';
import _ from 'lodash';
import fs from 'fs';
import logger from '../../../lib/logger.js';

export class Help extends plugin {
    constructor() {
        super({
            name: 'Class-帮助',
            dsc: '课表插件帮助',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?(课表|class)帮助$',
                    fnc: 'help'
                }
            ]
        })
    }

    async help(e) {
        try {
            const render = new Render()
            const imagePath = await render.help(helpCfg, helpList)
            
            // 发送图片
            if(fs.existsSync(imagePath)) {
                await e.reply(segment.image(imagePath))
                // 发送后删除临时文件
                fs.unlinkSync(imagePath)
            } else {
                throw new Error('生成帮助图片失败')
            }
        } catch(err) {
            logger.error(err)
            await e.reply('生成帮助图片失败,请稍后重试')
        }
        return true
    }
}
