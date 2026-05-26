import { Node, UITransform, Button } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';
import { Anim } from '../utils/Anim';

export class SideFloating {

    static create(parent: Node): Node {
        const side = new Node('SideFloating');
        parent.addChild(side);
        side.addComponent(UITransform).setContentSize(750, 1334);

        const scroll = NodeHelper.makeNode('ChapterScroll', side, 120, 140, '#C97D4A', -280, 0);
        scroll.addComponent(Button);
        scroll.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(scroll);
            console.log('卷轴点击');
        });
        NodeHelper.makeLabel('第三章\n未完', scroll, 20, '#F0E4CC');

        const wish = NodeHelper.makeNode('WishAstrolabe', side, 130, 130, '#D4A57A', 280, 0);
        wish.addComponent(Button);
        wish.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(wish);
            console.log('星盘点击');
        });
        NodeHelper.makeLabel('祈愿', wish, 20, '#F0E4CC');

        return side;
    }
}