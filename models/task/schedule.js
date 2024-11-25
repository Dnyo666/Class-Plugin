import plugin from '../../../../lib/plugins/plugin.js'
import { createRequire } from 'module'
import schedule from 'node-schedule'
import { db } from '../db/index.js'
import moment from 'moment'

export class ScheduleTask extends plugin {
  constructor () {
    super({
      name: 'Class-Schedule-Task',
      dsc: '课表定时任务',
      event: 'message'
    })

    this.task()
  }

  async task() {
    // 每分钟检查一次是否需要提醒
    schedule.scheduleJob('* * * * *', async () => {
      const now = moment()
      const schedules = await db.getSchedule({
        weekDay: now.day(),
        remind: {
          enable: true
        }
      })
      
      for (const schedule of schedules) {
        const startTime = this.getStartTime(schedule.section)
        const diff = moment(startTime).diff(now, 'minutes')
        
        if (diff === schedule.remind.time) {
          await this.sendRemind(schedule)
        }
      }
    })
  }

  async sendRemind(schedule) {
    const msg = [
      `课程提醒:\n`,
      `${schedule.name}\n`,
      `教师:${schedule.teacher}\n`,
      `教室:${schedule.location}\n`,
      `时间:${this.getStartTime(schedule.section)}`
    ]

    if (schedule.remind.type === 'group') {
      await Bot.pickGroup(schedule.groupId).sendMsg(msg)
    } else {
      await Bot.pickFriend(schedule.userId).sendMsg(msg)
    }
  }

  getStartTime(section) {
    const times = {
      '1-2': '08:00',
      '3-4': '10:00',
      '5-6': '14:00',
      '7-8': '16:00',
      '9-10': '19:00'
    }
    return times[section]
  }
} 