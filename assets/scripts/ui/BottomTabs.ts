import { Node, UITransform, Button } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';
import { Anim } from '../utils/Anim';
import { ArcadeHall } from './ArcadeHall';

export class BottomTabs {

    static create(parent: Node): Node {
        const tabs = new Node('BottomTabs');
        parent.addChild(tabs);
        tabs.setPosition(0, -550, 0);
        tabs.addComponent(UITransform).setContentSize(750, 100);

        ArcadeHall.create(parent);

        const data: { name: string; x: number; label: string; action?: () => void }[] = [
            { name: 'Tab_Cards', x: -220, label: '牌库' },
            { name: 'Tab_Codex', x: 0,    label: '图鉴' },
            { name: 'Tab_Games', x: 220,  label: '小游戏', action: () => ArcadeHall.show() },
        ];

        for (const d of data) {
            const t = NodeHelper.makeNode(d.name, tabs, 160, 100, '#3D2B4A', d.x, 0);
            t.addComponent(Button);
            const label = d.label;
            t.on(Node.EventType.TOUCH_END, () => {
                Anim.scaleClick(t);
                if (d.action) {
                    d.action();
                } else {
                    console.log(`Tab ${label} 点击`);
                }
            });
            NodeHelper.makeLabel(d.label, t, 28, '#D4A57A');
        }

        return tabs;
    }
}
