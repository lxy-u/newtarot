import { _decorator, Component, Node, UITransform, Label, Button, UIOpacity, Vec3, tween, Graphics } from 'cc';
import { NodeHelper } from '../../scripts/utils/NodeHelper';
import { Anim } from '../../scripts/utils/Anim';

const { ccclass } = _decorator;

interface Level {
    day: string;
    story: string;
    who: string;
    scene: string;
    q: string;
    options: string[];
    answer: number;
    res: number;
    memory: string;
}

const LEVELS: Level[] = [
    {
        day: '第 -7 天',
        who: '【清晨 · 你的卧室】',
        story: '你猛地坐起,手机日历停在末世爆发前 7 天。窗外阳光正好——可你知道,38 天后这座城市将变成地狱。',
        scene: '超市 · 抢购前夜',
        q: '你冲进超市开始囤货。一个老太太拦住你,说愿意用 50 罐头换你手里的 50 元现金。前世的你记得这张脸——她是?',
        options: [
            '热心的邻居奶奶,纯粹想帮你',
            '前世害过你的人,借机套出你的银行卡信息',
            '和你一样的重生者,在试探你',
            '境外势力卧底,物资里藏着追踪器',
        ],
        answer: 1,
        res: 0,
        memory: '这是 3 单元的周婆婆。前世末世第 5 天,她"借"走你手机帮忙联系家人,转走了你卡里全部存款。别和她有任何金钱往来——拒绝,然后去别的货架。',
    },
    {
        day: '第 -6 天',
        who: '【银行】',
        story: '你需要现金,但前世的记忆告诉你:末世后纸币一文不值,能换成实物的额度要尽快花掉。',
        scene: '银行 · 资金规划',
        q: '你账户里有 30 万。最聪明的花法是?',
        options: [
            '全部留在卡里,末世后还能转账应急',
            '全换成黄金首饰,保值又好携带',
            '换成抗生素/燃料/罐头等硬通货物资',
            '存定期,等末世结束后取本金加利息',
        ],
        answer: 2,
        res: 40,
        memory: '末世后,能吃、能治病、能烧火的东西才是真钱。黄金不能吃,银行系统第 9 天就瘫痪了。你把 30 万全换成了物资。物资 +40',
    },
    {
        day: '第 -5 天',
        who: '【物业办公室】',
        story: '物业经理老马笑眯眯地找你聊天,说社区要登记各家的"应急储备情况"。',
        scene: '物业 · 信息陷阱',
        q: '老马问你家囤了多少物资,要"统一登记方便调配"。你怎么答?',
        options: [
            '如实上报,做个守规矩的好居民',
            '随便报个小数字,说自己也没准备什么',
            '反问他为什么要登记,当场拆穿他',
            '上报一个夸张的大数字,吓退别人',
        ],
        answer: 1,
        res: 0,
        memory: '前世这份"登记表",末世第 6 天就成了抢劫名单——老马带人挨家按表搜刮。哭穷,藏好,别让任何人知道你的底牌。当场拆穿他只会打草惊蛇。',
    },
    {
        day: '第 -4 天',
        who: '【医院后门】',
        story: '你想起前世的一个秘密:市医院后门的旧药库,末世时没人知道,堆满了过期前还能用的抗生素。',
        scene: '医院 · 隐藏点位',
        q: '药库锁着,门口有个保安。你最好的办法是?',
        options: [
            '硬闯,反正末世要来了无所谓',
            '塞钱给保安,说家里老人急用药',
            '等夜里翻窗进去偷',
            '举报医院私藏药品,等警察来开门',
        ],
        answer: 1,
        res: 35,
        memory: '末世前你还是个普通人,留下案底或结仇都是负担。一点小钱+一个合理的理由,保安根本懒得管。你搬空了半个药库。物资 +35',
    },
    {
        day: '第 -3 天',
        who: '【你家楼下】',
        story: '前世的未婚妻林晚晴突然来找你,挽着你的手说想复合,还说"以后我们一起面对所有困难"。',
        scene: '情感 · 渣女试探',
        q: '前世她在末世第 12 天为了一箱物资把你推给了丧尸。现在她来复合,你应该?',
        options: [
            '感动地答应,也许这一世她变了',
            '冷静拒绝,绝不让她知道你的安全屋位置',
            '假意答应,把她骗进来当人质',
            '当场揭穿她前世的所作所为',
        ],
        answer: 1,
        res: 0,
        memory: '她不是变了,是嗅到了你身上"有准备"的味道。前世她也是这样靠近你的。礼貌拒绝,转身就走——别揭穿(她会反咬你疯),也别留她(隐患)。',
    },
    {
        day: '第 -2 天',
        who: '【五金店】',
        story: '还剩最后两天。你的安全屋还缺最关键的一样东西。',
        scene: '五金店 · 防御准备',
        q: '只够再买一样大件,哪个对守住安全屋最关键?',
        options: [
            '一台大功率空调,舒舒服服过末世',
            '加固防盗门 + 窗户钢板,挡住抢劫和丧尸',
            '一台 65 寸电视,末世也要有娱乐',
            '十箱烟酒,用来跟人换东西',
        ],
        answer: 1,
        res: 25,
        memory: '末世第一波死的人,八成不是饿死的,是被破门而入害死的。门和窗是你和地狱之间唯一的那道线。物资 +25',
    },
    {
        day: '第 -1 天',
        who: '【深夜 · 敲门声】',
        story: '邻居张哥敲门,说他孩子高烧不退,求你给点退烧药。你记得——这孩子末世第 8 天会变成丧尸。',
        scene: '道德困境 · 第一只丧尸',
        q: '前世正是这个被忽视的病例引爆了整栋楼。你怎么做?',
        options: [
            '给药,救人要紧,管它前世怎样',
            '不开门,装作不在家',
            '给药,并坚持让他们今晚就送孩子去城外医院隔离',
            '报警说他家有传染病,让人来强制带走',
        ],
        answer: 2,
        res: 0,
        memory: '那不是普通高烧,是感染初期症状。不管会让灾难提前;报警会害死那家人也暴露你。救孩子+主动隔离,既救了人,又把丧尸源头清出了这栋楼。',
    },
    {
        day: '第 1 天',
        who: '【末世爆发】',
        story: '警报响彻全城。丧尸潮涌上街头。而你——安全屋齐备,物资满仓,门窗如铁。前世害过你的人,此刻正在外面绝望地拍门。',
        scene: '反击日 · 你说了算',
        q: '周婆婆、林晚晴、物业老马都跪在你门外哀求。你这一世的态度是?',
        options: [
            '全部放进来,大度地原谅所有人',
            '全部无视,谁也不救,独自苟活',
            '按各人本性区别对待:可救的救,危险的拒之门外',
            '开门把他们都骗进来,一个个报前世的仇',
        ],
        answer: 2,
        res: 0,
        memory: '重生不是为了复仇,也不是当滥好人——是为了用清醒的眼睛重新选人。该救的救,该防的防。你不再是那个谁都信的傻子了。你活下来了。',
    },
];

