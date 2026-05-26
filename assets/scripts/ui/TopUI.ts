import { Node, UITransform, Button } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';
import { Anim } from '../utils/Anim';

export class TopUI {

    static create(parent: Node): Node {
        const topUI = new Node('TopUI');
        parent.addChild(topUI);
        topUI.addComponent(UITransform).setContentSize(750, 1334);

        const card = NodeHelper.makeNode('NameCard', topUI, 240, 100, '#7A4A5C', -235, 580);
        card.addComponent(Button);
        card.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(card);
            console.log('名牌点击');
        });
        NodeHelper.makeLabel('白月 Lv.37', card, 24, '#F0E4CC', 0, 15);
        NodeHelper.makeNode('ProgressBar', card, 200, 12, '#D4A57A', 0, -20);

        const res = new Node('ResourceBar');
        topUI.addChild(res);
        res.setPosition(100, 600, 0);
        res.addComponent(UITransform).setContentSize(300, 120);
        NodeHelper.makeLabel('⭐ 12,450', res, 22, '#D4A57A', 0, 0);
        NodeHelper.makeLabel('💧 3,260', res, 22, '#D4A57A', 0, -35);
        NodeHelper.makeLabel('💎 28', res, 22, '#D4A57A', 0, -70);

        const xz = NodeHelper.makeNode('XiaoZhao', topUI, 100, 100, '#E8C49A', 320, 450);
        xz.addComponent(Button);
        xz.on(Node.EventType.TOUCH_END, () => {
            Anim.shake(xz);
            console.log('小昭点击');
        });

        return topUI;
    }
}