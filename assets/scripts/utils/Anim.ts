import { Node, Vec3, tween } from 'cc';

export class Anim {

    static scaleClick(node: Node) {
        tween(node)
            .to(0.08, { scale: new Vec3(0.92, 0.92, 1) })
            .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    static shake(node: Node) {
        const p = node.position.clone();
        tween(node)
            .to(0.05, { position: new Vec3(p.x + 8, p.y, 0) })
            .to(0.05, { position: new Vec3(p.x - 8, p.y, 0) })
            .to(0.05, { position: new Vec3(p.x + 5, p.y, 0) })
            .to(0.05, { position: p })
            .start();
    }

    static showPopup(node: Node) {
        node.active = true;
        node.setScale(0.5, 0.5, 1);
        tween(node)
            .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    static hidePopup(node: Node) {
        tween(node)
            .to(0.15, { scale: new Vec3(0.5, 0.5, 1) }, { easing: 'sineIn' })
            .call(() => { node.active = false; })
            .start();
    }
}