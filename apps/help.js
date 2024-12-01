import plugin from '../../../lib/plugins/plugin.js';
import { Render } from '../model/render.js';
import { style } from '../resources/help/imgs/config.js';
import { Config } from '../model/config.js';
import _ from 'lodash';
import fs from 'node:fs';

const render = new Render();

export class Help extends plugin {
    constructor() {
        super({
            name: 'Class-帮助',
            dsc: '课表插件帮助',
            event: 'message',
            priority: 1009,
            rule: [
                {
                    reg: '^#?(课表|class|课程表|上课)(帮助|help|说明|指南)$',
                    fnc: 'help'
                }
            ]
        });
    }

    async help(e) {
        try {
            // 检查用户是否已初始化
            const userData = Config.getUserConfig(e.user_id);
            const isInitialized = userData?.base?.startDate && userData?.base?.maxWeek;

            const helpCfg = {
                title: '课表插件帮助',
                subTitle: isInitialized ? '让课表管理更简单' : '请先进行初始化配置',
                colCount: 3,
                bgBlur: true
            };

            const helpList = [
                {
                    group: '🔰 开始使用',
                    list: [
                        {
                            title: '#开始配置课表',
                            desc: '初始化课表配置（设置开学日期和学期周数）'
                        },
                        {
                            title: '#设置开学日期 2024-02-26',
                            desc: '设置学期开始日期'
                        },
                        {
                            title: '#设置学期周数 16',
                            desc: '设置学期总周数（通常为16-18周）'
                        }
                    ]
                },
                {
                    group: '📝 课表管理',
                    list: [
                        {
                            title: '#添加课程',
                            desc: '按提示添加新课程，例如：#添加课程 高数 张三 A101 周一 1-2 1-16周'
                        },
                        {
                            title: '#导入课表',
                            desc: '从Excel文件导入课表数据'
                        },
                        {
                            title: '#课表设置',
                            desc: '打开课表管理面板'
                        },
                        {
                            title: '#清空课表',
                            desc: '清空当前所有课程数据'
                        }
                    ]
                },
                {
                    group: '👀 查看课表',
                    list: [
                        {
                            title: '#课表',
                            desc: '查看本周的课程安排'
                        },
                        {
                            title: '#课表 1',
                            desc: '查看指定周的课表'
                        },
                        {
                            title: '#今天课表',
                            desc: '查看今天的课程'
                        },
                        {
                            title: '#明天课表',
                            desc: '查看明天的课程'
                        },
                        {
                            title: '#下节课',
                            desc: '查看接下来的课程'
                        }
                    ]
                },
                {
                    group: '⏰ 提醒设置',
                    list: [
                        {
                            title: '#开启提醒',
                            desc: '开启上课提醒功能'
                        },
                        {
                            title: '#关闭提醒',
                            desc: '关闭上课提醒功能'
                        },
                        {
                            title: '#设置提醒时间 10',
                            desc: '设置提前多少分钟提醒（1-60分钟）'
                        }
                    ]
                },
                {
                    group: '🛠️ 其他功能',
                    list: [
                        {
                            title: '#周数',
                            desc: '查看当前是第几周'
                        },
                        {
                            title: '#上课时间',
                            desc: '查看每节课的时间安排'
                        }
                    ]
                }
            ];

            // 生成帮助图片
            const imagePath = await render.help(helpCfg, helpList);
            
            if (!imagePath) {
                throw new Error('生成帮助图片失败');
            }

            // 如果未初始化，发送提示消息
            if (!isInitialized) {
                await this.reply('⚠️ 检测到您还未完成课表初始化配置\n请先使用 #开始配置课表 进行设置');
            }

            // 发送帮助图片
            await this.reply(await this.e.segment.image(imagePath));

            // 删除临时文件
            setTimeout(() => {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }, 5000);

            return true;
        } catch (err) {
            this.logger.error(`[Class-Plugin] 生成帮助图片失败: ${err}`);
            await this.reply('生成帮助图片失败，请稍后重试');
            return true;
        }
    }
}
