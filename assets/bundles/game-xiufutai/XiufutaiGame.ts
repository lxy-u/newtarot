import { _decorator, Component, Node, UITransform, Label, Button, UIOpacity, Vec3, tween } from 'cc';
import { NodeHelper } from '../../scripts/utils/NodeHelper';
import { Anim } from '../../scripts/utils/Anim';

const { ccclass } = _decorator;

type ElemKey = 'yue' | 'shui' | 'huo' | 'xiang' | 'ji';

interface ElemDef {
    key: ElemKey;
    icon: string;
    name: string;
    color: string;
}

const ELEMENTS: ElemDef[] = [
    { key: 'yue',   icon: '☾', name: '月', color: '#d4c8e8' },
    { key: 'shui',  icon: '💧', name: '水', color: '#7ac5d4' },
    { key: 'huo',   icon: '🔥', name: '火', color: '#ff8a5b' },
    { key: 'xiang', icon: '🕯', name: '香', color: '#b89cc8' },
    { key: 'ji',    icon: '⚙', name: '机', color: '#8acaa0' },
];

const STARTING_STOCK: Record<ElemKey, number> = { yue: 3, shui: 2, huo: 1, xiang: 3, ji: 1 };
const TARGET: Record<ElemKey, number> = { yue: 2, shui: 0, huo: 0, xiang: 1, ji: 0 };

interface CrackDef {
    label: string;
    color: string;
    hint: string;
}

const CRACKS: CrackDef[] = [
    { label: '裂纹 壹', color: '#d4c8e8', hint: '银(月)' },
    { label: '裂纹 贰', color: '#d4c8e8', hint: '银(月)' },
    { label: '裂纹 叁', color: '#b89cc8', hint: '紫(香)' },
];

interface ElemSlot {
    node: Node;
    cntLbl: Label;
    badgeLbl: Label;
    bg: Node;
}

interface CrackSlot {
    node: Node;
    hintLbl: Label;
    statusLbl: Label;
    done: boolean;
}

@ccclass('XiufutaiGame')
export class XiufutaiGame extends Component {

    private closeCb: (() => void) | null = null;

    private introScreen: Node = null;
    private benchScreen: Node = null;
    private resultScreen: Node = null;

    private stageLbl: Label = null;
    private crackCountLbl: Label = null;
    private objHintLbl: Label = null;
    private recipeChipsLbl: Label = null;
    private peekBtn: Node = null;
    private peekBtnLbl: Label = null;
    private drawBtn: Node = null;
    private drawBtnLbl: Label = null;

    private gradeLbl: Label = null;
    private gradeSubLbl: Label = null;
    private storyLbl: Label = null;
    private rewardLbl: Label = null;

    private toastNode: Node = null;
    private toastLbl: Label = null;
    private toastOp: UIOpacity = null;
    private toastHideCb: (() => void) | null = null;

    private elemSlots: ElemSlot[] = [];
    private crackSlots: CrackSlot[] = [];

    private stock: Record<ElemKey, number> = { yue: 0, shui: 0, huo: 0, xiang: 0, ji: 0 };
    private recipe: Record<ElemKey, number> = { yue: 0, shui: 0, huo: 0, xiang: 0, ji: 0 };
    private peeked = false;
    private drawing = false;
    private drawnCount = 0;

    setCloseCallback(cb: () => void): void {
        this.closeCb = cb;
    }

    start(): void {
        this.node.addComponent(UITransform).setContentSize(700, 1200);
        this.buildIntroScreen();
        this.buildBenchScreen();
        this.buildResultScreen();
        this.buildToast();
        this.showScreen('intro');
    }

    onDestroy(): void {
        this.stopTimers();
    }

    private showScreen(name: 'intro' | 'bench' | 'result'): void {
        if (this.introScreen) this.introScreen.active = name === 'intro';
        if (this.benchScreen) this.benchScreen.active = name === 'bench';
        if (this.resultScreen) this.resultScreen.active = name === 'result';
    }

    // ============ 开场屏 ============

