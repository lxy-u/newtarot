import { Node, UITransform, Button, UIOpacity, BlockInputEvents } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';
import { Anim } from '../utils/Anim';
import { GAME_LIST, GameMeta } from '../games/GameRegistry';
import { GameLauncher } from '../games/GameLauncher';

export class ArcadeHall {

    private static root: Node = null;
    private static gameMount: Node = null;
    private static gameList: Node = null;

    static create(parent: Node): void {
        const root = new Node('ArcadeHallPopup');
        parent.addChild(root);
        root.addComponent(UITransform).setContentSize(750, 1334);
        root.active = false;

        const mask = NodeHelper.makeNode('Mask', root, 750, 1334, '#000000', 0, 0);
        mask.addComponent(UIOpacity).opacity = 180;
        mask.addComponent(BlockInputEvents);

        const frame = NodeHelper.makeNode('Frame', root, 700, 1200, '#16161f', 0, 0);

        NodeHelper.makeLabel('小游戏厅', frame, 32, '#F0E4CC', -220, 540);
        NodeHelper.makeLabel('末世短剧 · 一玩就停不下', frame, 16, '#8a8a9a', -170, 500);

        const closeBtn = NodeHelper.makeNode('CloseBtn', frame, 80, 80, '#D4A57A', 290, 540);
        closeBtn.addComponent(Button);
        NodeHelper.makeLabel('✕', closeBtn, 28, '#2A2545');
        closeBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(closeBtn);
            if (GameLauncher.isRunning()) {
                GameLauncher.close(() => ArcadeHall.hide());
            } else {
                ArcadeHall.hide();
            }
        });

        const gameMount = new Node('GameMount');
        frame.addChild(gameMount);
        gameMount.setPosition(0, 0, 0);
        gameMount.addComponent(UITransform).setContentSize(700, 1200);
        ArcadeHall.gameMount = gameMount;

        const list = new Node('GameList');
        frame.addChild(list);
        list.setPosition(0, 0, 0);
        list.addComponent(UITransform).setContentSize(700, 1000);

        const cardW = 600;
        const cardH = 140;
        const gap = 24;
        const startY = 380;
        GAME_LIST.forEach((g, i) => {
            ArcadeHall.makeCard(list, g, 0, startY - i * (cardH + gap), cardW, cardH);
        });
        ArcadeHall.gameList = list;

        ArcadeHall.root = root;
    }

    private static makeCard(parent: Node, g: GameMeta, x: number, y: number, w: number, h: number): Node {
        const card = NodeHelper.makeNode(`Card_${g.id}`, parent, w, h, '#2A2545', x, y);
        card.addComponent(Button);

        NodeHelper.makeNode('Badge', card, 12, h - 20, g.badgeHex, -w / 2 + 18, 0);
        NodeHelper.makeLabel(g.title, card, 28, '#F0E4CC', -120, 22);
        NodeHelper.makeLabel(g.subtitle, card, 16, '#8a8a9a', -110, -18);

        const playBtn = NodeHelper.makeNode('Play', card, 120, 56, g.badgeHex, w / 2 - 90, 0);
        NodeHelper.makeLabel('开始', playBtn, 22, '#0a0a0f');

        card.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(card);
            ArcadeHall.startGame(g.id);
        });
        return card;
    }

    private static startGame(gameId: string): void {
        if (!ArcadeHall.gameMount) return;
        if (ArcadeHall.gameList) ArcadeHall.gameList.active = false;
        GameLauncher.launch(gameId, ArcadeHall.gameMount, () => {
            if (ArcadeHall.gameList) ArcadeHall.gameList.active = true;
        });
    }

    static show(): void {
        if (!ArcadeHall.root) {
            console.warn('ArcadeHall 未初始化');
            return;
        }
        Anim.showPopup(ArcadeHall.root);
    }

    static hide(): void {
        if (!ArcadeHall.root) return;
        Anim.hidePopup(ArcadeHall.root);
    }
}
