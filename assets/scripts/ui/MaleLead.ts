import { Node, Button, Vec3, tween } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';

export class MaleLead {

    static create(parent: Node, onLongPress: () => void): Node {
        const n = NodeHelper.makeNode('MaleLead', parent, 400, 700, '#D4A57A', 0, -50);
        n.addComponent(Button);

        let touchStartTime = 0;
        let longPressTimer: any = null;
        let isDragging = false;

        n.on(Node.EventType.TOUCH_START, () => {
            touchStartTime = Date.now();
            isDragging = false;
            longPressTimer = setTimeout(() => {
                console.log('男主长按 → 心灵共占');
                onLongPress();
                longPressTimer = null;
            }, 600);
        });

        n.on(Node.EventType.TOUCH_MOVE, (e: any) => {
            const d = e.touch.getDelta();
            if (Math.abs(d.x) > 5 || Math.abs(d.y) > 5) {
                isDragging = true;
                if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            }
        });

        n.on(Node.EventType.TOUCH_END, () => {
            const dur = Date.now() - touchStartTime;
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            if (dur < 600 && !isDragging) {
                console.log('男主单击 → 他微笑了');
                tween(n)
                    .to(0.15, { scale: new Vec3(1.03, 1.03, 1) })
                    .to(0.2, { scale: new Vec3(1, 1, 1) })
                    .start();
            }
        });

        n.on(Node.EventType.TOUCH_CANCEL, () => {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        });

        return n;
    }
}