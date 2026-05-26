import { Node, UITransform, Button } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';
import { Anim } from '../utils/Anim';

export class FloatingHints {

    static create(parent: Node, onTarotClick: () => void): Node {
        const hints = new Node('FloatingHints');
        parent.addChild(hints);
        hints.addComponent(UITransform).setContentSize(750, 1334);

        const tarot = NodeHelper.makeNode('DailyTarotHint', hints, 90, 130, '#A04848', 280, -380);
        tarot.addComponent(Button);
        tarot.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(tarot);
            onTarotClick();
        });
        NodeHelper.makeLabel('今日\n塔罗', tarot, 20, '#F0E4CC');

        return hints;
    }
}