@ccclass('WendaGame')
export class WendaGame extends Component {

    private closeCb: (() => void) | null = null;

    private startScreen: Node = null;
    private playScreen: Node = null;
    private endScreen: Node = null;

    private hpLbl: Label = null;
    private resLbl: Label = null;
    private dayLbl: Label = null;
    private progressBar: Node = null;
    private storyLbl: Label = null;
    private sceneLbl: Label = null;
    private questionLbl: Label = null;
    private optionsRoot: Node = null;

    private revealPanel: Node = null;
    private revealOpacity: UIOpacity = null;
    private verdictLbl: Label = null;
    private memoryLbl: Label = null;

    private endEmojiLbl: Label = null;
    private endTitleLbl: Label = null;
    private endSubLbl: Label = null;
    private endDayLbl: Label = null;
    private endCorrectLbl: Label = null;
    private endResLbl: Label = null;
    private endRankLbl: Label = null;

    private hurtOverlay: UIOpacity = null;

    private idx = 0;
    private hp = 100;
    private res = 0;
    private correct = 0;
    private locked = false;
    private revealCb: (() => void) | null = null;

    private optionNodes: Node[] = [];
    private optionLabels: Label[] = [];
    private optionKeyBgs: Node[] = [];
    private optionKeyLbls: Label[] = [];
    private optionOpacities: UIOpacity[] = [];

