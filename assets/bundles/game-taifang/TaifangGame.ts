import { _decorator, Component, Node, UITransform, Label, Button, UIOpacity, Vec3, tween } from 'cc';
import { NodeHelper } from '../../scripts/utils/NodeHelper';
import { Anim } from '../../scripts/utils/Anim';

const { ccclass } = _decorator;

type ElemKey = 'yue' | 'shui' | 'huo' | 'xiang' | 'ji';
type EnemyType = 'zombie' | 'shadow' | 'yuanling';

interface ElemDef { ico: string; nm: string; color: string; vs: string; }
interface EnemyDef { ico: string; nm: string; hp: number; speed: number; weak: ElemKey; reward: ElemKey | null; }

interface Turret {
    id: string;
    floor: number;
    x: number;
    loaded: ElemKey | null;
    node: Node;
    badgeLbl: Label;
    cd: number;
}

interface Neighbor {
    id: string;
    name: string;
    hp: number;
    floor: number;
    box: Node;
    nameLbl: Label;
    hpBar: Node;
}

interface Enemy {
    id: string;
    type: EnemyType;
    def: EnemyDef;
    hp: number;
    maxHp: number;
    progress: number;
    floor: number;
    node: Node;
    hpBar: Node;
    dead: boolean;
}

const ELEMENTS: Record<ElemKey, ElemDef> = {
    yue:  { ico: '🌙', nm: '月', color: '#d4c8e8', vs: '残影' },
    shui: { ico: '💧', nm: '水', color: '#7ac5d4', vs: '丧尸' },
    huo:  { ico: '🔥', nm: '火', color: '#ff8a5b', vs: '吸血鬼' },
    xiang:{ ico: '🪔', nm: '香', color: '#b89cc8', vs: '怨灵' },
    ji:   { ico: '⚙', nm: '机', color: '#8acaa0', vs: 'AI' },
};
const EKEYS: ElemKey[] = ['yue', 'shui', 'huo', 'xiang', 'ji'];

const ENEMY_DEF: Record<EnemyType, EnemyDef> = {
    zombie:   { ico: '🧟', nm: '普通丧尸', hp: 30, speed: 1.0, weak: 'shui',  reward: 'shui' },
    shadow:   { ico: '👤', nm: '残影丧尸', hp: 40, speed: 0.8, weak: 'yue',   reward: 'yue' },
    yuanling: { ico: '👻', nm: '怨灵',     hp: 60, speed: 1.2, weak: 'xiang', reward: 'xiang' },
};

const FLOOR_LABELS = ['1F · 入口', '2F', '3F', '4F · 你的家', '5F'];
const PLAYER_FLOOR = 4;

const PREP_DURATION = 12;

@ccclass('TaifangGame')
export class TaifangGame extends Component {

    private closeCb: (() => void) | null = null;

    private introScreen: Node = null;
    private gameScreen: Node = null;
    private resultScreen: Node = null;

    private clockLbl: Label = null;
    private phaseLbl: Label = null;
    private tipLbl: Label = null;
    private waveLbl: Label = null;
    private hintLbl: Label = null;
    private baseHpLbl: Label = null;

    private floorNodes: Node[] = [];
    private buildingArea: Node = null;

    private elemSlots: Node[] = [];
    private elemCntLbls: Label[] = [];

    private turrets: Turret[] = [];
    private enemies: Enemy[] = [];
    private neighbors: Neighbor[] = [];

    private inventory: Record<ElemKey, number> = { yue: 2, shui: 2, huo: 1, xiang: 2, ji: 1 };
    private selectedElem: ElemKey | null = null;

    private phase: 'prep' | 'combat' | 'over' = 'prep';
    private prepLeft = PREP_DURATION;
    private baseHp = 100;
    private killCount = 0;
    private waveIdx = 0;
    private storyLog: string[] = [];
    private rewards: string[] = [];

    private prepTickCb: (() => void) | null = null;
    private combatTickCb: (() => void) | null = null;
    private waveCbs: (() => void)[] = [];

    private modalLayer: Node = null;
    private toastNode: Node = null;
    private toastLbl: Label = null;
    private toastOp: UIOpacity = null;
    private toastHideCb: (() => void) | null = null;

    private visitorNode: Node = null;
    private sosShown = false;

    private resultGradeLbl: Label = null;
    private resultSubLbl: Label = null;
    private resultBodyLbl: Label = null;

    setCloseCallback(cb: () => void): void {
        this.closeCb = cb;
    }

    start(): void {
        this.node.addComponent(UITransform).setContentSize(700, 1200);
        this.buildIntroScreen();
        this.buildGameScreen();
        this.buildResultScreen();
        this.showScreen('intro');
    }

    onDestroy(): void {
        this.stopTimers();
    }

    private showScreen(name: 'intro' | 'game' | 'result'): void {
        if (this.introScreen) this.introScreen.active = name === 'intro';
        if (this.gameScreen) this.gameScreen.active = name === 'game';
        if (this.resultScreen) this.resultScreen.active = name === 'result';
    }

    // ============ Intro ============

