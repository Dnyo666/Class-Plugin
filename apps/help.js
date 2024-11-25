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
        let helpGroup = [];
        _.forEach(helpList, (group) => {
            _.forEach(group.list, (help) => {
                let icon = help.icon * 1;
                if (!icon) {
                    help.css = 'display:none';
                } else {
                    let x = (icon - 1) % 10;
                    let y = (icon - x - 1) / 10;
                    help.css = `background-position:-${x * 50}px -${y * 50}px`;
                }
            });
            helpGroup.push(group);
        });

        try {
            const render = new Render();
            const imagePath = await render.help(helpCfg, helpGroup);
            await e.reply(segment.image(imagePath));
            fs.unlinkSync(imagePath);
        } catch(err) {
            logger.error(err);
            await e.reply('生成帮助图片失败');
        }
        return true;
    }
}