    setCloseCallback(cb: () => void): void {
        this.closeCb = cb;
    }

    start(): void {
        this.node.addComponent(UITransform).setContentSize(700, 1200);
        this.buildStartScreen();
        this.buildPlayScreen();
        this.buildEndScreen();
        this.buildRevealPanel();
        this.buildHurtOverlay();
        this.showScreen('start');
    }

    onDestroy(): void {
        this.stopTimers();
    }

    private showScreen(name: 'start' | 'play' | 'end'): void {
        if (this.startScreen) this.startScreen.active = name === 'start';
        if (this.playScreen) this.playScreen.active = name === 'play';
        if (this.endScreen) this.endScreen.active = name === 'end';
    }

    private buildStartScreen(): void {
        const s = new Node('StartScreen');
        this.node.addChild(s);
        s.addComponent(UITransform).setContentSize(700, 1200);

        NodeHelper.makeLabel('前世问答', s, 18, '#ff5b5b', 0, 470);
        NodeHelper.makeLabel('真假记忆', s, 64, '#F0E4CC', 0, 380);

        const sub1 = NodeHelper.makeLabel('你重生回末世爆发前 7 天', s, 20, '#8a8a9a', 0, 300);
        const sub2 = NodeHelper.makeLabel('你记得未来。但没人信你。', s, 20, '#8a8a9a', 0, 270);
        sub1.getComponent(UITransform).setContentSize(620, 30);
        sub2.getComponent(UITransform).setContentSize(620, 30);

        const card = NodeHelper.makeNode('Desc', s, 600, 360, '#16161f', 0, 30);
        this.descLine(card, '末世已经发生过一次了。', '#cfcfda', 130);
        this.descLine(card, '你死在第 38 天——', '#cfcfda', 90);
        this.descLine(card, '被信错的人捅了一刀。', '#cfcfda', 60);
        this.descLine(card, '现在你回来了。', '#cfcfda', 10);
        this.descLine(card, '利用前世的记忆,识破每一个伪装、', '#cfcfda', -30);
        this.descLine(card, '躲过每一个陷阱。', '#cfcfda', -60);
        this.descLine(card, '答对,活下去;答错,重蹈覆辙。', '#ffc24b', -120);

        const startBtn = NodeHelper.makeNode('StartBtn', s, 460, 90, '#ff5b5b', 0, -260);
        startBtn.addComponent(Button);
        NodeHelper.makeLabel('睁开眼睛', startBtn, 26, '#FFFFFF');
        startBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(startBtn);
            this.beginGame();
        });

        const homeBtn = NodeHelper.makeNode('HomeBtn', s, 200, 56, '#2A2545', 0, -370);
        homeBtn.addComponent(Button);
        NodeHelper.makeLabel('返回大厅', homeBtn, 18, '#b5b5c2');
        homeBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(homeBtn);
            this.exit();
        });

        this.startScreen = s;
    }

    private descLine(parent: Node, text: string, hex: string, y: number): void {
        const n = new Node('Line');
        parent.addChild(n);
        n.setPosition(0, y, 0);
        n.addComponent(UITransform).setContentSize(560, 30);
        const lb = n.addComponent(Label);
        lb.fontSize = 18;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
    }

    private buildPlayScreen(): void {
        const p = new Node('PlayScreen');
        this.node.addChild(p);
        p.addComponent(UITransform).setContentSize(700, 1200);
        p.active = false;

        const hudY = 510;
        const hpBox = NodeHelper.makeNode('HUD_HP', p, 200, 80, '#1e1e2b', -220, hudY);
        NodeHelper.makeLabel('生命', hpBox, 14, '#8a8a9a', 0, 18);
        this.hpLbl = this.valLabel(hpBox, '100', 26, '#ff5b5b', 0, -16);

        const resBox = NodeHelper.makeNode('HUD_RES', p, 200, 80, '#1e1e2b', 0, hudY);
        NodeHelper.makeLabel('物资', resBox, 14, '#8a8a9a', 0, 18);
        this.resLbl = this.valLabel(resBox, '0', 26, '#ffc24b', 0, -16);

        const dayBox = NodeHelper.makeNode('HUD_DAY', p, 200, 80, '#1e1e2b', 220, hudY);
        NodeHelper.makeLabel('天数', dayBox, 14, '#8a8a9a', 0, 18);
        this.dayLbl = this.valLabel(dayBox, '第 -7 天', 22, '#5bc8ff', 0, -16);

        const barBg = NodeHelper.makeNode('ProgressBg', p, 620, 8, '#222230', 0, 440);
        const bar = NodeHelper.makeNode('Progress', barBg, 4, 8, '#ff5b5b', -308, 0);
        this.progressBar = bar;

        const storyCard = NodeHelper.makeNode('StoryCard', p, 620, 200, '#1a1a26', 0, 290);
        const accent = NodeHelper.makeNode('Accent', storyCard, 4, 200, '#ff5b5b', -310, 0);
        accent.active = true;
        const storyNode = new Node('Story');
        storyCard.addChild(storyNode);
        storyNode.setPosition(10, 0, 0);
        storyNode.addComponent(UITransform).setContentSize(580, 180);
        const sl = storyNode.addComponent(Label);
        sl.fontSize = 18;
        sl.color = NodeHelper.hex('#cfcfda');
        sl.overflow = Label.Overflow.SHRINK;
        sl.enableWrapText = true;
        sl.string = '';
        this.storyLbl = sl;

        const sceneTag = NodeHelper.makeNode('SceneTag', p, 360, 36, '#2a2a3a', 0, 160);
        const scNode = new Node('Scene');
        sceneTag.addChild(scNode);
        scNode.addComponent(UITransform).setContentSize(360, 36);
        const scLb = scNode.addComponent(Label);
        scLb.fontSize = 16;
        scLb.color = NodeHelper.hex('#5bc8ff');
        scLb.string = '';
        this.sceneLbl = scLb;

        const qNode = new Node('Question');
        p.addChild(qNode);
        qNode.setPosition(0, 70, 0);
        qNode.addComponent(UITransform).setContentSize(640, 120);
        const ql = qNode.addComponent(Label);
        ql.fontSize = 20;
        ql.color = NodeHelper.hex('#F0E4CC');
        ql.overflow = Label.Overflow.SHRINK;
        ql.enableWrapText = true;
        ql.string = '';
        this.questionLbl = ql;

        const optsRoot = new Node('OptionsRoot');
        p.addChild(optsRoot);
        optsRoot.setPosition(0, -180, 0);
        optsRoot.addComponent(UITransform).setContentSize(640, 480);
        this.optionsRoot = optsRoot;

        const keys = ['A', 'B', 'C', 'D'];
        const optH = 100;
        const gap = 12;
        for (let i = 0; i < 4; i++) {
            const y = 180 - i * (optH + gap);
            const opt = NodeHelper.makeNode(`Opt_${i}`, optsRoot, 640, optH, '#1e1e2b', 0, y);
            opt.addComponent(Button);
            opt.addComponent(UIOpacity);

            const keyBg = NodeHelper.makeNode('Key', opt, 44, 44, '#2c2c3c', -278, 0);
            const keyLb = NodeHelper.makeLabel(keys[i], keyBg, 20, '#b5b5c2');

            const txtNode = new Node('Txt');
            opt.addChild(txtNode);
            txtNode.setPosition(30, 0, 0);
            txtNode.addComponent(UITransform).setContentSize(540, optH - 10);
            const txtLb = txtNode.addComponent(Label);
            txtLb.fontSize = 17;
            txtLb.color = NodeHelper.hex('#e8e8ec');
            txtLb.overflow = Label.Overflow.SHRINK;
            txtLb.enableWrapText = true;
            txtLb.string = '';

            const idx = i;
            opt.on(Node.EventType.TOUCH_END, () => this.pick(idx));

            this.optionNodes.push(opt);
            this.optionLabels.push(txtLb);
            this.optionKeyBgs.push(keyBg);
            this.optionKeyLbls.push(keyLb.getComponent(Label));
            this.optionOpacities.push(opt.getComponent(UIOpacity));
        }

        const back = NodeHelper.makeNode('PlayBack', p, 110, 50, '#2A2545', -285, 575);
        back.addComponent(Button);
        NodeHelper.makeLabel('‹ 大厅', back, 16, '#b5b5c2');
        back.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(back);
            this.exit();
        });

        this.playScreen = p;
    }

    private valLabel(parent: Node, text: string, size: number, hex: string, x: number, y: number): Label {
        const n = new Node('Val');
        parent.addChild(n);
        n.setPosition(x, y, 0);
        n.addComponent(UITransform).setContentSize(190, 36);
        const lb = n.addComponent(Label);
        lb.fontSize = size;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        return lb;
    }

    private buildRevealPanel(): void {
        const r = NodeHelper.makeNode('Reveal', this.node, 700, 540, '#1a1a26', 0, -330);
        const op = r.addComponent(UIOpacity);
        op.opacity = 0;
        r.active = false;

        const accent = NodeHelper.makeNode('TopLine', r, 700, 3, '#2c2c3c', 0, 268);
        accent.active = true;

        const vNode = new Node('Verdict');
        r.addChild(vNode);
        vNode.setPosition(0, 200, 0);
        vNode.addComponent(UITransform).setContentSize(640, 40);
        const vl = vNode.addComponent(Label);
        vl.fontSize = 22;
        vl.color = NodeHelper.hex('#3ddc84');
        vl.string = '';
        this.verdictLbl = vl;

        const mNode = new Node('Memory');
        r.addChild(mNode);
        mNode.setPosition(0, 40, 0);
        mNode.addComponent(UITransform).setContentSize(640, 280);
        const ml = mNode.addComponent(Label);
        ml.fontSize = 17;
        ml.color = NodeHelper.hex('#c5c5d2');
        ml.overflow = Label.Overflow.SHRINK;
        ml.enableWrapText = true;
        ml.string = '';
        this.memoryLbl = ml;

        const next = NodeHelper.makeNode('NextBtn', r, 460, 80, '#ff5b5b', 0, -190);
        next.addComponent(Button);
        NodeHelper.makeLabel('继续', next, 22, '#FFFFFF');
        next.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(next);
            this.next();
        });

        this.revealPanel = r;
        this.revealOpacity = op;
    }

    private buildEndScreen(): void {
        const e = new Node('EndScreen');
        this.node.addChild(e);
        e.addComponent(UITransform).setContentSize(700, 1200);
        e.active = false;

        this.endEmojiLbl = this.bigLabel(e, '💀', 72, '#FFFFFF', 0, 440);
        this.endTitleLbl = this.bigLabel(e, '', 34, '#F0E4CC', 0, 340);
        this.endSubLbl = this.bigLabel(e, '', 16, '#8a8a9a', 0, 290);

        const panel = NodeHelper.makeNode('EndPanel', e, 560, 220, '#1a1a26', 0, 130);
        this.endDayLbl = this.makeKVRow(panel, '存活天数', 60);
        this.endCorrectLbl = this.makeKVRow(panel, '识破真相', 0);
        this.endResLbl = this.makeKVRow(panel, '囤积物资', -60);

        const rankNode = new Node('Rank');
        e.addChild(rankNode);
        rankNode.setPosition(0, -80, 0);
        rankNode.addComponent(UITransform).setContentSize(620, 160);
        const rl = rankNode.addComponent(Label);
        rl.fontSize = 17;
        rl.color = NodeHelper.hex('#cfcfda');
        rl.overflow = Label.Overflow.SHRINK;
        rl.enableWrapText = true;
        rl.string = '';
        this.endRankLbl = rl;

        const again = NodeHelper.makeNode('EndAgain', e, 460, 80, '#ff5b5b', 0, -280);
        again.addComponent(Button);
        NodeHelper.makeLabel('再活一次', again, 22, '#FFFFFF');
        again.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(again);
            this.beginGame();
        });

        const home = NodeHelper.makeNode('EndHome', e, 460, 70, '#2A2545', 0, -375);
        home.addComponent(Button);
        NodeHelper.makeLabel('返回大厅', home, 18, '#b5b5c2');
        home.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(home);
            this.exit();
        });

        this.endScreen = e;
    }

    private bigLabel(parent: Node, text: string, size: number, hex: string, x: number, y: number): Label {
        const n = new Node('Lbl');
        parent.addChild(n);
        n.setPosition(x, y, 0);
        n.addComponent(UITransform).setContentSize(640, size + 20);
        const lb = n.addComponent(Label);
        lb.fontSize = size;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        return lb;
    }

    private makeKVRow(parent: Node, key: string, y: number): Label {
        NodeHelper.makeLabel(key, parent, 18, '#cfcfda', -190, y);
        const valN = new Node('Val');
        parent.addChild(valN);
        valN.setPosition(190, y, 0);
        valN.addComponent(UITransform).setContentSize(240, 32);
        const lb = valN.addComponent(Label);
        lb.fontSize = 20;
        lb.color = NodeHelper.hex('#ffc24b');
        lb.string = '0';
        return lb;
    }

    private buildHurtOverlay(): void {
        const o = NodeHelper.makeNode('HurtOverlay', this.node, 700, 1200, '#ff2b2b', 0, 0);
        const op = o.addComponent(UIOpacity);
        op.opacity = 0;
        this.hurtOverlay = op;
    }

    private hurtFlash(): void {
        if (!this.hurtOverlay) return;
        this.hurtOverlay.opacity = 0;
        tween(this.hurtOverlay)
            .to(0.1, { opacity: 80 })
            .to(0.25, { opacity: 0 })
            .start();
    }

    private beginGame(): void {
        this.stopTimers();
        this.idx = 0;
        this.hp = 100;
        this.res = 0;
        this.correct = 0;
        this.locked = false;
        this.hideReveal();
        this.showScreen('play');
        this.render();
    }

    private render(): void {
        const lv = LEVELS[this.idx];
        this.locked = false;
        this.hpLbl.string = String(this.hp);
        this.resLbl.string = String(this.res);
        this.dayLbl.string = lv.day;

        const ratio = this.idx / LEVELS.length;
        const fullW = 620;
        const w = Math.max(4, fullW * ratio);
        this.progressBar.getComponent(UITransform).setContentSize(w, 8);
        this.progressBar.setPosition(-fullW / 2 + w / 2, 0, 0);

        this.storyLbl.string = lv.who + ' ' + lv.story;
        this.sceneLbl.string = '◆ ' + lv.scene;
        this.questionLbl.string = lv.q;

        for (let i = 0; i < 4; i++) {
            this.optionLabels[i].string = lv.options[i];
            this.resetOptionStyle(i);
            this.optionOpacities[i].opacity = 255;
        }
    }

    private resetOptionStyle(i: number): void {
        const node = this.optionNodes[i];
        const w = 640, h = 100;
        const g = node.getComponent(Graphics);
        if (g) {
            g.clear();
            g.fillColor = NodeHelper.hex('#1e1e2b');
            g.rect(-w / 2, -h / 2, w, h);
            g.fill();
        }
        const keyBgNode = this.optionKeyBgs[i];
        const kg = keyBgNode.getComponent(Graphics);
        if (kg) {
            kg.clear();
            kg.fillColor = NodeHelper.hex('#2c2c3c');
            kg.rect(-22, -22, 44, 44);
            kg.fill();
        }
        this.optionKeyLbls[i].color = NodeHelper.hex('#b5b5c2');
        this.optionLabels[i].color = NodeHelper.hex('#e8e8ec');
    }

    private markOption(i: number, kind: 'correct' | 'wrong' | 'dim'): void {
        const node = this.optionNodes[i];

        let bg: string, keyBg: string, keyFg: string, txtColor: string;
        if (kind === 'correct') {
            bg = '#16291f'; keyBg = '#3ddc84'; keyFg = '#0a0a0f'; txtColor = '#3ddc84';
        } else if (kind === 'wrong') {
            bg = '#2a1719'; keyBg = '#ff5b5b'; keyFg = '#0a0a0f'; txtColor = '#ff5b5b';
        } else {
            bg = '#1e1e2b'; keyBg = '#2c2c3c'; keyFg = '#b5b5c2'; txtColor = '#8a8a9a';
        }

        const w = 640, h = 100;
        const g = node.getComponent(Graphics);
        if (g) {
            g.clear();
            g.fillColor = NodeHelper.hex(bg);
            g.rect(-w / 2, -h / 2, w, h);
            g.fill();
        }

        const keyBgNode = this.optionKeyBgs[i];
        const kg = keyBgNode.getComponent(Graphics);
        if (kg) {
            kg.clear();
            kg.fillColor = NodeHelper.hex(keyBg);
            kg.rect(-22, -22, 44, 44);
            kg.fill();
        }
        this.optionKeyLbls[i].color = NodeHelper.hex(keyFg);
        this.optionLabels[i].color = NodeHelper.hex(txtColor);

        if (kind === 'dim') {
            this.optionOpacities[i].opacity = 110;
        }
    }

    private pick(i: number): void {
        if (this.locked) return;
        this.locked = true;
        const lv = LEVELS[this.idx];
        const ok = i === lv.answer;

        for (let k = 0; k < 4; k++) {
            if (k === lv.answer) this.markOption(k, 'correct');
            else if (k === i) this.markOption(k, 'wrong');
            else this.markOption(k, 'dim');
        }

        if (ok) {
            this.correct++;
            this.res += lv.res;
            this.verdictLbl.string = '✓ 前世的记忆没有骗你';
            this.verdictLbl.color = NodeHelper.hex('#3ddc84');
        } else {
            this.hp -= 25;
            this.verdictLbl.string = '✗ 你又重蹈了覆辙  —  生命 -25';
            this.verdictLbl.color = NodeHelper.hex('#ff5b5b');
            this.hurtFlash();
            Anim.shake(this.playScreen);
        }

        this.hpLbl.string = String(this.hp);
        this.resLbl.string = String(this.res);
        this.memoryLbl.string = '前世记忆 · ' + lv.memory;
        this.showReveal();
    }

    private showReveal(): void {
        this.revealPanel.active = true;
        this.revealOpacity.opacity = 0;
        this.revealPanel.setPosition(0, -460, 0);
        tween(this.revealOpacity).to(0.2, { opacity: 255 }).start();
        tween(this.revealPanel).to(0.3, { position: new Vec3(0, -330, 0) }, { easing: 'backOut' }).start();
    }

    private hideReveal(): void {
        if (!this.revealPanel) return;
        this.revealPanel.active = false;
        this.revealOpacity.opacity = 0;
    }

    private next(): void {
        this.hideReveal();
        if (this.hp <= 0) { this.end(false); return; }
        this.idx++;
        if (this.idx >= LEVELS.length) { this.end(true); return; }
        this.revealCb = () => this.render();
        this.scheduleOnce(this.revealCb, 0.25);
    }

    private end(survived: boolean): void {
        this.stopTimers();
        const fullW = 620;
        this.progressBar.getComponent(UITransform).setContentSize(fullW, 8);
        this.progressBar.setPosition(0, 0, 0);

        this.endDayLbl.string = survived ? '第 38 天 +(活过来了)' : '止步第 ' + (this.idx * 5) + ' 天';
        this.endCorrectLbl.string = this.correct + ' / ' + LEVELS.length;
        this.endResLbl.string = String(this.res);

        let emoji: string, title: string, sub: string, rank: string;
        if (!survived) {
            emoji = '💀'; title = '你又死了一次'; sub = '前世的记忆,你没能用好。';
            rank = '你太相信别人了。重生的意义,是看清而不是原谅。再来一次。';
        } else if (this.correct === LEVELS.length) {
            emoji = '👑'; title = '完美重生'; sub = '你识破了每一个陷阱。';
            rank = '八次抉择,八次正确。这一世,你才是规则本身。那些害过你的人,跪在你门外。';
        } else if (this.correct >= 6) {
            emoji = '🛡️'; title = '活下来了'; sub = '代价不小,但你撑过了末世。';
            rank = '你犯了几次错,但记忆终究救了你。下一次,你会活得更体面。';
        } else {
            emoji = '🩹'; title = '险险存活'; sub = '你只是运气好。';
            rank = '错了太多次。重生给了你答案,你却没全抄对。再读一遍前世的记忆。';
        }
        this.endEmojiLbl.string = emoji;
        this.endTitleLbl.string = title;
        this.endSubLbl.string = sub;
        this.endRankLbl.string = rank;

        this.showScreen('end');
    }

    private stopTimers(): void {
        if (this.revealCb) { this.unschedule(this.revealCb); this.revealCb = null; }
    }

    private exit(): void {
        this.stopTimers();
        if (this.closeCb) this.closeCb();
    }
}