    private buildIntroScreen(): void {
        const s = new Node('IntroScreen');
        this.node.addChild(s);
        s.addComponent(UITransform).setContentSize(700, 1200);

        NodeHelper.makeLabel('⚠  WARNING  ⚠', s, 16, '#d4577a', 0, 480);
        NodeHelper.makeLabel('夜 来 了', s, 60, '#e8d4a8', 0, 400);
        NodeHelper.makeLabel('20:00 · 倒计时 30 分钟', s, 18, '#7ac5d4', 0, 330);
        NodeHelper.makeLabel('— ❖ —', s, 16, '#4a3a18', 0, 280);

        const info = NodeHelper.makeNode('Info', s, 580, 240, '#16161f', 0, 130);
        NodeHelper.makeLabel('白天你修复了那个残影。', info, 18, '#c5bfa8', 0, 90);
        NodeHelper.makeLabel('你手里还剩这些元素碎片——', info, 18, '#c5bfa8', 0, 55);
        NodeHelper.makeLabel('晚上把它们装进炮台,让子弹带上属性。', info, 17, '#c5bfa8', 0, 0);
        NodeHelper.makeLabel('今晚有 3 波夜访者。', info, 17, '#e8d4a8', 0, -40);
        NodeHelper.makeLabel('其中一个,不是来攻击你的。', info, 17, '#d4a557', 0, -80);

        const stockRow = NodeHelper.makeNode('StockRow', s, 580, 110, '#0a0a0f', 0, -50);
        const cellW = 100;
        EKEYS.forEach((k, i) => {
            const cx = -200 + i * cellW;
            const cell = NodeHelper.makeNode('Cell_' + k, stockRow, 84, 84, '#1f1a2a', cx, 0);
            NodeHelper.makeLabel(ELEMENTS[k].ico, cell, 30, ELEMENTS[k].color, 0, 12);
            NodeHelper.makeLabel('×' + this.inventory[k], cell, 14, '#d4a557', 0, -22);
        });

        const enterBtn = NodeHelper.makeNode('EnterBtn', s, 320, 80, '#a8401a', 0, -240);
        enterBtn.addComponent(Button);
        NodeHelper.makeLabel('开 始 备 战', enterBtn, 22, '#1a0508');
        enterBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(enterBtn);
            this.startPrep();
        });

        const homeBtn = NodeHelper.makeNode('HomeBtn', s, 200, 56, '#2A2545', 0, -340);
        homeBtn.addComponent(Button);
        NodeHelper.makeLabel('返回大厅', homeBtn, 18, '#b5b5c2');
        homeBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(homeBtn);
            this.exit();
        });

        this.introScreen = s;
    }

    // ============ Game ============

    private buildGameScreen(): void {
        const g = new Node('GameScreen');
        this.node.addChild(g);
        g.addComponent(UITransform).setContentSize(700, 1200);
        g.active = false;

        // 顶部 HUD
        const hud = NodeHelper.makeNode('HUD', g, 660, 70, '#16161f', 0, 540);
        this.clockLbl = this.makeValLabel(hud, '20:00', 22, '#7ac5d4', -240, 0);
        this.phaseLbl = this.makeValLabel(hud, '备战', 18, '#d4a557', -120, 8);
        this.tipLbl = this.makeValLabel(hud, '点炮台装元素', 14, '#a5a094', -120, -14);
        this.waveLbl = this.makeValLabel(hud, '', 16, '#ff8a5b', 180, 0);
        this.baseHpLbl = this.makeValLabel(hud, '基地 100', 14, '#ff5b5b', 270, 0);

        // 返回按钮
        const back = NodeHelper.makeNode('GameBack', g, 120, 44, '#2A2545', -290, 585);
        back.addComponent(Button);
        NodeHelper.makeLabel('◁ 大厅', back, 14, '#b5b5c2');
        back.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(back);
            this.exit();
        });

        // 楼层区域
        const buildingY = 50;
        const floorH = 130;
        const floorW = 660;
        this.buildingArea = NodeHelper.makeNode('Building', g, floorW, floorH * 5 + 12, '#0a0818', 0, buildingY);

        const floorOrder = [5, 4, 3, 2, 1];
        floorOrder.forEach((id, i) => {
            const y = (2 - i) * (floorH + 2);
            this.buildFloor(this.buildingArea, id, y, floorW - 20, floorH);
        });

        // 中下部 邻居
        this.buildNeighbor('zou', '邹大爷', 3);
        this.buildNeighbor('lin', '林洁', 2);

        // 炮台 (在 4F)
        this.buildTurret('t1', PLAYER_FLOOR, -200);
        this.buildTurret('t2', PLAYER_FLOOR, 0);
        this.buildTurret('t3', PLAYER_FLOOR, 200);

        // 底栏 元素条
        const botBar = NodeHelper.makeNode('BotBar', g, 660, 140, '#16161f', 0, -510);
        const stripY = 20;
        EKEYS.forEach((k, i) => {
            const cx = -260 + i * 130;
            const slot = NodeHelper.makeNode('Estock_' + k, botBar, 110, 90, '#1f1a2a', cx, stripY);
            slot.addComponent(Button);
            NodeHelper.makeLabel(ELEMENTS[k].ico, slot, 28, ELEMENTS[k].color, 0, 14);
            const cntN = new Node('Cnt');
            slot.addChild(cntN);
            cntN.setPosition(0, -22, 0);
            cntN.addComponent(UITransform).setContentSize(80, 24);
            const cl = cntN.addComponent(Label);
            cl.fontSize = 16;
            cl.color = NodeHelper.hex('#d4a557');
            cl.string = '×' + this.inventory[k];
            this.elemSlots.push(slot);
            this.elemCntLbls.push(cl);
            slot.on(Node.EventType.TOUCH_END, () => {
                Anim.scaleClick(slot);
                this.onSelectElem(k);
            });
        });

        const hintN = new Node('Hint');
        botBar.addChild(hintN);
        hintN.setPosition(0, -52, 0);
        hintN.addComponent(UITransform).setContentSize(600, 28);
        const hl = hintN.addComponent(Label);
        hl.fontSize = 16;
        hl.color = NodeHelper.hex('#7a7088');
        hl.string = '选元素 · 再点炮台装弹';
        this.hintLbl = hl;

        // 模态层
        this.modalLayer = NodeHelper.makeNode('ModalLayer', g, 700, 1200, '#000000', 0, 0);
        const mop = this.modalLayer.addComponent(UIOpacity);
        mop.opacity = 200;
        this.modalLayer.active = false;

        // Toast
        const toastN = NodeHelper.makeNode('Toast', g, 480, 56, '#14101a', 0, 0);
        const tl = new Node('Tl');
        toastN.addChild(tl);
        tl.addComponent(UITransform).setContentSize(460, 40);
        const tlab = tl.addComponent(Label);
        tlab.fontSize = 16;
        tlab.color = NodeHelper.hex('#e8d4a8');
        tlab.string = '';
        const top = toastN.addComponent(UIOpacity);
        top.opacity = 0;
        this.toastNode = toastN;
        this.toastLbl = tlab;
        this.toastOp = top;

        this.gameScreen = g;
        this.refreshElemStrip();
    }

    private buildFloor(parent: Node, id: number, y: number, w: number, h: number): void {
        let bg = '#16101f';
        if (id === PLAYER_FLOOR) bg = '#2a1f3a';
        if (id === 1) bg = '#150a14';
        const floor = NodeHelper.makeNode('Floor_' + id, parent, w, h, bg, 0, y);
        NodeHelper.makeLabel(FLOOR_LABELS[id - 1], floor, 12, id === PLAYER_FLOOR ? '#d4a557' : '#5a4a6a', -w / 2 + 60, h / 2 - 14);
        if (id === 1) {
            NodeHelper.makeLabel('▲ 入 口 ▲', floor, 14, '#5a3018', 0, -h / 2 + 20);
        }
        this.floorNodes[id] = floor;
    }

    private buildNeighbor(idStr: string, name: string, floor: number): void {
        const f = this.floorNodes[floor];
        if (!f) return;
        const box = NodeHelper.makeNode('Nb_' + idStr, f, 180, 50, '#1a1018', 200, -20);
        NodeHelper.makeLabel('🧑', box, 22, '#e8d4c8', -70, 5);
        const nameLbl = this.makeValLabel(box, name, 13, '#c5bfa8', -10, 12);
        const hpBg = NodeHelper.makeNode('HpBg', box, 90, 8, '#1a1018', 0, -10);
        const hpBar = NodeHelper.makeNode('Hp', hpBg, 90, 6, '#5bd47a', 0, 0);
        this.neighbors.push({ id: idStr, name, hp: 100, floor, box, nameLbl, hpBar });
    }

    private buildTurret(id: string, floor: number, x: number): void {
        const f = this.floorNodes[floor];
        if (!f) return;
        const tNode = NodeHelper.makeNode('Turret_' + id, f, 64, 64, '#3a2e1a', x, -20);
        tNode.addComponent(Button);
        NodeHelper.makeLabel('🔫', tNode, 28, '#d4a557', 0, 8);
        const badgeN = new Node('Badge');
        tNode.addChild(badgeN);
        badgeN.setPosition(20, -18, 0);
        badgeN.addComponent(UITransform).setContentSize(30, 30);
        const bl = badgeN.addComponent(Label);
        bl.fontSize = 16;
        bl.color = NodeHelper.hex('#ffc24b');
        bl.string = '';
        const turret: Turret = { id, floor, x, loaded: null, node: tNode, badgeLbl: bl, cd: 0 };
        tNode.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(tNode);
            this.onTurretClick(turret);
        });
        this.turrets.push(turret);
    }

    private makeValLabel(parent: Node, text: string, size: number, hex: string, x: number, y: number): Label {
        const n = new Node('Val');
        parent.addChild(n);
        n.setPosition(x, y, 0);
        n.addComponent(UITransform).setContentSize(220, size + 8);
        const lb = n.addComponent(Label);
        lb.fontSize = size;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        return lb;
    }

    // ============ Result ============

    private buildResultScreen(): void {
        const r = new Node('ResultScreen');
        this.node.addChild(r);
        r.addComponent(UITransform).setContentSize(700, 1200);
        r.active = false;

        const gradeN = new Node('Grade');
        r.addChild(gradeN);
        gradeN.setPosition(0, 460, 0);
        gradeN.addComponent(UITransform).setContentSize(680, 80);
        const gl = gradeN.addComponent(Label);
        gl.fontSize = 38;
        gl.color = NodeHelper.hex('#ffd97a');
        gl.string = '— —';
        this.resultGradeLbl = gl;

        this.resultSubLbl = this.makeValLabel(r, '', 16, '#8a8090', 0, 400);

        const box = NodeHelper.makeNode('ResBox', r, 600, 580, '#16161f', 0, 50);
        const bodyN = new Node('Body');
        box.addChild(bodyN);
        bodyN.setPosition(0, 0, 0);
        bodyN.addComponent(UITransform).setContentSize(560, 540);
        const bl = bodyN.addComponent(Label);
        bl.fontSize = 16;
        bl.color = NodeHelper.hex('#c5bfa8');
        bl.overflow = Label.Overflow.RESIZE_HEIGHT;
        bl.enableWrapText = true;
        bl.string = '';
        this.resultBodyLbl = bl;

        const again = NodeHelper.makeNode('ResAgain', r, 360, 70, '#a8803d', 0, -340);
        again.addComponent(Button);
        NodeHelper.makeLabel('再 来 一 夜', again, 22, '#1a1108');
        again.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(again);
            this.resetAll();
            this.showScreen('intro');
        });

        const home = NodeHelper.makeNode('ResHome', r, 260, 56, '#2A2545', 0, -430);
        home.addComponent(Button);
        NodeHelper.makeLabel('回 大 厅', home, 18, '#a5a5b4');
        home.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(home);
            this.exit();
        });

        this.resultScreen = r;
    }

    // ============ Prep / Combat 流程 ============

    private startPrep(): void {
        this.resetAll();
        this.showScreen('game');
        this.phase = 'prep';
        this.prepLeft = PREP_DURATION;
        this.phaseLbl.string = '备战';
        this.tipLbl.string = '选元素 → 点炮台装弹';
        this.waveLbl.string = '';
        this.hintLbl.string = '点底栏元素 · 再点 4F 炮台装弹';
        this.clockLbl.string = '备战 ' + this.prepLeft + 's';
        this.refreshElemStrip();
        this.refreshTurrets();
        this.refreshNeighbors();
        this.refreshBase();

        this.prepTickCb = () => {
            this.prepLeft--;
            this.clockLbl.string = '备战 ' + Math.max(0, this.prepLeft) + 's';
            if (this.prepLeft <= 0) {
                if (this.prepTickCb) { this.unschedule(this.prepTickCb); this.prepTickCb = null; }
                this.startCombat();
            }
        };
        this.schedule(this.prepTickCb, 1.0);
    }

    private startCombat(): void {
        this.phase = 'combat';
        this.phaseLbl.string = '战斗';
        this.tipLbl.string = '炮台自动 · 点炮台手动开炮';
        this.hintLbl.string = '装好元素 · 自动开火';
        this.waveIdx = 0;
        this.clockLbl.string = '20:00';

        this.combatTickCb = () => this.combatTick(0.1);
        this.schedule(this.combatTickCb, 0.1);
        this.startNextWave();
    }

    private startNextWave(): void {
        if (this.phase !== 'combat') return;
        if (this.waveIdx >= 3) {
            if (this.enemies.length === 0) this.endNight(true);
            return;
        }
        const idx = this.waveIdx;
        this.waveIdx++;
        let name = '';
        const spawnDefs: { t: number; type: EnemyType | 'vampire' }[] = [];
        if (idx === 0) {
            name = '第 壹 波 · 普通丧尸';
            spawnDefs.push({ t: 2, type: 'zombie' }, { t: 4.5, type: 'zombie' }, { t: 7, type: 'zombie' });
        } else if (idx === 1) {
            name = '第 贰 波 · 残影丧尸';
            spawnDefs.push({ t: 3, type: 'shadow' }, { t: 6, type: 'shadow' }, { t: 9, type: 'yuanling' });
        } else {
            name = '第 叁 波 · 夜访者';
            spawnDefs.push({ t: 3, type: 'vampire' });
        }

        this.waveLbl.string = name;
        this.toast(name);

        let maxT = 0;
        spawnDefs.forEach(sp => {
            if (sp.t > maxT) maxT = sp.t;
            const cb = () => {
                this.spawnEnemy(sp.type);
                const i = this.waveCbs.indexOf(cb);
                if (i >= 0) this.waveCbs.splice(i, 1);
            };
            this.waveCbs.push(cb);
            this.scheduleOnce(cb, sp.t);
        });

        if (idx === 1) {
            const sosCb = () => {
                this.maybeNeighborSOS();
                const i = this.waveCbs.indexOf(sosCb);
                if (i >= 0) this.waveCbs.splice(i, 1);
            };
            this.waveCbs.push(sosCb);
            this.scheduleOnce(sosCb, maxT + 4);
        }

        const nextCb = () => {
            this.startNextWave();
            const i = this.waveCbs.indexOf(nextCb);
            if (i >= 0) this.waveCbs.splice(i, 1);
        };
        this.waveCbs.push(nextCb);
        this.scheduleOnce(nextCb, maxT + 12);
    }

    // ============ 战斗 tick ============

    private combatTick(dt: number): void {
        if (this.phase !== 'combat') return;

        // 推进敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.dead) continue;
            e.progress += dt * e.def.speed * 0.06;
            const targetFloor = Math.min(4, 1 + Math.floor(e.progress * 4));
            if (targetFloor !== e.floor) {
                e.floor = targetFloor;
                const newParent = this.floorNodes[targetFloor];
                if (newParent && e.node && e.node.isValid) {
                    newParent.addChild(e.node);
                    e.node.setPosition(-180 + (e.progress * 80) % 360, -20, 0);
                }
            }
            if (e.progress >= 1.12) {
                this.baseHp -= 8;
                this.refreshBase();
                this.toast('基地受损 -8');
                this.destroyEnemy(e, false);
                if (this.baseHp <= 0) { this.endNight(false); return; }
                continue;
            }
            if ((targetFloor === 2 || targetFloor === 3) && Math.random() < dt * 0.5) {
                const nb = this.neighbors.find(n => n.floor === targetFloor);
                if (nb && nb.hp > 0) {
                    nb.hp = Math.max(0, nb.hp - 6);
                    this.refreshNeighbors();
                    if (nb.hp <= 0) this.toast(nb.name + ' 倒下了');
                }
            }
        }

        // 炮台自动开火
        this.turrets.forEach(t => {
            if (!t.loaded) return;
            t.cd -= dt;
            if (t.cd <= 0) {
                const tgt = this.pickTargetByProgress();
                if (tgt) {
                    this.fireAt(t, tgt, false);
                    t.cd = 1.0;
                }
            }
        });
    }

    private pickTargetByProgress(): Enemy | null {
        let best: Enemy | null = null;
        let bp = -1;
        this.enemies.forEach(e => {
            if (e.dead) return;
            if (e.progress > bp) { bp = e.progress; best = e; }
        });
        return best;
    }

    private pickTargetByHp(): Enemy | null {
        let best: Enemy | null = null;
        let bh = -1;
        this.enemies.forEach(e => {
            if (e.dead) return;
            if (e.hp > bh) { bh = e.hp; best = e; }
        });
        return best;
    }

    private fireAt(t: Turret, tgt: Enemy, manual: boolean): void {
        if (!t.loaded) return;
        let dmg = manual ? 15 : 10;
        if (tgt.def.weak === t.loaded) dmg *= 3;
        tgt.hp -= dmg;
        if (tgt.node && tgt.node.isValid) {
            const op = tgt.node.getComponent(UIOpacity) || tgt.node.addComponent(UIOpacity);
            op.opacity = 120;
            tween(op).to(0.12, { opacity: 255 }).start();
            this.refreshEnemyHp(tgt);
        }
        tween(t.node).to(0.06, { scale: new Vec3(1.15, 1.15, 1) }).to(0.08, { scale: new Vec3(1, 1, 1) }).start();
        if (tgt.hp <= 0) {
            this.killCount++;
            if (tgt.def.reward) {
                this.inventory[tgt.def.reward]++;
                this.refreshElemStrip();
            }
            this.destroyEnemy(tgt, true);
        }
    }

    private refreshEnemyHp(e: Enemy): void {
        if (!e.hpBar || !e.hpBar.isValid) return;
        const pct = Math.max(0, e.hp / e.maxHp);
        const ut = e.hpBar.getComponent(UITransform);
        if (ut) ut.setContentSize(40 * pct, 5);
    }

    private destroyEnemy(e: Enemy, killed: boolean): void {
        e.dead = true;
        const idx = this.enemies.indexOf(e);
        if (idx >= 0) this.enemies.splice(idx, 1);
        if (e.node && e.node.isValid) {
            const op = e.node.getComponent(UIOpacity) || e.node.addComponent(UIOpacity);
            tween(op).to(0.35, { opacity: 0 }).call(() => {
                if (e.node && e.node.isValid) e.node.destroy();
            }).start();
            tween(e.node).to(0.35, { scale: new Vec3(0.3, 0.3, 1) }).start();
        }
    }

    // ============ Spawn ============

    private spawnEnemy(type: EnemyType | 'vampire'): void {
        if (this.phase !== 'combat') return;
        if (type === 'vampire') { this.spawnVisitor(); return; }
        const def = ENEMY_DEF[type];
        if (!def) return;
        const f = this.floorNodes[1];
        if (!f) return;
        const id = 'e_' + Math.random().toString(36).slice(2, 8);
        const node = NodeHelper.makeNode('Enemy_' + id, f, 50, 60, '#1a1018', -200 + Math.random() * 60, -20);
        NodeHelper.makeLabel(def.ico, node, 32, '#ff5b5b', 0, 6);
        const hpBg = NodeHelper.makeNode('EHpBg', node, 40, 5, '#1a0810', 0, 28);
        const hpBar = NodeHelper.makeNode('EHp', hpBg, 40, 5, '#ff5b5b', 0, 0);
        const e: Enemy = {
            id, type, def,
            hp: def.hp, maxHp: def.hp,
            progress: 0, floor: 1,
            node, hpBar, dead: false,
        };
        this.enemies.push(e);
        node.setScale(0.3, 0.3, 1);
        tween(node).to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
    }

    private spawnVisitor(): void {
        const f = this.floorNodes[5] || this.floorNodes[PLAYER_FLOOR];
        if (!f) return;
        const v = NodeHelper.makeNode('Visitor', f, 70, 90, '#2a0810', 220, -20);
        NodeHelper.makeLabel('🧛', v, 40, '#d4283a', 0, 0);
        this.visitorNode = v;
        v.setScale(0.4, 0.4, 1);
        tween(v).to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
        const cb = () => {
            this.openVampireDialog();
            const i = this.waveCbs.indexOf(cb);
            if (i >= 0) this.waveCbs.splice(i, 1);
        };
        this.waveCbs.push(cb);
        this.scheduleOnce(cb, 0.8);
    }

    private removeVisitor(): void {
        if (this.visitorNode && this.visitorNode.isValid) {
            const v = this.visitorNode;
            const op = v.getComponent(UIOpacity) || v.addComponent(UIOpacity);
            tween(op).to(0.5, { opacity: 0 }).call(() => {
                if (v.isValid) v.destroy();
            }).start();
        }
        this.visitorNode = null;
    }

    // ============ 元素 / 炮台 交互 ============

    private onSelectElem(k: ElemKey): void {
        if (this.phase === 'over') return;
        if (this.inventory[k] <= 0) {
            this.toast(ELEMENTS[k].nm + ' 不够');
            return;
        }
        this.selectedElem = this.selectedElem === k ? null : k;
        this.refreshElemStrip();
        if (this.selectedElem) {
            this.hintLbl.string = '已选 ' + ELEMENTS[k].nm + ' · 克 ' + ELEMENTS[k].vs + ' · 点炮台装弹';
        } else {
            this.hintLbl.string = '选元素 · 再点炮台装弹';
        }
    }

    private onTurretClick(t: Turret): void {
        if (this.phase === 'over') return;
        if (!this.selectedElem) {
            if (this.phase === 'combat' && t.loaded) {
                const tgt = this.pickTargetByHp();
                if (!tgt) { this.toast('没有目标'); return; }
                this.fireAt(t, tgt, true);
            } else if (t.loaded) {
                this.inventory[t.loaded]++;
                t.loaded = null;
                this.refreshElemStrip();
                this.refreshTurrets();
                this.toast('已退弹');
            } else if (this.phase === 'combat') {
                this.toast('炮台未装弹');
            }
            return;
        }
        if (t.loaded) this.inventory[t.loaded]++;
        if (this.inventory[this.selectedElem] <= 0) {
            this.toast(ELEMENTS[this.selectedElem].nm + ' 不够');
            return;
        }
        this.inventory[this.selectedElem]--;
        t.loaded = this.selectedElem;
        if (this.inventory[this.selectedElem] <= 0) this.selectedElem = null;
        this.refreshElemStrip();
        this.refreshTurrets();
        this.toast('装入 ' + ELEMENTS[t.loaded].nm + ' · 克 ' + ELEMENTS[t.loaded].vs);
    }

    // ============ 刷新 ============

    private refreshElemStrip(): void {
        EKEYS.forEach((k, i) => {
            this.elemCntLbls[i].string = '×' + this.inventory[k];
            this.elemSlots[i].setScale(this.selectedElem === k ? 1.1 : 1, this.selectedElem === k ? 1.1 : 1, 1);
        });
    }

    private refreshTurrets(): void {
        this.turrets.forEach(t => {
            if (t.loaded) {
                t.badgeLbl.string = ELEMENTS[t.loaded].ico;
                t.node.setScale(1.05, 1.05, 1);
                tween(t.node).to(0.15, { scale: new Vec3(1, 1, 1) }).start();
            } else {
                t.badgeLbl.string = '';
            }
        });
    }

    private refreshNeighbors(): void {
        this.neighbors.forEach(n => {
            const pct = Math.max(0, n.hp) / 100;
            const ut = n.hpBar.getComponent(UITransform);
            if (ut) ut.setContentSize(90 * pct, 6);
            let col = '#5bd47a';
            if (n.hp < 30) col = '#ff5b5b';
            else if (n.hp < 60) col = '#d4a557';
            if (n.hp <= 0) {
                n.nameLbl.string = '— ' + n.name + ' —';
                n.nameLbl.color = NodeHelper.hex('#4a4456');
            } else if (n.hp < 50) {
                n.nameLbl.string = n.name;
                n.nameLbl.color = NodeHelper.hex('#ff8a5b');
            }
        });
    }

    private refreshBase(): void {
        this.baseHpLbl.string = '基地 ' + Math.max(0, this.baseHp);
    }

    // ============ 模态对话 ============

    private openModal(who: string, msg: string, choices: { label: string; sub: string; run: () => void }[]): void {
        this.modalLayer.removeAllChildren();
        this.modalLayer.active = true;

        const card = NodeHelper.makeNode('Card', this.modalLayer, 560, 700, '#1e1612', 0, 0);

        const whoN = new Node('Who');
        card.addChild(whoN);
        whoN.setPosition(0, 300, 0);
        whoN.addComponent(UITransform).setContentSize(520, 32);
        const wl = whoN.addComponent(Label);
        wl.fontSize = 16;
        wl.color = NodeHelper.hex('#d4a557');
        wl.string = who;

        const msgN = new Node('Msg');
        card.addChild(msgN);
        msgN.setPosition(0, 200, 0);
        msgN.addComponent(UITransform).setContentSize(500, 160);
        const ml = msgN.addComponent(Label);
        ml.fontSize = 16;
        ml.color = NodeHelper.hex('#e8e3d8');
        ml.overflow = Label.Overflow.RESIZE_HEIGHT;
        ml.enableWrapText = true;
        ml.string = msg.replace(/<br\s*\/?>/g, '\n').replace(/<\/?b>/g, '');

        choices.forEach((ch, i) => {
            const y = 30 - i * 120;
            const btn = NodeHelper.makeNode('Choice_' + i, card, 500, 100, '#2a2218', 0, y);
            btn.addComponent(Button);
            const lblN = new Node('Lbl');
            btn.addChild(lblN);
            lblN.setPosition(0, 18, 0);
            lblN.addComponent(UITransform).setContentSize(480, 30);
            const ll = lblN.addComponent(Label);
            ll.fontSize = 16;
            ll.color = NodeHelper.hex('#c5bfa8');
            ll.string = ch.label;
            const subN = new Node('Sub');
            btn.addChild(subN);
            subN.setPosition(0, -18, 0);
            subN.addComponent(UITransform).setContentSize(480, 24);
            const sl = subN.addComponent(Label);
            sl.fontSize = 13;
            sl.color = NodeHelper.hex('#6a6478');
            sl.string = ch.sub;
            btn.on(Node.EventType.TOUCH_END, () => {
                Anim.scaleClick(btn);
                this.modalLayer.active = false;
                ch.run();
            });
        });
    }

    private maybeNeighborSOS(): void {
        if (this.sosShown || this.phase !== 'combat') return;
        const zou = this.neighbors.find(n => n.id === 'zou');
        if (!zou || zou.hp <= 0) return;
        this.sosShown = true;
        this.openModal(
            '☎  来 电 · 邹 大 爷',
            '"小苏！我家阳台被砸了！我老婆受伤了！"',
            [
                {
                    label: '壹 · 立刻援助(送 2 颗水)',
                    sub: '消耗 2 水 · 邹大爷回血 60',
                    run: () => {
                        if (this.inventory.shui >= 2) {
                            this.inventory.shui -= 2;
                            zou.hp = Math.min(100, zou.hp + 60);
                            this.refreshElemStrip();
                            this.refreshNeighbors();
                            this.toast('邹大爷已稳住');
                            this.storyLog.push('救了邹大爷 → 他给了你他家钥匙');
                            this.rewards.push('· 邹大爷家钥匙');
                        } else {
                            this.toast('水元素不够');
                        }
                    },
                },
                {
                    label: '贰 · 转一台炮台火力',
                    sub: '3F 被照顾 · 你少一发自动炮',
                    run: () => {
                        zou.hp = Math.min(100, zou.hp + 30);
                        this.refreshNeighbors();
                        this.storyLog.push('给邹大爷转移了火力 · 他活下来了');
                    },
                },
                {
                    label: '叁 · 不接电话',
                    sub: '他可能死。但你不必分心。',
                    run: () => {
                        this.storyLog.push('没接邹大爷电话 · 关系破裂');
                        this.toast('你按掉了电话');
                    },
                },
            ],
        );
    }

    private openVampireDialog(): void {
        this.openModal(
            '🦇  5F 窗外 · 陌生人',
            '他敲了敲玻璃:\n"打扰了。我闻到了血——是你白天修过的那个残影。\n能聊聊吗?"',
            [
                {
                    label: '壹 · 让他进来',
                    sub: '对话 · 可能成盟友',
                    run: () => {
                        const cb = () => {
                            this.openModal(
                                '🦇  吸血鬼 · 朔',
                                '他坐下,眼睛是琥珀色的。\n"那个残影是我老朋友。谢谢你让他好好走。\n这个给你——下次你需要火,喊我一声。"',
                                [{
                                    label: '收下', sub: '', run: () => {
                                        this.inventory.huo += 3;
                                        this.refreshElemStrip();
                                        this.storyLog.push('吸血鬼"朔"成了你的盟友 · 火 +3');
                                        this.rewards.push('· 火 ×3 · 盟友:朔');
                                        this.removeVisitor();
                                    },
                                }],
                            );
                            const i = this.waveCbs.indexOf(cb);
                            if (i >= 0) this.waveCbs.splice(i, 1);
                        };
                        this.waveCbs.push(cb);
                        this.scheduleOnce(cb, 0.2);
                    },
                },
                {
                    label: '贰 · 让他走',
                    sub: '安全 · 但少一段缘分',
                    run: () => {
                        this.storyLog.push('让吸血鬼离开了 · 没结盟也没结仇');
                        this.removeVisitor();
                    },
                },
                {
                    label: '叁 · 开炮台射他',
                    sub: '敌对 · 他会带同族来报复',
                    run: () => {
                        this.toast('他闪开了,眼神冷了下去');
                        this.storyLog.push('攻击了夜访者 · 他记仇了');
                        this.removeVisitor();
                    },
                },
            ],
        );
    }

    // ============ Toast ============

    private toast(msg: string): void {
        if (!this.toastNode) return;
        this.toastLbl.string = msg;
        this.toastOp.opacity = 0;
        tween(this.toastOp).to(0.18, { opacity: 230 }).start();
        if (this.toastHideCb) { this.unschedule(this.toastHideCb); this.toastHideCb = null; }
        this.toastHideCb = () => {
            if (this.toastOp) tween(this.toastOp).to(0.3, { opacity: 0 }).start();
            this.toastHideCb = null;
        };
        this.scheduleOnce(this.toastHideCb, 1.4);
    }

    // ============ End ============

    private endNight(win: boolean): void {
        if (this.phase === 'over') return;
        this.phase = 'over';
        this.stopTimers();

        const aliveNb = this.neighbors.filter(n => n.hp > 0).length;
        const deadNb = this.neighbors.filter(n => n.hp <= 0).length;
        const baseOk = this.baseHp > 50;

        if (win) {
            this.resultGradeLbl.color = NodeHelper.hex('#ffd97a');
            this.resultGradeLbl.string = baseOk && deadNb === 0 ? '完  美  防  守' : '黎  明  降  临';
            this.resultSubLbl.string = '05:00 · 太阳出来了';
        } else {
            this.resultGradeLbl.color = NodeHelper.hex('#d4577a');
            this.resultGradeLbl.string = '基  地  陷  落';
            this.resultSubLbl.string = '你被绑走了 · 但故事还会继续';
        }

        const rwLines = this.rewards.length ? this.rewards.join('\n') : '· 无特殊战利品';
        const elemLine = EKEYS.map(k => ELEMENTS[k].nm + '×' + this.inventory[k]).join('  ');
        const logLines = this.storyLog.length ? this.storyLog.map(s => '· ' + s).join('\n') : '· 平静的一夜';
        this.resultBodyLbl.string =
            '▍ 战 利 品\n' + rwLines + '\n\n' +
            '▍ 元 素 结 余\n' + elemLine + '\n\n' +
            '▍ 今 夜 剧 情\n' + logLines + '\n\n' +
            '▍ 战 况\n' +
            '· 基地 HP: ' + Math.max(0, this.baseHp) + ' / 100\n' +
            '· 击杀: ' + this.killCount + '\n' +
            '· 邻居存活: ' + aliveNb + ' / ' + this.neighbors.length;

        const showCb = () => {
            this.showScreen('result');
            const i = this.waveCbs.indexOf(showCb);
            if (i >= 0) this.waveCbs.splice(i, 1);
        };
        this.waveCbs.push(showCb);
        this.scheduleOnce(showCb, 0.6);
    }

    // ============ 重置 ============

    private resetAll(): void {
        this.stopTimers();
        this.enemies.forEach(e => {
            if (e.node && e.node.isValid) e.node.destroy();
        });
        this.enemies = [];
        if (this.visitorNode && this.visitorNode.isValid) this.visitorNode.destroy();
        this.visitorNode = null;
        if (this.modalLayer) this.modalLayer.active = false;

        this.inventory = { yue: 2, shui: 2, huo: 1, xiang: 2, ji: 1 };
        this.selectedElem = null;
        this.baseHp = 100;
        this.killCount = 0;
        this.waveIdx = 0;
        this.storyLog = [];
        this.rewards = [];
        this.sosShown = false;
        this.prepLeft = PREP_DURATION;
        this.phase = 'prep';

        this.turrets.forEach(t => { t.loaded = null; t.cd = 0; t.badgeLbl.string = ''; });
        this.neighbors.forEach(n => {
            n.hp = 100;
            n.nameLbl.string = n.name;
            n.nameLbl.color = NodeHelper.hex('#c5bfa8');
            const ut = n.hpBar.getComponent(UITransform);
            if (ut) ut.setContentSize(90, 6);
        });

        if (this.waveLbl) this.waveLbl.string = '';
        if (this.clockLbl) this.clockLbl.string = '20:00';
        if (this.phaseLbl) this.phaseLbl.string = '备战';
        if (this.tipLbl) this.tipLbl.string = '选元素 → 点炮台装弹';
        if (this.hintLbl) this.hintLbl.string = '选元素 · 再点炮台装弹';
        if (this.baseHpLbl) this.baseHpLbl.string = '基地 100';
        if (this.elemCntLbls.length) this.refreshElemStrip();
    }

    private stopTimers(): void {
        if (this.prepTickCb) { this.unschedule(this.prepTickCb); this.prepTickCb = null; }
        if (this.combatTickCb) { this.unschedule(this.combatTickCb); this.combatTickCb = null; }
        if (this.toastHideCb) { this.unschedule(this.toastHideCb); this.toastHideCb = null; }
        this.waveCbs.forEach(cb => this.unschedule(cb));
        this.waveCbs = [];
    }

    private exit(): void {
        this.stopTimers();
        if (this.closeCb) this.closeCb();
    }
}
