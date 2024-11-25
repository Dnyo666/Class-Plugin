import { Config } from '#components'
import schedule from 'node-schedule'
import { db } from '#models'
import moment from 'moment'

export function startScheduleTask() {
  // 每分钟检查一次是否需要提醒
  schedule.scheduleJob('* * * * *', async () => {
    // TODO: 检查并发送提醒
  })
} 