import { Config } from '#components'
import schedule from 'node-schedule'

export function startScheduleTask() {
  // 每天定时检查课表
  schedule.scheduleJob('0 * * * *', async () => {
    // 获取今日课表
    // 检查提醒时间
    // 发送提醒
  })
}
