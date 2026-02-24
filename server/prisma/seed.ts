// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function loadPrompt(filename: string): string {
    const filePath = path.join(__dirname, '..', 'src', 'prompts', filename);
    return fs.readFileSync(filePath, 'utf-8');
}

async function main() {
    // 1. Create default admin and users
    const adminPassword = await bcrypt.hash('admin123456', 10);
    const userPassword = await bcrypt.hash('test123456', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            username: 'admin',
            password: adminPassword,
            role: 'ADMIN',
            credits: 10000,
        },
    });

    const user = await prisma.user.upsert({
        where: { email: 'test2@test.com' },
        update: {},
        create: {
            email: 'test2@test.com',
            username: 'test2',
            password: userPassword,
            role: 'USER',
            credits: 1000,
        },
    });

    console.log('Users seeded:', { admin: admin.email, user: user.email });

    // 2. Create initial AI Provider configs based on env settings
    const geminiKey = process.env.GEMINI_API_KEY || 'REPLACE_WITH_YOUR_GEMINI_API_KEY';
    const imageKey = process.env.IMAGE_API_KEY || 'REPLACE_WITH_YOUR_IMAGE_API_KEY';
    const imageBaseUrl = process.env.IMAGE_BASE_URL || 'https://api.openai.com/v1';
    const imageModel = process.env.IMAGE_MODEL || 'dall-e-3';

    await prisma.aIProviderConfig.createMany({
        data: [
            {
                name: 'Gemini (Default Text)',
                type: 'TEXT',
                provider: 'gemini',
                apiKey: geminiKey,
                model: 'gemini-3-flash-preview',
                isActive: true,
            },
            {
                name: 'OpenAI Compatible (Default Image)',
                type: 'IMAGE',
                provider: 'openai',
                apiKey: imageKey,
                baseUrl: imageBaseUrl,
                model: imageModel,
                isActive: true,
            }
        ],
        skipDuplicates: true,
    });

    console.log('AI Providers seeded');

    // 3. Seed SystemPrompt records from prompt files
    const prompts = [
        {
            slug: 'outline-default',
            name: '大纲生成提示词',
            content: loadPrompt('outline_prompt.txt'),
            type: 'TEXT' as const,
        },
        {
            slug: 'content-default',
            name: '文案生成提示词',
            content: loadPrompt('content_prompt.txt'),
            type: 'TEXT' as const,
        },
        {
            slug: 'image-default',
            name: '图片生成提示词（完整版）',
            content: loadPrompt('image_prompt.txt'),
            type: 'IMAGE' as const,
        },
        {
            slug: 'image-short',
            name: '图片生成提示词（精简版）',
            content: loadPrompt('image_prompt_short.txt'),
            type: 'IMAGE' as const,
        },
    ];

    for (const p of prompts) {
        await prisma.systemPrompt.upsert({
            where: { slug: p.slug },
            update: { content: p.content },
            create: {
                slug: p.slug,
                name: p.name,
                content: p.content,
                type: p.type,
                isActive: true,
            },
        });
    }

    console.log('System Prompts seeded:', prompts.map(p => p.slug));

    // 4. Seed Templates
    const templates = [
        // 美妆
        {
            name: '产品测评种草',
            description: '适合美妆产品真实体验分享，突出使用感受和效果对比',
            category: '美妆',
            titlePattern: '{{产品名}} 真实测评｜用了{{天数}}天我的变化',
            contentStructure: {
                sections: [
                    { title: '开头引入', hint: '痛点共鸣或惊喜发现' },
                    { title: '产品介绍', hint: '品牌背景、价格、规格' },
                    { title: '使用体验', hint: '质地、味道、上脸感受' },
                    { title: '效果展示', hint: '前后对比、持妆效果' },
                    { title: '总结推荐', hint: '适合人群、性价比评价' },
                ],
            },
            styleGuide: { tone: '闺蜜聊天式、真实不做作', emojiFrequency: '适中，每段1-2个' },
            hashtagStrategy: ['美妆测评', '好物推荐', '护肤分享', '素颜也好看'],
            isOfficial: true,
        },
        {
            name: '妆容教程分步',
            description: '清晰的化妆步骤教学，适合日常妆/约会妆/通勤妆',
            category: '美妆',
            titlePattern: '手把手教你画{{妆容类型}}｜新手也能学会',
            contentStructure: {
                sections: [
                    { title: '妆容概览', hint: '整体风格描述和适合场景' },
                    { title: '底妆步骤', hint: '护肤→隔离→粉底→遮瑕→定妆' },
                    { title: '眼妆步骤', hint: '眼影→眼线→睫毛' },
                    { title: '唇妆修容', hint: '唇部打底→口红→腮红→高光' },
                    { title: '产品清单', hint: '所有用到的产品列表及价格' },
                ],
            },
            styleGuide: { tone: '耐心教学、鼓励式', emojiFrequency: '较多，配合步骤标注' },
            hashtagStrategy: ['化妆教程', '新手化妆', '日常妆容', '保姆级教程'],
            isOfficial: true,
        },
        // 美食
        {
            name: '探店打卡推荐',
            description: '真实探店体验分享，从环境到菜品全方位评价',
            category: '美食',
            titlePattern: '{{城市}}探店｜藏在{{地点}}的神仙小店',
            contentStructure: {
                sections: [
                    { title: '店铺信息', hint: '名称、地址、营业时间、人均消费' },
                    { title: '环境氛围', hint: '装修风格、座位数、拍照友好度' },
                    { title: '菜品推荐', hint: '必点菜品3-5道，口味描述' },
                    { title: '踩雷预警', hint: '不推荐的菜或需注意的点' },
                    { title: '总体评分', hint: '味道/环境/服务/性价比打分' },
                ],
            },
            styleGuide: { tone: '吃货视角、生动形容', emojiFrequency: '较多，用食物emoji' },
            hashtagStrategy: ['探店', '美食推荐', '吃货日记', '必吃榜'],
            isOfficial: true,
        },
        {
            name: '家常菜谱教程',
            description: '简单易学的家常菜做法，适合厨房新手',
            category: '美食',
            titlePattern: '{{菜名}}这样做太好吃了｜零失败食谱',
            contentStructure: {
                sections: [
                    { title: '成品展示', hint: '成品描述，激发食欲' },
                    { title: '食材准备', hint: '主料、辅料、调味料清单' },
                    { title: '详细步骤', hint: '分步骤写，注明火候和时间' },
                    { title: '小贴士', hint: '关键技巧、常见问题、替代食材' },
                ],
            },
            styleGuide: { tone: '温馨家常、简单直接', emojiFrequency: '适中' },
            hashtagStrategy: ['家常菜', '食谱分享', '厨房小白', '下饭菜'],
            isOfficial: true,
        },
        // 旅行
        {
            name: '城市旅行攻略',
            description: '全面的城市旅行指南，涵盖行程、住宿、美食',
            category: '旅行',
            titlePattern: '{{城市}}{{天数}}天攻略｜人均{{费用}}玩转全城',
            contentStructure: {
                sections: [
                    { title: '行程概览', hint: '天数安排、最佳季节、预算' },
                    { title: '必去景点', hint: '每天行程安排，景点推荐' },
                    { title: '住宿推荐', hint: '区域选择、酒店/民宿推荐' },
                    { title: '美食清单', hint: '当地必吃美食和推荐餐厅' },
                    { title: '实用Tips', hint: '交通、穿搭、避坑指南' },
                ],
            },
            styleGuide: { tone: '热情分享、实用干货', emojiFrequency: '适中，用出行相关emoji' },
            hashtagStrategy: ['旅行攻略', '自由行', '旅游推荐', '假期去哪玩'],
            isOfficial: true,
        },
        {
            name: '小众景点安利',
            description: '人少景美的宝藏目的地推荐',
            category: '旅行',
            titlePattern: '发现一个人少景美的地方｜{{地点}}真的绝了',
            contentStructure: {
                sections: [
                    { title: '景点发现', hint: '如何发现这个地方、第一印象' },
                    { title: '详细介绍', hint: '特色亮点、最佳观赏时间' },
                    { title: '拍照攻略', hint: '最佳机位、推荐穿搭' },
                    { title: '交通指南', hint: '怎么去、停车信息' },
                    { title: '注意事项', hint: '门票、开放时间、注意点' },
                ],
            },
            styleGuide: { tone: '惊喜发现式、画面感强', emojiFrequency: '适中' },
            hashtagStrategy: ['小众景点', '周末去哪玩', '拍照圣地', '宝藏地方'],
            isOfficial: true,
        },
        // 生活
        {
            name: '好物清单合集',
            description: '多件好物集合推荐，适合生活方式类内容',
            category: '生活',
            titlePattern: '{{场景}}好物推荐｜这{{数量}}件真的离不开了',
            contentStructure: {
                sections: [
                    { title: '引言', hint: '使用场景和选品标准' },
                    { title: '好物1', hint: '产品名+价格+推荐理由' },
                    { title: '好物2', hint: '产品名+价格+推荐理由' },
                    { title: '好物3', hint: '产品名+价格+推荐理由' },
                    { title: '总结', hint: '整体评价，最推荐哪个' },
                ],
            },
            styleGuide: { tone: '真诚分享、生活感', emojiFrequency: '较多，标注重点' },
            hashtagStrategy: ['好物推荐', '生活好物', '提升幸福感', '买了不后悔'],
            isOfficial: true,
        },
        {
            name: '房间改造记录',
            description: '租房或自住房间改造过程分享',
            category: '生活',
            titlePattern: '花{{费用}}改造我的小窝｜前后对比太惊艳',
            contentStructure: {
                sections: [
                    { title: '改造前', hint: '原始状态描述和痛点' },
                    { title: '改造思路', hint: '风格定位、预算规划' },
                    { title: '改造过程', hint: '分区域介绍改动' },
                    { title: '好物清单', hint: '购买链接和价格' },
                    { title: '改造后', hint: '最终效果和居住感受' },
                ],
            },
            styleGuide: { tone: '记录式、有成就感', emojiFrequency: '适中' },
            hashtagStrategy: ['房间改造', '租房改造', '家居好物', '小空间大改造'],
            isOfficial: true,
        },
        // 穿搭
        {
            name: 'OOTD 日常穿搭',
            description: '每日穿搭分享，展示搭配思路',
            category: '穿搭',
            titlePattern: '{{季节}}穿搭灵感｜{{风格}}风一周不重样',
            contentStructure: {
                sections: [
                    { title: '风格定位', hint: '今日穿搭风格和适合场景' },
                    { title: '单品拆解', hint: '上衣/下装/鞋子/配饰逐一介绍' },
                    { title: '搭配思路', hint: '颜色搭配/版型选择的逻辑' },
                    { title: '身材参考', hint: '身高体重、适合什么身材' },
                    { title: '购买信息', hint: '品牌、价格、购买渠道' },
                ],
            },
            styleGuide: { tone: '时尚自信、有态度', emojiFrequency: '适中' },
            hashtagStrategy: ['每日穿搭', 'OOTD', '穿搭分享', '日常穿搭'],
            isOfficial: true,
        },
        {
            name: '平价穿搭攻略',
            description: '高性价比穿搭分享，百元搭出高级感',
            category: '穿搭',
            titlePattern: '全身不超过{{价格}}元｜学生党平价穿搭',
            contentStructure: {
                sections: [
                    { title: '整体造型', hint: '风格描述和总价' },
                    { title: '平价单品', hint: '每件单品的价格和购买渠道' },
                    { title: '搭配技巧', hint: '如何让便宜衣服穿出质感' },
                    { title: '身材建议', hint: '不同身材怎么选' },
                ],
            },
            styleGuide: { tone: '亲切实用、不炫耀', emojiFrequency: '适中' },
            hashtagStrategy: ['平价穿搭', '学生党穿搭', '百元穿搭', '高性价比'],
            isOfficial: true,
        },
        // 健身
        {
            name: '居家健身计划',
            description: '不用去健身房，在家就能练的健身方案',
            category: '健身',
            titlePattern: '每天{{时间}}分钟｜居家{{部位}}训练跟练版',
            contentStructure: {
                sections: [
                    { title: '训练目标', hint: '针对部位、适合人群、难度等级' },
                    { title: '热身动作', hint: '2-3个热身动作，每个30秒' },
                    { title: '正式训练', hint: '5-8个动作，标注次数和组数' },
                    { title: '拉伸放松', hint: '训练后拉伸动作' },
                    { title: '注意事项', hint: '呼吸方法、常见错误、进阶建议' },
                ],
            },
            styleGuide: { tone: '教练式鼓励、专业但不枯燥', emojiFrequency: '适中，用运动emoji' },
            hashtagStrategy: ['居家健身', '跟练', '燃脂训练', '健身打卡'],
            isOfficial: true,
        },
        {
            name: '减脂饮食记录',
            description: '健康饮食搭配分享，适合减脂期参考',
            category: '健身',
            titlePattern: '减脂餐这样吃｜一周瘦了{{数字}}斤的饮食记录',
            contentStructure: {
                sections: [
                    { title: '饮食原则', hint: '热量控制思路、营养比例' },
                    { title: '早餐', hint: '食材和做法' },
                    { title: '午餐', hint: '食材和做法' },
                    { title: '晚餐', hint: '食材和做法' },
                    { title: '心得总结', hint: '效果反馈、坚持技巧' },
                ],
            },
            styleGuide: { tone: '自律但不苛刻、正能量', emojiFrequency: '较多' },
            hashtagStrategy: ['减脂餐', '健康饮食', '减肥食谱', '自律打卡'],
            isOfficial: true,
        },
        // 宠物
        {
            name: '萌宠日常分享',
            description: '宠物日常趣事和成长记录',
            category: '宠物',
            titlePattern: '我家{{宠物名}}又干了啥｜{{品种}}的日常太搞笑了',
            contentStructure: {
                sections: [
                    { title: '今日趣事', hint: '有趣/可爱的事件描述' },
                    { title: '宠物介绍', hint: '品种、年龄、性格特点' },
                    { title: '互动日常', hint: '和主人的互动细节' },
                    { title: '养宠心得', hint: '养护小tips或感悟' },
                ],
            },
            styleGuide: { tone: '宠溺、可爱、幽默', emojiFrequency: '很多，大量可爱emoji' },
            hashtagStrategy: ['萌宠日常', '铲屎官', '宠物成长记录', '猫猫狗狗'],
            isOfficial: true,
        },
        {
            name: '新手养宠攻略',
            description: '养宠入门指南，适合刚开始养宠物的新手',
            category: '宠物',
            titlePattern: '新手养{{宠物类型}}全攻略｜这些坑我替你踩了',
            contentStructure: {
                sections: [
                    { title: '准备工作', hint: '需要购置的用品清单' },
                    { title: '饮食指南', hint: '粮食选择、喂食频率、零食推荐' },
                    { title: '日常护理', hint: '洗澡、驱虫、疫苗' },
                    { title: '常见问题', hint: '新手常犯的错误和解决方案' },
                    { title: '费用参考', hint: '月均花费明细' },
                ],
            },
            styleGuide: { tone: '过来人经验、耐心实用', emojiFrequency: '适中' },
            hashtagStrategy: ['养宠攻略', '新手养猫', '新手养狗', '宠物用品'],
            isOfficial: true,
        },
        // 数码
        {
            name: '数码产品开箱',
            description: '新产品开箱体验和初步使用感受',
            category: '数码',
            titlePattern: '{{产品名}}开箱｜用了一周真实感受',
            contentStructure: {
                sections: [
                    { title: '购买信息', hint: '型号、配置、价格、购买渠道' },
                    { title: '开箱展示', hint: '包装、配件、外观描述' },
                    { title: '上手体验', hint: '性能、屏幕、续航等核心体验' },
                    { title: '优缺点', hint: '客观总结优点和不足' },
                    { title: '购买建议', hint: '适合什么人、和竞品对比' },
                ],
            },
            styleGuide: { tone: '理性客观、有数据支撑', emojiFrequency: '较少，偏专业' },
            hashtagStrategy: ['数码开箱', '科技好物', '产品测评', '值不值得买'],
            isOfficial: true,
        },
        {
            name: '效率工具推荐',
            description: '提升工作学习效率的 App 和工具推荐',
            category: '数码',
            titlePattern: '这{{数量}}个{{类型}}工具让我效率翻倍｜强烈推荐',
            contentStructure: {
                sections: [
                    { title: '使用场景', hint: '解决什么问题、适合谁' },
                    { title: '工具介绍', hint: '功能亮点和核心玩法' },
                    { title: '使用技巧', hint: '进阶用法和快捷操作' },
                    { title: '对比推荐', hint: '同类工具对比、免费替代方案' },
                ],
            },
            styleGuide: { tone: '效率达人、干货满满', emojiFrequency: '适中' },
            hashtagStrategy: ['效率工具', 'App推荐', '学习工具', '提升效率'],
            isOfficial: true,
        },
    ];

    for (const t of templates) {
        const existing = await prisma.template.findFirst({ where: { name: t.name, category: t.category } });
        if (!existing) {
            await prisma.template.create({
                data: {
                    name: t.name,
                    description: t.description,
                    category: t.category,
                    titlePattern: t.titlePattern,
                    contentStructure: t.contentStructure,
                    styleGuide: t.styleGuide,
                    hashtagStrategy: t.hashtagStrategy,
                    isOfficial: t.isOfficial,
                    isPublic: true,
                },
            });
        }
    }

    console.log('Templates seeded:', templates.length);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
