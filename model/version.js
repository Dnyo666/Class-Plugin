import fs from 'fs'

const _path = process.cwd()

const Version = {
    isMiao: false,
    yunzai: '',
    get version() {
        return '1.0.0'
    }
}

let packageJson = {}
try {
    packageJson = JSON.parse(fs.readFileSync(`${_path}/package.json`, 'utf8'))
} catch (err) {
    packageJson = {}
}

Version.isMiao = packageJson.name === 'miao-yunzai'
Version.yunzai = packageJson.version

export default Version 