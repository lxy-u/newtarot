import { _decorator, Component, Node, UITransform, Label, Button, UIOpacity, Vec3, tween } from 'cc';
import { NodeHelper } from '../../scripts/utils/NodeHelper';
import { Anim } from '../../scripts/utils/Anim';

const { ccclass } = _decorator;

const SLOTS = ['大门', '窗户', '通风口', '地下室', '后门', '天窗'];
const DURATION = 60;

type ActorType = 'zombie' | 'brute' | 'civ';

interface Hole {
    el: Node;
    actor: Node;
    actorLbl: Label;
    bruteTag: Node | null;
    busy: boolean;
    type: ActorType | null;
    hits: number;
    expireCb: (() => void) | null;
}

@ccclass('ShoumenGame')
export class ShoumenGame extends Component {

    private closeCb: (() => void) | null = null;

    private startScreen: Node = null;
    private playScreen: Node = null;
    private endScreen: Node = null;

    private scoreLbl: Label = null;
    private timeLbl: Label = null;
    private hpLbl: Label = null;
    private comboLbl: Label = null;

    private endEmojiLbl: Label = null;
    private endTitleLbl: Label = null;
    private endRankLbl: Label = null;
    private endScoreLbl: Label = null;
    private endKillsLbl: Label = null;
    private endComboLbl: Label = null;
    private endMistakesLbl: Label = null;
    private endCommentLbl: Label = null;

    private hurtOverlay: UIOpacity = null;

    private holes: Hole[] = [];
    private score = 0;
    private timeLeft = 0;
    private hp = 0;
    private kills = 0;
    private combo = 0;
    private maxCombo = 0;
    private mistakes = 0;
    private running = false;
    private tickCb: (() => void) | null = null;
    private spawnCb: (() => void) | null = null;

    setCloseCallback(cb: () => void): void {
        this.closeCb = cb;
    }

    start(): void {
        this.node.addComponent(UITransform).setContentSize(700, 1200);
        this.buildStartScreen();
        this.buildPlayScreen();
        this.buildEndScreen();
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

    // ============ 开始屏 ============

    private buildStartScreen(): void {
        const s = new Node('StartScreen');
        this.node.addChild(s);
        s.addComponent(UITransform).setContentSize(700, 1200);

        NodeHelper.makeLabel('末世 · 安全屋', s, 18, '#ff5b5b', 0, 460);
        NodeHelper.makeLabel('守门人', s, 64, '#F0E4CC', 0, 380);
        NodeHelper.makeLabel('丧尸从门窗冒头', s, 20, '#8a8a9a', 0, 290);
        NodeHelper.makeLabel('守住你的安全屋 60 秒', s, 20, '#8a8a9a', 0, 260);

        const legend = NodeHelper.makeNode('Legend', s, 580, 320, '#16161f', 0, 60);
        this.makeLegendRow(legend, '🧟', '普通丧尸 — 点它,+10', 110);
        this.makeLegendRow(legend, '👹', '强壮丧尸 — 连点 2 下,+25', 35);
        this.makeLegendRow(legend, '🧑', '邻居 — 别点!误伤 -20', -40);
        this.makeLegendRow(legend, '💀', '丧尸没打掉 → 破门 -1', -115);

        const startBtn = NodeHelper.makeNode('StartBtn', s, 460, 90, '#ff5b5b', 0, -180);
        startBtn.addComponent(Button);
        NodeHelper.makeLabel('拉响警报', startBtn, 26, '#FFFFFF');
        startBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(startBtn);
            this.beginGame();
        });

