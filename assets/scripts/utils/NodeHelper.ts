import { Node, UITransform, Color, Label, Graphics } from 'cc';
import { AssetLoader } from './AssetLoader';

export class NodeHelper {

    static makeNode(name: string, parent: Node, w: number, h: number, hex: string, x = 0, y = 0): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(w, h);
        const g = node.addComponent(Graphics);
        g.fillColor = NodeHelper.hex(hex);
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();
        return node;
    }

    static makeLabel(text: string, parent: Node, size = 22, hex = '#D4A57A', x = 0, y = 0): Node {
        const node = new Node('Label');
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(300, 60);
        const lb = node.addComponent(Label);
        lb.string = text;
        lb.fontSize = size;
        lb.color = NodeHelper.hex(hex);
        return node;
    }

    static hex(h: string): Color {
        const c = new Color();
        Color.fromHEX(c, h);
        return c;
    }

    static makeNode(name: string, parent: Node, w: number, h: number, hex: string, x = 0, y = 0): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(w, h);
        const g = node.addComponent(Graphics);
        g.fillColor = NodeHelper.hex(hex);
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();
        AssetLoader.applyTexture(node); // 加这一行
        return node;
    }

}