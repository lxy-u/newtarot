import { Node, UITransform, Button, WebView, UIOpacity, BlockInputEvents } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';
import { Anim } from '../utils/Anim';

export class GameWebView {

    private static root: Node = null;
    private static webview: WebView = null;

    static create(parent: Node): void {
        const root = new Node('GameWebViewPopup');
        parent.addChild(root);
        root.addComponent(UITransform).setContentSize(750, 1334);
        root.active = false;

        const mask = NodeHelper.makeNode('Mask', root, 750, 1334, '#000000', 0, 0);
        mask.addComponent(UIOpacity).opacity = 180;
        mask.addComponent(BlockInputEvents);

        const frame = NodeHelper.makeNode('Frame', root, 700, 1200, '#2A2545', 0, 0);

        NodeHelper.makeLabel('小游戏厅', frame, 28, '#F0E4CC', -260, 560);

        const closeBtn = NodeHelper.makeNode('CloseBtn', frame, 80, 80, '#D4A57A', 300, 560);
        closeBtn.addComponent(Button);
        NodeHelper.makeLabel('✕', closeBtn, 28, '#2A2545');
        closeBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(closeBtn);
            GameWebView.hide();
        });

        const webNode = new Node('WebViewNode');
        frame.addChild(webNode);
        webNode.setPosition(0, -40, 0);
        webNode.addComponent(UITransform).setContentSize(680, 1080);
        GameWebView.webview = webNode.addComponent(WebView);

        GameWebView.root = root;
    }

    static show(url: string): void {
        if (!GameWebView.root) {
            console.warn('GameWebView 未初始化,请先调用 create');
            return;
        }
        GameWebView.webview.url = url;
        Anim.showPopup(GameWebView.root);
    }

    static hide(): void {
        if (!GameWebView.root) return;
        Anim.hidePopup(GameWebView.root);
    }
}