        const homeBtn = NodeHelper.makeNode('HomeBtn', s, 200, 56, '#2A2545', 0, -300);
        homeBtn.addComponent(Button);
        NodeHelper.makeLabel('返回大厅', homeBtn, 18, '#b5b5c2');
        homeBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(homeBtn);
            this.exit();
        });

        this.startScreen = s;
    }

    private makeLegendRow(parent: Node, ico: string, text: string, y: number): void {
        NodeHelper.makeLabel(ico, parent, 32, '#FFFFFF', -240, y);
        NodeHelper.makeLabel(text, parent, 20, '#c5c5d2', 70, y);
    }

    // ============ 游戏屏 ============

    private buildPlayScreen(): void {
        const p = new Node('PlayScreen');
        this.node.addChild(p);
        p.addComponent(UITransform).setContentSize(700, 1200);
        p.active = false;

        const hudY = 510;
        const scoreBox = NodeHelper.makeNode('HUD_Score', p, 200, 80, '#16161f', -220, hudY);
        NodeHelper.makeLabel('得分', scoreBox, 14, '#8a8a9a', 0, 18);
        this.scoreLbl = this.makeValLabel(scoreBox, '0', 28, '#ffc24b', 0, -16);

        const timeBox = NodeHelper.makeNode('HUD_Time', p, 200, 80, '#16161f', 0, hudY);
        NodeHelper.makeLabel('剩余', timeBox, 14, '#8a8a9a', 0, 18);
        this.timeLbl = this.makeValLabel(timeBox, String(DURATION), 28, '#5bc8ff', 0, -16);

        const hpBox = NodeHelper.makeNode('HUD_HP', p, 200, 80, '#16161f', 220, hudY);
        NodeHelper.makeLabel('生命', hpBox, 14, '#8a8a9a', 0, 18);
        this.hpLbl = this.makeValLabel(hpBox, '❤❤❤❤❤', 24, '#ff5b5b', 0, -16);

        const comboNode = new Node('Combo');
        p.addChild(comboNode);
        comboNode.setPosition(0, 430, 0);
        comboNode.addComponent(UITransform).setContentSize(500, 36);
        const cl = comboNode.addComponent(Label);
        cl.fontSize = 22;
        cl.color = NodeHelper.hex('#ff8a3b');
        cl.string = '';
        this.comboLbl = cl;

        const cols = 2, rows = 3;
        const cellW = 280, cellH = 220, gap = 20;
        const totalW = cellW * cols + gap * (cols - 1);
        const totalH = cellH * rows + gap * (rows - 1);
        const startX = -totalW / 2 + cellW / 2;
        const startY = totalH / 2 - cellH / 2 + 30;
        for (let i = 0; i < 6; i++) {
            const c = i % cols, r = Math.floor(i / cols);
            this.buildHole(p, i, startX + c * (cellW + gap), startY - r * (cellH + gap), cellW, cellH);
        }

        const back = NodeHelper.makeNode('PlayBack', p, 110, 50, '#2A2545', -285, 575);
        back.addComponent(Button);
        NodeHelper.makeLabel('‹ 大厅', back, 16, '#b5b5c2');
        back.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(back);
            this.stopTimers();
            this.exit();
        });

        this.playScreen = p;
    }

    private makeValLabel(parent: Node, text: string, size: number, hex: string, x: number, y: number): Label {
        const n = new Node('Val');
        parent.addChild(n);
        n.setPosition(x, y, 0);
        n.addComponent(UITransform).setContentSize(200, 40);
        const lb = n.addComponent(Label);
        lb.fontSize = size;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        return lb;
    }

    private buildHole(parent: Node, idx: number, x: number, y: number, w: number, h: number): void {
        const el = NodeHelper.makeNode(`Hole_${idx}`, parent, w, h, '#1a1a26', x, y);
        el.addComponent(Button);
        NodeHelper.makeLabel(SLOTS[idx], el, 12, '#3c3c52', 0, h / 2 - 18);

        const actor = new Node('Actor');
        el.addChild(actor);
        actor.setPosition(0, -10, 0);
        actor.addComponent(UITransform).setContentSize(140, 140);
        const lb = actor.addComponent(Label);
        lb.fontSize = 80;
        lb.color = NodeHelper.hex('#FFFFFF');
        lb.string = '';
        actor.active = false;

        const hole: Hole = {
            el, actor, actorLbl: lb, bruteTag: null,
            busy: false, type: null, hits: 0, expireCb: null,
        };
        el.on(Node.EventType.TOUCH_END, () => this.tap(hole));
        this.holes.push(hole);
    }

    // ============ 结束屏 ============

    private buildEndScreen(): void {
        const e = new Node('EndScreen');
        this.node.addChild(e);
        e.addComponent(UITransform).setContentSize(700, 1200);
        e.active = false;

        this.endEmojiLbl = this.bigLabel(e, '🛡️', 72, '#FFFFFF', 0, 420);
        this.endTitleLbl = this.bigLabel(e, '', 36, '#F0E4CC', 0, 320);
        this.endRankLbl = this.bigLabel(e, '', 16, '#8a8a9a', 0, 270);

        const panel = NodeHelper.makeNode('EndPanel', e, 560, 280, '#16161f', 0, 80);
        this.endScoreLbl = this.makeKVRow(panel, '最终得分', 90);
        this.endKillsLbl = this.makeKVRow(panel, '击杀丧尸', 30);
        this.endComboLbl = this.makeKVRow(panel, '最高连击', -30);
        this.endMistakesLbl = this.makeKVRow(panel, '误伤平民', -90);

        const commentNode = new Node('Comment');
        e.addChild(commentNode);
        commentNode.setPosition(0, -130, 0);
        commentNode.addComponent(UITransform).setContentSize(560, 100);
        const cl = commentNode.addComponent(Label);
        cl.fontSize = 18;
        cl.color = NodeHelper.hex('#cfcfda');
        cl.overflow = Label.Overflow.RESIZE_HEIGHT;
        cl.enableWrapText = true;
        cl.string = '';
        this.endCommentLbl = cl;

        const again = NodeHelper.makeNode('EndAgain', e, 460, 80, '#ff5b5b', 0, -260);
        again.addComponent(Button);
        NodeHelper.makeLabel('再守一次', again, 22, '#FFFFFF');
        again.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(again);
            this.beginGame();
        });

        const home = NodeHelper.makeNode('EndHome', e, 460, 70, '#2A2545', 0, -355);
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
        n.addComponent(UITransform).setContentSize(600, size + 20);
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
        valN.addComponent(UITransform).setContentSize(200, 32);
        const lb = valN.addComponent(Label);
        lb.fontSize = 22;
        lb.color = NodeHelper.hex('#ffc24b');
        lb.string = '0';
        return lb;
    }

    // ============ 受伤红屏 ============

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

    // ============ 游戏流程 ============

    private beginGame(): void {
        this.stopTimers();
        this.score = 0; this.timeLeft = DURATION; this.hp = 5;
        this.kills = 0; this.combo = 0; this.maxCombo = 0; this.mistakes = 0;
        this.running = true;
        this.holes.forEach(h => this.clearHole(h, false));
        this.updateHud();
        this.comboLbl.string = '';
        this.showScreen('play');

        this.tickCb = () => this.tick();
        this.schedule(this.tickCb, 1.0);
        this.scheduleSpawn();
    }

    private tick(): void {
        this.timeLeft--;
        this.updateHud();
        if (this.timeLeft <= 0) this.over(true);
    }

    private difficulty(): { gap: number; life: number; brute: number; civ: number } {
        const p = (DURATION - this.timeLeft) / DURATION;
        return { gap: 850 - p * 520, life: 1500 - p * 620, brute: 0.15 + p * 0.20, civ: 0.22 };
    }

    private scheduleSpawn(): void {
        if (!this.running) return;
        const d = this.difficulty();
        this.spawnCb = () => { this.spawn(); this.scheduleSpawn(); };
        this.scheduleOnce(this.spawnCb, d.gap / 1000);
    }

    private spawn(): void {
        if (!this.running) return;
        const free = this.holes.filter(h => !h.busy);
        if (!free.length) return;
        const hole = free[Math.floor(Math.random() * free.length)];
        const d = this.difficulty();
        const r = Math.random();
        let type: ActorType;
        if (r < d.civ) type = 'civ';
        else if (r < d.civ + d.brute) type = 'brute';
        else type = 'zombie';

        hole.busy = true; hole.type = type; hole.hits = 0;
        const emoji = type === 'zombie' ? '🧟' : type === 'brute' ? '👹' : '🧑';
        hole.actorLbl.string = emoji;
        hole.actor.active = true;
        hole.actor.setScale(0.6, 0.6, 1);
        tween(hole.actor)
            .to(0.14, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();

        if (type === 'brute') {
            const tag = new Node('BruteTag');
            hole.el.addChild(tag);
            tag.setPosition(0, -hole.el.getComponent(UITransform).contentSize.height / 2 + 14, 0);
            tag.addComponent(UITransform).setContentSize(180, 20);
            const tl = tag.addComponent(Label);
            tl.fontSize = 13;
            tl.color = NodeHelper.hex('#3ddc84');
            tl.string = '再点1下';
            hole.bruteTag = tag;
        }

        const life = type === 'brute' ? d.life * 1.4 : d.life;
        hole.expireCb = () => this.expire(hole);
        this.scheduleOnce(hole.expireCb, life / 1000);
    }

    private expire(hole: Hole): void {
        if (!hole.busy) return;
        const t = hole.type;
        this.clearHole(hole, false);
        if (t === 'zombie' || t === 'brute') {
            this.hp -= (t === 'brute' ? 2 : 1);
            this.combo = 0;
            this.showCombo();
            this.hurtFlash();
            this.flash(hole, false);
            this.updateHud();
            if (this.hp <= 0) this.over(false);
        }
    }

    private tap(hole: Hole): void {
        if (!this.running || !hole.busy) return;
        const t = hole.type;
        if (t === 'civ') {
            this.mistakes++;
            this.score = Math.max(0, this.score - 20);
            this.combo = 0;
            this.float(hole, '误伤 -20', '#ff5b5b');
            this.flash(hole, false);
            this.showCombo();
            this.clearHole(hole, false);
            this.updateHud();
            return;
        }
        if (t === 'brute' && hole.hits < 1) {
            hole.hits++;
            hole.actorLbl.string = '😡';
            if (hole.bruteTag) {
                const tl = hole.bruteTag.getComponent(Label);
                if (tl) tl.string = '就差一下!';
            }
            return;
        }
        this.kills++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const base = t === 'brute' ? 25 : 10;
        const gain = base + Math.floor(this.combo / 3) * 5;
        this.score += gain;
        this.float(hole, '+' + gain, '#3ddc84');
        this.flash(hole, true);
        this.showCombo();
        this.clearHole(hole, false);
        this.updateHud();
    }

    private clearHole(hole: Hole, _keepActor: boolean): void {
        if (hole.expireCb) {
            this.unschedule(hole.expireCb);
            hole.expireCb = null;
        }
        hole.busy = false; hole.type = null; hole.hits = 0;
        if (hole.bruteTag) {
            hole.bruteTag.destroy();
            hole.bruteTag = null;
        }
        hole.actor.active = false;
        hole.actorLbl.string = '';
        hole.actor.setScale(0.6, 0.6, 1);
    }

    private flash(hole: Hole, good: boolean): void {
        hole.el.setScale(1.06, 1.06, 1);
        tween(hole.el).to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
        if (!good) Anim.shake(hole.el);
    }

    private float(hole: Hole, text: string, hex: string): void {
        const n = new Node('Float');
        hole.el.addChild(n);
        n.setPosition(0, 20, 0);
        n.addComponent(UITransform).setContentSize(200, 30);
        const lb = n.addComponent(Label);
        lb.fontSize = 22;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        const op = n.addComponent(UIOpacity);
        op.opacity = 255;
        tween(n).to(0.7, { position: new Vec3(0, 70, 0) }).start();
        tween(op).to(0.7, { opacity: 0 }).call(() => n.destroy()).start();
    }

    private showCombo(): void {
        if (this.combo >= 3) {
            this.comboLbl.string = '🔥 连击 x' + this.combo;
            this.comboLbl.node.setScale(1.4, 1.4, 1);
            tween(this.comboLbl.node).to(0.15, { scale: new Vec3(1, 1, 1) }).start();
        } else {
            this.comboLbl.string = '';
        }
    }

    private updateHud(): void {
        this.scoreLbl.string = String(this.score);
        this.timeLbl.string = String(Math.max(0, this.timeLeft));
        this.hpLbl.string = this.hp > 0 ? '❤'.repeat(this.hp) : '—';
    }

    private over(survived: boolean): void {
        this.running = false;
        this.stopTimers();
        this.holes.forEach(h => this.clearHole(h, false));

        this.endScoreLbl.string = String(this.score);
        this.endKillsLbl.string = String(this.kills);
        this.endComboLbl.string = 'x' + this.maxCombo;
        this.endMistakesLbl.string = this.mistakes + ' 次';

        let emoji: string, title: string, rank: string, comment: string;
        if (!survived) {
            emoji = '💀'; title = '安全屋失守'; rank = '丧尸破门而入';
            comment = '门没守住。下次别让丧尸在窗口待太久。';
        } else if (this.score >= 900) {
            emoji = '👑'; title = '完美守门人'; rank = '传说级';
            comment = '手快、眼准、一个平民都没误伤。这座安全屋固若金汤。';
        } else if (this.score >= 550) {
            emoji = '🛡️'; title = '守住了'; rank = '合格守卫';
            comment = '撑过了 60 秒。再练练连击,分数能翻倍。';
        } else {
            emoji = '🩹'; title = '险胜'; rank = '新手守卫';
            comment = '活下来了,但太狼狈。记住:邻居冒头千万别打。';
        }
        this.endEmojiLbl.string = emoji;
        this.endTitleLbl.string = title;
        this.endRankLbl.string = rank;
        this.endCommentLbl.string = comment;

        this.showScreen('end');
    }

    private stopTimers(): void {
        if (this.tickCb) { this.unschedule(this.tickCb); this.tickCb = null; }
        if (this.spawnCb) { this.unschedule(this.spawnCb); this.spawnCb = null; }
        this.holes.forEach(h => {
            if (h.expireCb) { this.unschedule(h.expireCb); h.expireCb = null; }
        });
    }

    private exit(): void {
        this.stopTimers();
        if (this.closeCb) this.closeCb();
    }
}
