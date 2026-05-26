import { _decorator, Component, Node, UITransform, Label, Button, UIOpacity, Vec3, tween } from 'cc';
import { NodeHelper } from '../../scripts/utils/NodeHelper';
import { Anim } from '../../scripts/utils/Anim';

const { ccclass } = _decorator;

const BUDGET = 14000;
const CAPACITY = 600;
const DURATION = 90;

interface GoodDef {
    emoji: string;
    name: string;
    price: number;
    days: number;
    space: number;
    stock: number;
}

interface GoodState {
    def: GoodDef;
    idx: number;
    owned: number;
    left: number;
    card: Node;
    bg: Node;
    emojiLbl: Label;
    nameLbl: Label;
    priceLbl: Label;
    daysLbl: Label;
    metaLbl: Label;
    ownedTag: Node;
    ownedLbl: Label;
    saleTag: Node;
    holdCb: (() => void) | null;
}

const GOODS: GoodDef[] = [
    { emoji: '💧', name: '矿泉水', price: 3, days: 1, space: 2, stock: 80 },
    { emoji: '🍜', name: '方便面', price: 6, days: 2, space: 2, stock: 80 },
    { emoji: '🥫', name: '午餐肉', price: 10, days: 3, space: 2, stock: 60 },
    { emoji: '🍫', name: '巧克力', price: 20, days: 5, space: 1, stock: 40 },
    { emoji: '🍚', name: '大米', price: 120, days: 25, space: 18, stock: 20 },
    { emoji: '🩹', name: '急救包', price: 90, days: 9, space: 2, stock: 20 },
    { emoji: '💊', name: '抗生素', price: 200, days: 18, space: 1, stock: 15 },
    { emoji: '⛽', name: '汽油桶', price: 350, days: 22, space: 14, stock: 12 },
    { emoji: '🌱', name: '蔬菜种子', price: 150, days: 20, space: 1, stock: 10 },
    { emoji: '😷', name: '防毒面具', price: 400, days: 14, space: 3, stock: 8 },
];

@ccclass('GouwucheGame')
export class GouwucheGame extends Component {

    private closeCb: (() => void) | null = null;

    private startScreen: Node = null;
    private playScreen: Node = null;
    private endScreen: Node = null;

    private cashLbl: Label = null;
    private capLbl: Label = null;
    private timeLbl: Label = null;
    private daysHudLbl: Label = null;
    private bannerLbl: Label = null;
    private bannerNode: Node = null;

    private endEmojiLbl: Label = null;
    private endTitleLbl: Label = null;
    private endRankLbl: Label = null;
    private endDaysLbl: Label = null;
    private endSpentLbl: Label = null;
    private endCapLbl: Label = null;
    private endKindsLbl: Label = null;
    private endCommentLbl: Label = null;

    private goods: GoodState[] = [];
    private cash = 0;
    private cap = 0;
    private days = 0;
    private timeLeft = 0;
    private running = false;
    private saleIdx = -1;
    private saleLeft = 0;
    private bannerPulseRunning = false;

    private tickCb: (() => void) | null = null;
    private saleCb: (() => void) | null = null;

    setCloseCallback(cb: () => void): void {
        this.closeCb = cb;
    }