    private buildIntroScreen(): void {
        const s = new Node('IntroScreen');
        this.node.addChild(s);
        s.addComponent(UITransform).setContentSize(700, 1200);

        NodeHelper.makeLabel('CAN · GUANG · SHE', s, 14, '#a8803d', 0, 480);
        NodeHelper.makeLabel('修　复　台', s, 56, '#e8d4a8', 0, 400);
        NodeHelper.makeLabel('— 侦探社二楼 · 老木桌 —', s, 16, '#8a8090', 0, 330);

        const story = NodeHelper.makeNode('Story', s, 580, 380, '#16100e', 0, 50);
        const lines = [
            '邹大爷来了。他老婆又看见 1985 年',
            '的那个残影了。',
            '',
            '那年她前夫早上刷牙时消逝。',
            '从那以后,每到雨天,镜子里就会',
            '浮出他的脸——但越来越模糊。',
            '',
            '"小苏,你能让他好好走吗?"',
        ];
        lines.forEach((line, i) => {
            NodeHelper.makeLabel(line, story, 18, '#c5bfa8', 0, 150 - i * 36);
        });

        NodeHelper.makeLabel('三道裂纹 · 中等破损 · 倾向:银 / 紫', s, 13, '#6a6478', 0, -200);

        const enterBtn = NodeHelper.makeNode('EnterBtn', s, 360, 80, '#a8803d', 0, -290);
        enterBtn.addComponent(Button);
        NodeHelper.makeLabel('进 入 工 作 间', enterBtn, 22, '#1a1108');
        enterBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(enterBtn);
            this.startBench();
        });

        const homeBtn = NodeHelper.makeNode('HomeBtn', s, 200, 56, '#2A2545', 0, -400);
        homeBtn.addComponent(Button);
        NodeHelper.makeLabel('返回大厅', homeBtn, 18, '#b5b5c2');
        homeBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(homeBtn);
            this.exit();
        });

        this.introScreen = s;
    }

    // ============ 修复台屏 ============

    private buildBenchScreen(): void {
        const p = new Node('BenchScreen');
        this.node.addChild(p);
        p.addComponent(UITransform).setContentSize(700, 1200);
        p.active = false;

        NodeHelper.makeLabel('▍残影 · 中年男 · 1985', p, 16, '#c5bfa8', -180, 555);
        this.stageLbl = this.makeValLabel(p, '壹 · 观察裂纹', 14, '#d4a557', 200, 555);

        const stageBg = NodeHelper.makeNode('ObjectStage', p, 640, 460, '#100818', 0, 280);
        NodeHelper.makeLabel('破损度 ★★★☆☆', stageBg, 13, '#a5a094', -240, 200);
        const crackHeader = NodeHelper.makeLabel('裂纹 ', stageBg, 13, '#6a6478', 220, 200);
        this.crackCountLbl = this.makeValLabel(stageBg, '3', 14, '#d4a557', 270, 200);
        void crackHeader;

        NodeHelper.makeLabel('▍ 残 影 · 镜 中 之 人', stageBg, 18, '#5a4a6a', 0, 150);
        NodeHelper.makeLabel('( 三 道 裂 纹 等 待 修 复 )', stageBg, 14, '#3a304a', 0, 115);

        const cw = 180, ch = 80, gap = 16;
        const totalW = cw * 3 + gap * 2;
        const startX = -totalW / 2 + cw / 2;
        for (let i = 0; i < 3; i++) {
            this.buildCrack(stageBg, i, startX + i * (cw + gap), 30, cw, ch);
        }

        const objHintBg = NodeHelper.makeNode('ObjHintBg', stageBg, 540, 36, '#1a1430', 0, -180);
        this.objHintLbl = this.makeValLabel(objHintBg, '点 · 读 · 取 · 裂 · 纹 · 进 入 修 复', 14, '#7a7088', 0, 0);

        const elemY = -10;
        const ew = 110, eh = 110, egap = 12;
        const elemTotalW = ew * 5 + egap * 4;
        const elemStartX = -elemTotalW / 2 + ew / 2;
        for (let i = 0; i < 5; i++) {
            this.buildElement(p, i, elemStartX + i * (ew + egap), elemY, ew, eh);
        }

        const recipeBg = NodeHelper.makeNode('RecipeBar', p, 640, 70, '#140f16', 0, -130);
        NodeHelper.makeLabel('▍配方', recipeBg, 13, '#a8803d', -280, 0);
        this.recipeChipsLbl = this.makeValLabel(recipeBg, '点击元素调配…', 16, '#4a4456', 30, 0);

        const clearBtn = NodeHelper.makeNode('ClearBtn', recipeBg, 90, 40, '#2A2545', 270, 0);
        clearBtn.addComponent(Button);
        NodeHelper.makeLabel('清空', clearBtn, 14, '#a5a5b4');
        clearBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(clearBtn);
            if (this.drawing) return;
            (Object.keys(this.recipe) as ElemKey[]).forEach(k => {
                this.stock[k] += this.recipe[k];
                this.recipe[k] = 0;
            });
            this.renderBench();
        });

        this.peekBtn = NodeHelper.makeNode('PeekBtn', p, 300, 80, '#2A2545', -165, -240);
        this.peekBtn.addComponent(Button);
        this.peekBtnLbl = this.makeValLabel(this.peekBtn, '读 取 裂 纹', 18, '#a5a5b4', 0, 0);
        this.peekBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(this.peekBtn);
            this.doPeek();
        });

        this.drawBtn = NodeHelper.makeNode('DrawBtn', p, 300, 80, '#7a5a28', 165, -240);
        this.drawBtn.addComponent(Button);
        this.drawBtnLbl = this.makeValLabel(this.drawBtn, '开 始 画 线', 18, '#1a1108', 0, 0);
        this.drawBtn.on(Node.EventType.TOUCH_END, () => {
            if (!this.peeked) { this.toast('先读取裂纹'); return; }
            const total = (Object.keys(this.recipe) as ElemKey[]).reduce((a, k) => a + this.recipe[k], 0);
            if (total <= 0) { this.toast('先调配元素'); return; }
            if (this.drawing) return;
            Anim.scaleClick(this.drawBtn);
            this.startDraw();
        });

        const back = NodeHelper.makeNode('BenchBack', p, 110, 50, '#2A2545', -285, 575);
        back.addComponent(Button);
        NodeHelper.makeLabel('‹ 大厅', back, 16, '#b5b5c2');
        back.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(back);
            this.exit();
        });

        this.benchScreen = p;
    }

    private buildCrack(parent: Node, idx: number, x: number, y: number, w: number, h: number): void {
        const node = NodeHelper.makeNode(`Crack_${idx}`, parent, w, h, '#1f1a2a', x, y);
        node.addComponent(Button);
        NodeHelper.makeLabel(CRACKS[idx].label, node, 14, '#6a5a7a', 0, 16);
        const statusLbl = this.makeValLabel(node, '???', 13, '#5a4a6a', 0, -14);
        const hintLbl = this.makeValLabel(node, '', 11, '#6a5a7a', 0, -30);
        const slot: CrackSlot = { node, statusLbl, hintLbl, done: false };
        node.on(Node.EventType.TOUCH_END, () => this.tapCrack(idx));
        this.crackSlots.push(slot);
    }

    private buildElement(parent: Node, idx: number, x: number, y: number, w: number, h: number): void {
        const e = ELEMENTS[idx];
        const node = NodeHelper.makeNode(`Elem_${e.key}`, parent, w, h, '#1f1a2a', x, y);
        node.addComponent(Button);
        NodeHelper.makeLabel(e.icon, node, 36, e.color, 0, 16);
        NodeHelper.makeLabel(e.name, node, 14, '#8a8090', 0, -22);

        const cntBg = NodeHelper.makeNode('Cnt', node, 36, 22, '#d4a557', 36, 40);
        const cntLbl = this.makeValLabel(cntBg, 'x0', 13, '#1a1108', 0, 0);

        const badgeBg = NodeHelper.makeNode('Badge', node, 36, 22, '#a8803d', 0, -52);
        const badgeLbl = this.makeValLabel(badgeBg, '0', 13, '#FFFFFF', 0, 0);
        badgeBg.active = false;

        node.on(Node.EventType.TOUCH_END, () => {
            if (this.drawing) { this.toast('画线中,无法调整'); return; }
            if (this.stock[e.key] <= 0) { this.toast(e.name + ' 不够了'); return; }
            this.stock[e.key]--;
            this.recipe[e.key]++;
            Anim.scaleClick(node);
            this.renderBench();
        });

        this.elemSlots.push({ node, cntLbl, badgeLbl, bg: badgeBg });
    }

    // ============ 结算屏 ============

    private buildResultScreen(): void {
        const r = new Node('ResultScreen');
        this.node.addChild(r);
        r.addComponent(UITransform).setContentSize(700, 1200);
        r.active = false;

        this.gradeLbl = this.bigLabel(r, '— —', 56, '#F0E4CC', 0, 420);
        this.gradeSubLbl = this.bigLabel(r, '', 16, '#8a8090', 0, 340);

        const box = NodeHelper.makeNode('ResultBox', r, 580, 380, '#1e1612', 0, 60);
        NodeHelper.makeLabel('▍ 修 复 回 报', box, 13, '#a8803d', 0, 160);

        const rewardNode = new Node('Reward');
        box.addChild(rewardNode);
        rewardNode.setPosition(0, 80, 0);
        rewardNode.addComponent(UITransform).setContentSize(540, 60);
        const rl = rewardNode.addComponent(Label);
        rl.fontSize = 18;
        rl.color = NodeHelper.hex('#e8d4a8');
        rl.overflow = Label.Overflow.RESIZE_HEIGHT;
        rl.enableWrapText = true;
        rl.string = '';
        this.rewardLbl = rl;

        const storyNode = new Node('Story');
        box.addChild(storyNode);
        storyNode.setPosition(0, -60, 0);
        storyNode.addComponent(UITransform).setContentSize(540, 180);
        const sl = storyNode.addComponent(Label);
        sl.fontSize = 16;
        sl.color = NodeHelper.hex('#c5bfa8');
        sl.overflow = Label.Overflow.RESIZE_HEIGHT;
        sl.enableWrapText = true;
        sl.string = '';
        this.storyLbl = sl;

        const retry = NodeHelper.makeNode('RetryBtn', r, 280, 70, '#2A2545', -160, -300);
        retry.addComponent(Button);
        NodeHelper.makeLabel('再 修 一 次', retry, 18, '#a5a5b4');
        retry.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(retry);
            this.startBench();
        });

        const home = NodeHelper.makeNode('HomeBtn', r, 280, 70, '#a8803d', 160, -300);
        home.addComponent(Button);
        NodeHelper.makeLabel('返 回 大 厅', home, 18, '#1a1108');
        home.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(home);
            this.exit();
        });

        this.resultScreen = r;
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

    private makeValLabel(parent: Node, text: string, size: number, hex: string, x: number, y: number): Label {
        const n = new Node('Val');
        parent.addChild(n);
        n.setPosition(x, y, 0);
        n.addComponent(UITransform).setContentSize(540, size + 16);
        const lb = n.addComponent(Label);
        lb.fontSize = size;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        return lb;
    }

    // ============ Toast ============

    private buildToast(): void {
        const t = NodeHelper.makeNode('Toast', this.node, 460, 56, '#16101a', 0, -100);
        const op = t.addComponent(UIOpacity);
        op.opacity = 0;
        const lb = this.makeValLabel(t, '', 16, '#e8d4a8', 0, 0);
        this.toastNode = t;
        this.toastOp = op;
        this.toastLbl = lb;
    }

    private toast(msg: string): void {
        if (!this.toastOp) return;
        if (this.toastHideCb) { this.unschedule(this.toastHideCb); this.toastHideCb = null; }
        this.toastLbl.string = msg;
        this.toastOp.opacity = 0;
        tween(this.toastOp).to(0.2, { opacity: 230 }).start();
        this.toastHideCb = () => {
            if (this.toastOp) tween(this.toastOp).to(0.3, { opacity: 0 }).start();
            this.toastHideCb = null;
        };
        this.scheduleOnce(this.toastHideCb, 1.4);
    }

    // ============ 游戏流程 ============

    private startBench(): void {
        this.stock = { ...STARTING_STOCK };
        this.recipe = { yue: 0, shui: 0, huo: 0, xiang: 0, ji: 0 };
        this.peeked = false;
        this.drawing = false;
        this.drawnCount = 0;

        this.crackSlots.forEach((c, i) => {
            c.done = false;
            c.statusLbl.string = '???';
            c.statusLbl.color = NodeHelper.hex('#5a4a6a');
            c.hintLbl.string = '';
            c.hintLbl.color = NodeHelper.hex('#6a5a7a');
            void i;
        });
        this.peekBtnLbl.string = '读 取 裂 纹';
        this.drawBtnLbl.string = '开 始 画 线';
        this.objHintLbl.string = '点 · 读 · 取 · 裂 · 纹 · 进 入 修 复';

        this.crackCountLbl.string = '3';
        this.renderBench();
        this.showScreen('bench');
    }

    private renderBench(): void {
        this.elemSlots.forEach((s, i) => {
            const e = ELEMENTS[i];
            s.cntLbl.string = 'x' + this.stock[e.key];
            const used = this.recipe[e.key];
            s.bg.active = used > 0;
            s.badgeLbl.string = String(used);
            if (used > 0) {
                s.node.setScale(1.05, 1.05, 1);
            } else {
                s.node.setScale(1, 1, 1);
            }
        });

        const used = ELEMENTS.filter(e => this.recipe[e.key] > 0);
        if (used.length === 0) {
            this.recipeChipsLbl.string = '点击元素调配…';
            this.recipeChipsLbl.color = NodeHelper.hex('#4a4456');
        } else {
            this.recipeChipsLbl.string = used.map(e => e.name + 'x' + this.recipe[e.key]).join('  ');
            this.recipeChipsLbl.color = NodeHelper.hex('#e8d4a8');
        }

        this.updateStage();
    }

    private updateStage(): void {
        const total = (Object.keys(this.recipe) as ElemKey[]).reduce((a, k) => a + this.recipe[k], 0);
        let s = '壹 · 观察裂纹';
        if (this.peeked) s = '贰 · 调配元素';
        if (this.peeked && total > 0) s = '叁 · 准备画线';
        if (this.drawing) s = '肆 · 点击裂纹 (' + this.drawnCount + '/3)';
        this.stageLbl.string = s;
    }

    private doPeek(): void {
        if (this.peeked) { this.toast('已读取'); return; }
        this.peeked = true;
        this.crackSlots.forEach((c, i) => {
            const def = CRACKS[i];
            c.statusLbl.string = def.hint;
            c.statusLbl.color = NodeHelper.hex(def.color);
            c.hintLbl.string = '需对应元素';
            c.hintLbl.color = NodeHelper.hex(def.color);
            tween(c.node).to(0.2, { scale: new Vec3(1.08, 1.08, 1) })
                .to(0.2, { scale: new Vec3(1, 1, 1) }).start();
        });
        this.objHintLbl.string = '银 · 银 · 紫    猜 猜 配 方';
        this.peekBtnLbl.string = '已 读 取';
        this.toast('裂纹颜色已显现');
        this.updateStage();
    }

    private startDraw(): void {
        this.drawing = true;
        this.drawnCount = 0;
        this.objHintLbl.string = '点 击 每 一 道 裂 纹 以 修 复';
        this.updateStage();
    }

    private tapCrack(idx: number): void {
        if (!this.drawing) {
            if (!this.peeked) this.toast('先读取裂纹');
            else this.toast('调配元素后点开始画线');
            return;
        }
        const slot = this.crackSlots[idx];
        if (slot.done) { this.toast('已修复'); return; }
        slot.done = true;
        slot.statusLbl.string = '✓ 已修复';
        slot.statusLbl.color = NodeHelper.hex('#fff5d6');
        slot.hintLbl.string = '';
        Anim.scaleClick(slot.node);
        tween(slot.node).to(0.15, { scale: new Vec3(1.12, 1.12, 1) })
            .to(0.15, { scale: new Vec3(1, 1, 1) }).start();
        this.drawnCount++;
        this.crackCountLbl.string = String(3 - this.drawnCount);
        this.toast('一道裂纹消失了');
        this.updateStage();
        if (this.drawnCount >= 3) {
            this.scheduleOnce(() => this.judge(), 0.7);
        }
    }

    private judge(): void {
        let diff = 0;
        (Object.keys(TARGET) as ElemKey[]).forEach(k => diff += Math.abs(this.recipe[k] - TARGET[k]));
        let grade: string, sub: string, story: string, reward: string, color: string;
        if (diff === 0) {
            grade = '完　美'; color = '#ffd97a';
            sub = '配方精准 · 残影含笑而去';
            story = '镜中的男人对着邹大爷的老婆鞠了一躬,转身淡入雨里。她哭了,说她终于把那句"再见"说出口了。';
            reward = '☾ 月碎片 +1    🕯 香碎片 +2    🎁 完美宝箱';
        } else if (diff <= 2) {
            grade = '及　格'; color = '#a8c5d4';
            sub = '比例略偏 · 修复成功但留了小痕迹';
            story = '残影散了,但镜面留下了一道浅浅的裂痕。邹大爷老婆说,没关系,她记得他来过就好。';
            reward = '☾ 月碎片 +1    🎁 普通宝箱';
        } else {
            grade = '失　败'; color = '#d4577a';
            sub = '元素错乱 · 黑色腐蚀蔓延';
            story = '残影暴怒,化作怨灵冲出镜面。邹大爷的老婆受了惊吓——今晚他会带着别的什么来找你。';
            reward = '⚠ 怨灵 · 今晚来访';
        }
        this.gradeLbl.string = grade;
        this.gradeLbl.color = NodeHelper.hex(color);
        this.gradeSubLbl.string = sub;
        this.storyLbl.string = story;
        this.rewardLbl.string = reward;
        this.showScreen('result');
    }

    private stopTimers(): void {
        if (this.toastHideCb) { this.unschedule(this.toastHideCb); this.toastHideCb = null; }
        this.unscheduleAllCallbacks();
    }

    private exit(): void {
        this.stopTimers();
        if (this.closeCb) this.closeCb();
    }
}
