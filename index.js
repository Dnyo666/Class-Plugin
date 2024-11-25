import fs from 'node:fs';
import Init from './model/init.js'
import { Task } from './model/task.js'
import { Version } from './model/version.js'

if (!global.segment) {
  global.segment = (await import("oicq")).segment;
}

let ret = [];

logger.info(logger.yellow("- 正在载入 CLASS-PLUGIN"));

// 版本检查
const version = new Version()
await version.check()

// 初始化定时任务
new Task()

const files = fs
  .readdirSync('./plugins/class-plugin/apps')
  .filter((file) => file.endsWith('.js'));

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
  let name = files[i].replace('.js', '');

  if (ret[i].status !== 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`);
    logger.error(ret[i].reason);
    continue;
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]];
}

logger.info(logger.green("- CLASS-PLUGIN 载入成功"));

export { apps };