    start(): void {
        this.node.addComponent(UITransform).setContentSize(700, 1200);
        this.buildStartScreen();
        this.buildPlayScreen();
        this.buildEndScreen();
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

        NodeHelper.makeLabel('末世 · 倒计时', s, 18, '#ffc24b', 0, 470);
        NodeHelper.makeLabel('末世购物车', s, 60, '#F0E4CC', 0, 390);

        const subBox = NodeHelper.makeNode('Sub', s, 580, 130, '#0a0a0f', 0, 280);
        NodeHelper.makeLabel('你重生回末世爆发前 3 小时', subBox, 18, '#cfcfda', 0, 38);
        NodeHelper.makeLabel('手里 ¥14000,一辆购物车', subBox, 18, '#cfcfda', 0, 8);
        NodeHelper.makeLabel('在丧尸涌上街头之前,囤够物资', subBox, 18, '#cfcfda', 0, -22);

        const tips = NodeHelper.makeNode('Tips', s, 600, 280, '#16161f', 0, 70);
        this.makeTipRow(tips, '⏱️', '90 秒倒计时,时间到自动结算', 110);
        this.makeTipRow(tips, '💰', '别超预算,别超购物车容量', 50);
        this.makeTipRow(tips, '⭐', '每种物资 +存活天数 不同,挑划算的', -10);
        this.makeTipRow(tips, '🔥', '不时有物资限时半价,抓紧抢', -70);
        this.makeTipRow(tips, '👆', '点卡片买一件', -130);

        const startBtn = NodeHelper.makeNode('StartBtn', s, 460, 90, '#ffc24b', 0, -200);
        startBtn.addComponent(Button);
        NodeHelper.makeLabel('冲进超市', startBtn, 26, '#241a00');
        startBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(startBtn);
            this.beginGame();
        });

        const homeBtn = NodeHelper.makeNode('HomeBtn', s, 200, 56, '#2A2545', 0, -320);
        homeBtn.addComponent(Button);
        NodeHelper.makeLabel('返回大厅', homeBtn, 18, '#b5b5c2');
        homeBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(homeBtn);
            this.exit();
        });

        this.startScreen = s;
    }

    private makeTipRow(parent: Node, ico: string, text: string, y: number): void {
        NodeHelper.makeLabel(ico, parent, 26, '#FFFFFF', -250, y);
        NodeHelper.makeLabel(text, parent, 19, '#c5c5d2', 60, y);
    }

    // ============ 游戏屏 ============

    private buildPlayScreen(): void {
        const p = new Node('PlayScreen');
        this.node.addChild(p);
        p.addComponent(UITransform).setContentSize(700, 1200);
        p.active = false;

        const back = NodeHelper.makeNode('PlayBack', p, 110, 50, '#2A2545', -285, 575);
        back.addComponent(Button);
        NodeHelper.makeLabel('‹ 大厅', back, 16, '#b5b5c2');
        back.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(back);
            this.exit();
        });

        const hudY = 510;
        const cashBox = NodeHelper.makeNode('HUD_Cash', p, 150, 80, '#16161f', -240, hudY);
        NodeHelper.makeLabel('现金', cashBox, 13, '#8a8a9a', 0, 20);
        this.cashLbl = this.makeValLabel(cashBox, String(BUDGET), 22, '#3ddc84', 0, -14);

        const capBox = NodeHelper.makeNode('HUD_Cap', p, 150, 80, '#16161f', -80, hudY);
        NodeHelper.makeLabel('购物车', capBox, 13, '#8a8a9a', 0, 20);
        this.capLbl = this.makeValLabel(capBox, '0/' + CAPACITY, 22, '#5bc8ff', 0, -14);

        const timeBox = NodeHelper.makeNode('HUD_Time', p, 150, 80, '#16161f', 80, hudY);
        NodeHelper.makeLabel('倒计时', timeBox, 13, '#8a8a9a', 0, 20);
        this.timeLbl = this.makeValLabel(timeBox, String(DURATION), 22, '#ff5b5b', 0, -14);

        const daysBox = NodeHelper.makeNode('HUD_Days', p, 150, 80, '#16161f', 240, hudY);
        NodeHelper.makeLabel('存活天数', daysBox, 13, '#8a8a9a', 0, 20);
        this.daysHudLbl = this.makeValLabel(daysBox, '0', 22, '#ffc24b', 0, -14);

        const bn = new Node('Banner');
        p.addChild(bn);
        bn.setPosition(0, 430, 0);
        bn.addComponent(UITransform).setContentSize(640, 40);
        const bl = bn.addComponent(Label);
        bl.fontSize = 20;
        bl.color = NodeHelper.hex('#ffc24b');
        bl.string = '';
        this.bannerLbl = bl;
        this.bannerNode = bn;

        const cols = 2, rows = 5;
        const cellW = 320, cellH = 150, gap = 14;
        const totalW = cellW * cols + gap * (cols - 1);
        const totalH = cellH * rows + gap * (rows - 1);
        const startX = -totalW / 2 + cellW / 2;
        const startY = totalH / 2 - cellH / 2 + 30;
        for (let i = 0; i < GOODS.length; i++) {
            const c = i % cols, r = Math.floor(i / cols);
            this.buildGoodCard(p, i, startX + c * (cellW + gap), startY - r * (cellH + gap), cellW, cellH);
        }

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

    private buildGoodCard(parent: Node, i: number, x: number, y: number, w: number, h: number): void {
        const card = NodeHelper.makeNode(`Good_${i}`, parent, w, h, '#1e1e2c', x, y);
        card.addComponent(Button);

        const bg = NodeHelper.makeNode('Bg', card, w - 6, h - 6, '#15151f', 0, 0);

        const def = GOODS[i];
        const emojiLbl = this.makeCardLabel(card, def.emoji, 40, '#FFFFFF', -120, 38);
        const nameLbl = this.makeCardLabel(card, def.name, 20, '#F0E4CC', 10, 38);

        const priceLbl = this.makeCardLabel(card, '¥' + def.price, 22, '#3ddc84', -90, -6);
        const daysLbl = this.makeCardLabel(card, '+' + def.days + '天', 18, '#ffc24b', 90, -6);

        const metaLbl = this.makeCardLabel(card, '占' + def.space + '格  剩' + def.stock + '件', 14, '#8a8a9a', 0, -50);

        const ownedTag = NodeHelper.makeNode('Owned', card, 60, 26, '#2a2a3c', w / 2 - 38, h / 2 - 18);
        ownedTag.active = false;
        const otNode = new Node('OL');
        ownedTag.addChild(otNode);
        otNode.addComponent(UITransform).setContentSize(60, 26);
        const ol = otNode.addComponent(Label);
        ol.fontSize = 16;
        ol.color = NodeHelper.hex('#e8e8ec');
        ol.string = '×0';

        const saleTag = NodeHelper.makeNode('Sale', card, 76, 24, '#ffc24b', -w / 2 + 42, h / 2 - 6);
        saleTag.active = false;
        const stNode = new Node('SL');
        saleTag.addChild(stNode);
        stNode.addComponent(UITransform).setContentSize(76, 24);
        const sl = stNode.addComponent(Label);
        sl.fontSize = 14;
        sl.color = NodeHelper.hex('#241a00');
        sl.string = '半价!';

        const state: GoodState = {
            def, idx: i, owned: 0, left: def.stock,
            card, bg, emojiLbl, nameLbl, priceLbl, daysLbl, metaLbl,
            ownedTag, ownedLbl: ol, saleTag, holdCb: null,
        };

        card.on(Node.EventType.TOUCH_END, () => this.buy(state));
        this.goods.push(state);
    }

    private makeCardLabel(parent: Node, text: string, size: number, hex: string, x: number, y: number): Label {
        const n = new Node('CL');
        parent.addChild(n);
        n.setPosition(x, y, 0);
        n.addComponent(UITransform).setContentSize(220, size + 8);
        const lb = n.addComponent(Label);
        lb.fontSize = size;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        return lb;
    }

    // ============ 结束屏 ============

    private buildEndScreen(): void {
        const e = new Node('EndScreen');
        this.node.addChild(e);
        e.addComponent(UITransform).setContentSize(700, 1200);
        e.active = false;

        this.endEmojiLbl = this.bigLabel(e, '🛒', 72, '#FFFFFF', 0, 460);
        this.endTitleLbl = this.bigLabel(e, '', 36, '#F0E4CC', 0, 360);
        this.endRankLbl = this.bigLabel(e, '', 16, '#8a8a9a', 0, 310);

        this.endDaysLbl = this.bigLabel(e, '0', 64, '#ffc24b', 0, 220);
        NodeHelper.makeLabel('你囤的物资能撑这么多天', e, 16, '#8a8a9a', 0, 160);

        const panel = NodeHelper.makeNode('EndPanel', e, 560, 220, '#16161f', 0, 30);
        this.endSpentLbl = this.makeKVRow(panel, '花掉现金', 70);
        this.endCapLbl = this.makeKVRow(panel, '购物车用量', 0);
        this.endKindsLbl = this.makeKVRow(panel, '物资种类', -70);

        const commentNode = new Node('Comment');
        e.addChild(commentNode);
        commentNode.setPosition(0, -130, 0);
        commentNode.addComponent(UITransform).setContentSize(580, 100);
        const cl = commentNode.addComponent(Label);
        cl.fontSize = 18;
        cl.color = NodeHelper.hex('#cfcfda');
        cl.overflow = Label.Overflow.RESIZE_HEIGHT;
        cl.enableWrapText = true;
        cl.string = '';
        this.endCommentLbl = cl;

        const again = NodeHelper.makeNode('EndAgain', e, 460, 80, '#ffc24b', 0, -260);
        again.addComponent(Button);
        NodeHelper.makeLabel('再抢一次', again, 22, '#241a00');
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
        valN.addComponent(UITransform).setContentSize(260, 32);
        const lb = valN.addComponent(Label);
        lb.fontSize = 22;
        lb.color = NodeHelper.hex('#ffc24b');
        lb.string = '0';
        return lb;
    }

    // ============ 游戏流程 ============

    private beginGame(): void {
        this.stopTimers();
        this.cash = BUDGET;
        this.cap = 0;
        this.days = 0;
        this.timeLeft = DURATION;
        this.running = true;
        this.saleIdx = -1;
        this.saleLeft = 0;
        this.goods.forEach(g => {
            g.owned = 0;
            g.left = g.def.stock;
        });
        this.bannerLbl.string = '';
        this.bannerNode.setScale(1, 1, 1);
        this.bannerPulseRunning = false;
        this.renderShelf();
        this.updateHud();
        this.showScreen('play');

        this.tickCb = () => this.tick();
        this.schedule(this.tickCb, 1.0);
        this.saleCb = () => this.maybeSale();
        this.schedule(this.saleCb, 1.0);
        this.scheduleOnce(this.saleCb, 3.0);
    }

    private tick(): void {
        this.timeLeft--;
        this.updateHud();
        if (this.timeLeft <= 0) this.over();
    }

    private priceOf(g: GoodState): number {
        return g.idx === this.saleIdx ? Math.ceil(g.def.price / 2) : g.def.price;
    }

    private buy(g: GoodState): void {
        if (!this.running) return;
        const p = this.priceOf(g);
        if (this.cash < p || this.cap + g.def.space > CAPACITY || g.left <= 0) {
            Anim.shake(g.card);
            return;
        }
        this.cash -= p;
        this.cap += g.def.space;
        this.days += g.def.days;
        g.owned++;
        g.left--;
        this.bump(g.card);
        this.float(g.card, '+' + g.def.days + '天', '#ffc24b');
        this.renderShelf();
        this.updateHud();
    }

    private bump(card: Node): void {
        card.setScale(1.06, 1.06, 1);
        tween(card).to(0.18, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
    }

    private float(parent: Node, text: string, hex: string): void {
        const n = new Node('Float');
        parent.addChild(n);
        n.setPosition(0, 10, 0);
        n.addComponent(UITransform).setContentSize(200, 30);
        const lb = n.addComponent(Label);
        lb.fontSize = 22;
        lb.color = NodeHelper.hex(hex);
        lb.string = text;
        const op = n.addComponent(UIOpacity);
        op.opacity = 255;
        tween(n).to(0.7, { position: new Vec3(0, 60, 0) }).start();
        tween(op).to(0.7, { opacity: 0 }).call(() => n.destroy()).start();
    }

    private renderShelf(): void {
        this.goods.forEach(g => {
            const p = this.priceOf(g);
            const sale = g.idx === this.saleIdx;
            const affordable = this.cash >= p && this.cap + g.def.space <= CAPACITY && g.left > 0;

            g.priceLbl.string = sale ? '¥' + p + ' (原¥' + g.def.price + ')' : '¥' + p;
            g.priceLbl.color = NodeHelper.hex(sale ? '#ffc24b' : '#3ddc84');
            g.metaLbl.string = '占' + g.def.space + '格  剩' + g.left + '件';

            if (g.owned > 0) {
                g.ownedTag.active = true;
                g.ownedLbl.string = '×' + g.owned;
            } else {
                g.ownedTag.active = false;
            }

            g.saleTag.active = sale;

            const op = g.card.getComponent(UIOpacity) || g.card.addComponent(UIOpacity);
            op.opacity = affordable ? 255 : 110;
        });
    }

    private maybeSale(): void {
        if (!this.running) return;
        if (this.saleIdx >= 0) {
            this.saleLeft--;
            if (this.saleLeft <= 0) {
                this.saleIdx = -1;
                this.bannerLbl.string = '';
                this.bannerPulseRunning = false;
                this.bannerNode.setScale(1, 1, 1);
                this.renderShelf();
            }
            return;
        }
        if (Math.random() < 0.4) {
            const avail = this.goods.filter(g => g.left > 0);
            if (!avail.length) return;
            const pick = avail[Math.floor(Math.random() * avail.length)];
            this.saleIdx = pick.idx;
            this.saleLeft = 6;
            this.bannerLbl.string = '🔥 限时抢购:' + pick.def.name + ' 半价!';
            this.startBannerPulse();
            this.renderShelf();
        }
    }

    private startBannerPulse(): void {
        if (this.bannerPulseRunning) return;
        this.bannerPulseRunning = true;
        const loop = () => {
            if (!this.bannerPulseRunning) return;
            tween(this.bannerNode)
                .to(0.3, { scale: new Vec3(1.08, 1.08, 1) })
                .to(0.3, { scale: new Vec3(1, 1, 1) })
                .call(loop)
                .start();
        };
        loop();
    }

    private updateHud(): void {
        this.cashLbl.string = String(this.cash);
        this.capLbl.string = this.cap + '/' + CAPACITY;
        this.timeLbl.string = String(Math.max(0, this.timeLeft));
        this.daysHudLbl.string = String(this.days);
    }

    private over(): void {
        this.running = false;
        this.bannerPulseRunning = false;
        this.stopTimers();

        const spent = BUDGET - this.cash;
        const kinds = this.goods.filter(g => g.owned > 0).length;
        this.endDaysLbl.string = String(this.days);
        this.endSpentLbl.string = '¥' + spent + ' / ¥' + BUDGET;
        this.endCapLbl.string = this.cap + ' / ' + CAPACITY + ' 格';
        this.endKindsLbl.string = kinds + ' / ' + GOODS.length + ' 种';

        let emoji: string, title: string, rank: string, comment: string;
        if (this.days >= 1100) {
            emoji = '👑'; title = '末日囤货大师'; rank = '传说级';
            comment = '钱和购物车都榨干了,物资种类齐全。末世对你来说只是换个地方过日子。';
        } else if (this.days >= 750) {
            emoji = '🏆'; title = '囤货高手'; rank = '优秀';
            comment = '撑过两年多没问题。再压榨一下购物车容量,还能更高。';
        } else if (this.days >= 400) {
            emoji = '🛒'; title = '准备充分'; rank = '合格';
            comment = '活下来不难。下次多盯着限时半价,同样的钱能囤更多。';
        } else {
            emoji = '🥫'; title = '囤得太少'; rank = '危险';
            comment = '这点物资撑不了多久。别犹豫,看见划算的就赶紧买。';
        }
        this.endEmojiLbl.string = emoji;
        this.endTitleLbl.string = title;
        this.endRankLbl.string = rank;
        this.endCommentLbl.string = comment;

        this.showScreen('end');
    }

    private stopTimers(): void {
        if (this.tickCb) { this.unschedule(this.tickCb); this.tickCb = null; }
        if (this.saleCb) { this.unschedule(this.saleCb); this.saleCb = null; }
    }

    private exit(): void {
        this.stopTimers();
        if (this.closeCb) this.closeCb();
    }
}
