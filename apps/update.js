import plugin from '../../../lib/plugins/plugin.js'
import { createRequire } from 'module'
import lodash from 'lodash'
import { Restart } from '../../other/restart.js'
import { Version } from '../components/Version.js'

const require = createRequire(import.meta.url)
const { exec, execSync } = require('child_process')

let uping = false

export class Update extends plugin {
  constructor () {
    super({
      name: 'Class-Plugin-更新',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '^#?(课表|class)((插件)?(强制)?更新|update)$',
          fnc: 'update'
        }
      ]
    })
  }

  async update () {
    if (!this.e.isMaster) return false

    if (uping) {
      await this.reply('已有命令更新中..请勿重复操作')
      return
    }

    if (!(await this.checkGit())) return

    const isForce = this.e.msg.includes('强制')

    await this.runUpdate(isForce)

    if (this.isUp) {
      await this.reply('更新完毕，正在重启云崽以应用更新')
      setTimeout(() => this.restart(), 2000)
    }
  }

  restart () {
    new Restart(this.e).restart()
  }

  async runUpdate (isForce) {
    let command = 'git -C ./plugins/Class-Plugin/ pull --no-rebase'
    if (isForce) {
      command = `git -C ./plugins/Class-Plugin/ checkout . && ${command}`
      this.e.reply('正在执行强制更新操作，请稍等')
    } else {
      this.e.reply('正在执行更新操作，请稍等')
    }

    this.oldCommitId = await this.getcommitId('Class-Plugin')
    uping = true
    const ret = await this.execSync(command)
    uping = false

    if (ret.error) {
      logger.mark(`${this.e.logFnc} 更新失败：Class-Plugin`)
      this.gitErr(ret.error, ret.stdout)
      return false
    }

    const time = await this.getTime('Class-Plugin')

    if (/(Already up[ -]to[ -]date|已经是最新的)/.test(ret.stdout)) {
      await this.reply(`Class-Plugin已经是最新版本\n最后更新时间：${time}`)
    } else {
      await this.reply(`Class-Plugin\n最后更新时间：${time}`)
      this.isUp = true
      const log = await this.getLog('Class-Plugin')
      await this.reply(log)
    }

    logger.mark(`${this.e.logFnc} 最后更新时间：${time}`)

    return true
  }

  async getLog (plugin = '') {
    const cm = `cd ./plugins/${plugin}/ && git log  -20 --oneline --pretty=format:"%h||[%cd]  %s" --date=format:"%m-%d %H:%M"`

    let logAll
    try {
      logAll = await execSync(cm, { encoding: 'utf-8' })
    } catch (error) {
      logger.error(error.toString())
      this.reply(error.toString())
    }

    if (!logAll) return false

    logAll = logAll.split('\n')

    let log = []
    for (let str of logAll) {
      str = str.split('||')
      if (str[0] == this.oldCommitId) break
      if (str[1].includes('Merge branch')) continue
      log.push(str[1])
    }
    const line = log.length
    log = log.join('\n\n')

    if (log.length <= 0) return ''

    let end = '更多详细信息，请前往github查看\nhttps://github.com/Dnyo666/Class-Plugin/commits/main'

    log = await this.makeForwardMsg(`Class-Plugin更新日志，共${line}条`, log, end)

    return log
  }

  async getcommitId (plugin = '') {
    const cm = `git -C ./plugins/${plugin}/ rev-parse --short HEAD`
    let commitId = await execSync(cm, { encoding: 'utf-8' })
    commitId = lodash.trim(commitId)
    return commitId
  }

  async getTime (plugin = '') {
    const cm = `cd ./plugins/${plugin}/ && git log -1 --oneline --pretty=format:"%cd" --date=format:"%m-%d %H:%M"`

    let time = ''
    try {
      time = await execSync(cm, { encoding: 'utf-8' })
      time = lodash.trim(time)
    } catch (error) {
      logger.error(error.toString())
      time = '获取时间失败'
    }
    return time
  }

  async makeForwardMsg (title, msg, end) {
    let nickname = (this.e.bot ?? Bot).nickname
    if (this.e.isGroup) {
      let info = await (this.e.bot ?? Bot).getGroupMemberInfo(this.e.group_id, (this.e.bot ?? Bot).uin)
      nickname = info.card || info.nickname
    }
    let userInfo = {
      user_id: (this.e.bot ?? Bot).uin,
      nickname
    }

    let forwardMsg = [
      {
        ...userInfo,
        message: title
      },
      {
        ...userInfo,
        message: msg
      }
    ]

    if (end) {
      forwardMsg.push({
        ...userInfo,
        message: end
      })
    }

    if (this.e.group?.makeForwardMsg) {
      forwardMsg = await this.e.group.makeForwardMsg(forwardMsg)
    } else if (this.e?.friend?.makeForwardMsg) {
      forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg)
    } else {
      return msg.join('\n')
    }

    let dec = 'Class-Plugin 更新日志'
    if (typeof (forwardMsg.data) === 'object') {
      let detail = forwardMsg.data?.meta?.detail
      if (detail) {
        detail.news = [{ text: dec }]
      }
    } else {
      forwardMsg.data = forwardMsg.data
        .replace(/\n/g, '')
        .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
        .replace(/___+/, `<title color="#777777" size="26">${dec}</title>`)
    }

    return forwardMsg
  }

  async gitErr (err, stdout) {
    const msg = '更新失败！'
    const errMsg = err.toString()
    stdout = stdout.toString()

    if (errMsg.includes('Timed out')) {
      const remote = errMsg.match(/'(.+?)'/g)[0].replace(/'/g, '')
      await this.reply(msg + `\n连接超时：${remote}`)
      return
    }

    if (/Failed to connect|unable to access/g.test(errMsg)) {
      const remote = errMsg.match(/'(.+?)'/g)[0].replace(/'/g, '')
      await this.reply(msg + `\n连接失败：${remote}`)
      return
    }

    if (errMsg.includes('be overwritten by merge')) {
      await this.reply(msg + `存在冲突：\n${errMsg}\n请解决冲突后再更新，或者执行#强制更新，放弃本地修改`)
      return
    }

    if (stdout.includes('CONFLICT')) {
      await this.reply([
        msg + '存在冲突\n',
        errMsg,
        stdout,
        '\n请解决冲突后再更新，或者执行#强制更新，放弃本地修改'
      ])
      return
    }

    await this.reply([errMsg, stdout])
  }

  async execSync (cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  async checkGit () {
    const ret = await execSync('git --version', { encoding: 'utf-8' })
    if (!ret || !ret.includes('git version')) {
      await this.reply('请先安装git')
      return false
    }
    return true
  }
} 