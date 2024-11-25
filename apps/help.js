import plugin from '../../../lib/plugins/plugin.js';

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
        const helpMsg = `课表插件使用帮助：
1. 课程管理
  #添加课程 课程名 教师 教室 星期 节数 周数
  例如：#添加课程 高数 张三 A101 周一 1-2 1-16周
  #删除课程 [课程ID]
  #修改课程 [课程ID] [属性]=[新值]
  
2. 课表查看
  #课表 - 查看完整课表
  #本周课表 - 查看本周课表
  
3. 调课功能
  #调课 [课程ID] [新节数]
  #取消调课 [课程ID]
  #调课记录
  
4. 提醒设置
  #开启提醒
  #关闭提醒
  #设置提醒时间 [分钟]
  #切换提醒方式

5. 其他功能
  #课表帮助 - 显示本帮助
  #课表更新 - 更新插件`

        await e.reply(helpMsg)
        return true
    }
}
