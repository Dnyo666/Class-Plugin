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

    generateVerifyCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    authMiddleware(req, res, next) {
        const token = req.headers.authorization;
        const userId = this.getUserIdFromToken(token);
        if (!userId) {
            return res.status(401).json({ code: 401, msg: '请先登录' });
        }
        req.userId = userId;
        next();
    }

    async init() {
        this.app.use(express.json());
        await this.checkServer();

        setInterval(() => {
            this.checkServer();
        }, 5000);

        this.app.get('/', (req, res) => {
            res.redirect('/login');
        });

        this.app.get('/login/:userId?', async (req, res) => {
            const userId = req.params.userId;
            if (!userId || !this.data[userId]) {
                return res.status(404).send('链接无效或已过期');
            }

            try {
                let data = await fs.readFile(pluginResources + '/server/login.html', 'utf8');
                res.setHeader('Content-Type', 'text/html');
                res.send(data);
            } catch (error) {
                console.error(`发送登录页失败：\n${error}`);
                res.status(500).send('Internal Server Error');
            }
        });

        this.app.post('/code/:userId', async (req, res) => {
            const userId = req.params.userId;
            const { code } = req.body;
            const userData = this.data[userId];

            if (!userData) {
                return res.status(200).json({ code: 400, msg: '链接已失效，请重新获取' });
            }

            if (Date.now() - userData.created_at > 10 * 60 * 1000) {
                delete this.data[userId];
                return res.status(200).json({ code: 400, msg: '链接已过期，请重新获取' });
            }

            if (!code) {
                return res.status(200).json({ code: 400, msg: '请输入识别码' });
            }

            if (code !== userData.verify_code) {
                return res.status(200).json({ code: 400, msg: '识别码错误' });
            }

            try {
                userData.token = `${userId}_${Date.now()}`;
                return res.status(200).json({ 
                    code: 200, 
                    msg: '登录成功',
                    data: { token: userData.token }
                });
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

        this.app.get('/api/current', this.authMiddleware.bind(this), (req, res) => {
            try {
                const userData = Config.getUserConfig(req.userId);
                const startDate = userData.base?.startDate;
                if (!startDate) {
                    return res.json({ code: 400, msg: '请先设置开学日期' });
                }

                const now = new Date();
                const start = new Date(startDate);
                const diff = now - start;
                const currentWeek = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
                const currentDay = now.getDay() || 7; // 转换周日的0为7

                res.json({
                    code: 200,
                    data: {
                        currentWeek: currentWeek > 0 ? currentWeek : 1,
                        currentDay,
                        maxWeek: userData.base?.maxWeek || 20
                    }
                });
            } catch (error) {
                console.error(`获取当前周次失败：\n${error}`);
                res.json({ code: 500, msg: '获取当前周次失败' });
            }
        });

        this.app.get('/api/course', this.authMiddleware.bind(this), (req, res) => {
            const { week } = req.query;
            try {
                const userData = Config.getUserConfig(req.userId);
                if (!userData.courses) {
                    return res.json({ code: 200, data: [] });
                }

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

        this.app.post('/api/course', this.authMiddleware.bind(this), (req, res) => {
            try {
                const course = req.body;
                const userData = Config.getUserConfig(req.userId);
                
                // 验证课程数据
                if (!course.name || !course.teacher || !course.room ||
                    !Number.isInteger(course.day) || course.day < 1 || course.day > 7 ||
                    !Number.isInteger(course.startNode) || course.startNode < 1 || course.startNode > 9 ||
                    !Number.isInteger(course.endNode) || course.endNode < 2 || course.endNode > 10 ||
                    course.endNode <= course.startNode ||
                    !Number.isInteger(course.startWeek) || course.startWeek < 1 ||
                    !Number.isInteger(course.endWeek) || course.endWeek < course.startWeek ||
                    !Number.isInteger(course.type) || course.type < 0 || course.type > 2) {
                    return res.json({ code: 400, msg: '课程数据格式错误' });
                }

                // 添加课程ID
                course.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                // 初始化课程数组
                if (!userData.courses) userData.courses = [];
                userData.courses.push(course);

                // 保存数据
                if (Config.setUserConfig(req.userId, userData)) {
                    res.json({ code: 200, msg: '添加成功' });
                } else {
                    res.json({ code: 500, msg: '保存课程数据失败' });
                }
            } catch (error) {
                console.error(`添加课程失败：\n${error}`);
                res.json({ code: 500, msg: '添加课程失败' });
            }
        });

        this.app.post('/api/course/import', this.authMiddleware.bind(this), (req, res) => {
            try {
                const { courseData } = req.body;
                const userData = Config.getUserConfig(req.userId);

                // 适配转换课表数据
                const courses = this.adaptCourseData(courseData);

                // 添加课程ID
                courses.forEach(course => {
                    course.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                });

                // 保存课程数据
                if (!userData.courses) userData.courses = [];
                userData.courses.push(...courses);
                
                if (Config.setUserConfig(req.userId, userData)) {
                    res.json({ code: 200, msg: `成功导入 ${courses.length} 门课程` });
                } else {
                    res.json({ code: 500, msg: '保存课程数据失败' });
                }
            } catch (error) {
                console.error(`导入课表失败：\n${error}`);
                res.json({ code: 400, msg: error.message });
            }
        });

        this.app.use((req, res) => {
            res.redirect('/');
        });
    }

    getUserIdFromToken(token) {
        if (!token) return null;
        const userId = token.split('_')[0];
        const userData = this.data[userId];
        return userData?.token === token ? userId : null;
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

    // 课表数据适配转换
    adaptCourseData(rawData) {
        try {
            // 尝试解析JSON
            let data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            // 如果是数组，包装成标准格式
            if (Array.isArray(data)) {
                data = { courses: data };
            }

            // 如果没有courses字段，可能是其他格式
            if (!data.courses && typeof data === 'object') {
                // 尝试适配其他格式
                if (data.courseList || data.lessonList || data.lessons) {
                    data = { courses: data.courseList || data.lessonList || data.lessons };
                } else if (data.data && (data.data.courseList || data.data.lessonList || data.data.lessons)) {
                    data = { courses: data.data.courseList || data.data.lessonList || data.data.lessons };
                }
            }

            if (!Array.isArray(data.courses)) {
                throw new Error('无法识别的课表数据格式');
            }

            // 标准化每个课程的数据
            const courses = data.courses.map(course => {
                // 处理不同的字段名
                const name = course.name || course.courseName || course.lessonName || course.title || '';
                const teacher = course.teacher || course.teacherName || course.lessonTeacher || '';
                const room = course.room || course.location || course.classRoom || course.place || '';
                
                // 处理星期
                let day = course.day || course.weekDay || course.dayOfWeek;
                if (typeof day === 'string') {
                    const weekMap = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7};
                    day = weekMap[day.replace(/[周星期]/g, '')] || parseInt(day);
                }

                // 处理节次
                let startNode = course.startNode || course.startSection || course.start || 1;
                let endNode = course.endNode || course.endSection || course.end || startNode;
                if (typeof startNode === 'string') startNode = parseInt(startNode);
                if (typeof endNode === 'string') endNode = parseInt(endNode);

                // 处理周数
                let startWeek = course.startWeek || 1;
                let endWeek = course.endWeek || course.maxWeek || 20;
                if (typeof startWeek === 'string') startWeek = parseInt(startWeek);
                if (typeof endWeek === 'string') endWeek = parseInt(endWeek);

                // 处理单双周
                let type = 0; // 默认每周都有
                if (course.type !== undefined) {
                    type = parseInt(course.type);
                } else if (course.weekType) {
                    if (typeof course.weekType === 'string') {
                        if (course.weekType.includes('单')) type = 1;
                        else if (course.weekType.includes('双')) type = 2;
                    } else {
                        type = course.weekType;
                    }
                } else if (Array.isArray(course.weeks)) {
                    // 分析weeks数组判断单双周
                    const weeks = course.weeks.sort((a, b) => a - b);
                    if (weeks.length >= 2) {
                        const diff = weeks[1] - weeks[0];
                        if (diff === 2) {
                            type = weeks[0] % 2 === 1 ? 1 : 2;
                            startWeek = weeks[0];
                            endWeek = weeks[weeks.length - 1];
                        }
                    }
                }

                return {
                    name,
                    teacher,
                    room,
                    day,
                    startNode,
                    endNode,
                    startWeek,
                    endWeek,
                    type
                };
            }).filter(course => {
                // 验证必要字段
                return course.name && 
                       course.day >= 1 && course.day <= 7 &&
                       course.startNode >= 1 && course.startNode <= 9 &&
                       course.endNode >= 2 && course.endNode <= 10 &&
                       course.endNode > course.startNode &&
                       course.startWeek >= 1 &&
                       course.endWeek >= course.startWeek &&
                       course.type >= 0 && course.type <= 2;
            });

            return courses;
        } catch (error) {
            console.error('课表数据适配失败:', error);
            throw new Error('课表数据格式不正确');
        }
    }
}

export default new Server(); 