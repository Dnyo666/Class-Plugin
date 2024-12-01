import { pluginResources } from '../model/path.js';
import { Config } from '../model/config.js';
import express from 'express';
import fs from 'fs/promises';

class Server {
    constructor() {
        this.app = express();
        this.data = {};
        this.server = null;
        this.init();
    }

    async init() {
        this.app.use(express.json());
        await this.checkServer();

        setInterval(() => {
            this.checkServer();
        }, 5000);

        this.app.get('/login/:id', async (req, res) => {
            const id = req.params.id;
            const filePath = this.data[id] ? '/server/login.html' : '/server/error.html';

            try {
                let data = await fs.readFile(pluginResources + filePath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                res.send(data);
            } catch (error) {
                console.error(`发送登录页失败：\n${error}`);
                res.status(500).send('Internal Server Error');
            }
        });

        this.app.post('/code/:id', async (req, res) => {
            const id = req.params.id;
            const { code } = req.body;

            if (!this.data[id]) {
                return res.status(200).json({ code: 400, msg: '链接已失效，请重新获取' });
            }

            if (!code) {
                return res.status(200).json({ code: 400, msg: '请输入识别码' });
            }

            if (code !== this.data[id].user_id) {
                return res.status(200).json({ code: 400, msg: '识别码错误' });
            }

            try {
                this.data[id].token = `${id}_${Date.now()}`;
                return res.status(200).json({ code: 200, msg: '登录成功' });
            } catch (error) {
                console.error(`登录失败：\n${error}`);
                return res.status(200).json({ code: 400, msg: error.message });
            }
        });

        this.app.get('/manage', async (req, res) => {
            try {
                let data = await fs.readFile(pluginResources + '/server/manage.html', 'utf8');
                res.setHeader('Content-Type', 'text/html');
                res.send(data);
            } catch (error) {
                console.error(`发送管理页面失败：\n${error}`);
                res.status(500).send('Internal Server Error');
            }
        });

        this.app.get('/api/course', (req, res) => {
            const { week } = req.query;
            const userId = this.getUserIdFromToken(req.headers.authorization);
            if (!userId) {
                return res.json({ code: 401, msg: '请先登录' });
            }

            try {
                const userData = Config.getUserConfig(userId);
                const courses = userData.courses.filter(course => {
                    return course.startWeek <= week && course.endWeek >= week &&
                        (course.type === 0 || 
                        (course.type === 1 && week % 2 === 1) || 
                        (course.type === 2 && week % 2 === 0));
                });
                res.json({ code: 200, data: courses });
            } catch (error) {
                console.error(`获取课程失败：\n${error}`);
                res.json({ code: 500, msg: '获取课程失败' });
            }
        });

        this.app.post('/api/course', (req, res) => {
            const userId = this.getUserIdFromToken(req.headers.authorization);
            if (!userId) {
                return res.json({ code: 401, msg: '请先登录' });
            }

            try {
                const course = req.body;
                const userData = Config.getUserConfig(userId);
                course.id = Date.now().toString();
                userData.courses.push(course);
                Config.setUserConfig(userId, userData);
                res.json({ code: 200, msg: '添加成功' });
            } catch (error) {
                console.error(`添加课程失败：\n${error}`);
                res.json({ code: 500, msg: '添加课程失败' });
            }
        });

        this.app.post('/api/course/import', (req, res) => {
            const userId = this.getUserIdFromToken(req.headers.authorization);
            if (!userId) {
                return res.json({ code: 401, msg: '请先登录' });
            }

            try {
                const { courseData } = req.body;
                // TODO: 实现课表导入逻辑
                res.json({ code: 200, msg: '导入成功' });
            } catch (error) {
                console.error(`导入课表失败：\n${error}`);
                res.json({ code: 500, msg: '导入课表失败' });
            }
        });

        this.app.use((req, res) => {
            res.redirect('/');
        });
    }

    getUserIdFromToken(token) {
        if (!token) return null;
        // 遍历所有登录数据，找到匹配的token
        for (const [id, data] of Object.entries(this.data)) {
            if (data.token === token) {
                return data.user_id;
            }
        }
        return null;
    }

    async checkServer() {
        const allowLogin = Config.defaultConfig?.server?.allowLogin ?? true;
        const port = Config.defaultConfig?.server?.port ?? 3000;

        if (allowLogin && !this.server) {
            this.server = this.app.listen(port, () => {
                console.log(`课程表管理系统已启动：http://localhost:${port}`);
            });
        }

        if (!allowLogin && this.server) {
            this.server.close((error) => {
                if (error) {
                    console.error(`关闭服务器失败: ${error}`);
                } else {
                    console.log(`服务器已关闭`);
                }
            });
            this.server = null;
        }
    }
}

export default new Server(); 