import { pluginResources } from '../model/path.js';
import Config from "./Config.js";
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
            res.send('课程表管理页面 - 开发中');
        });

        this.app.use((req, res) => {
            res.redirect('/');
        });
    }

    async checkServer() {
        const config = await Config.getConfig();
        const allowLogin = config?.server?.allowLogin ?? true;
        const port = config?.server?.port ?? 3000;

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