import { resources, ImageAsset, SpriteFrame, Node, Sprite, Texture2D, UITransform } from 'cc';

export class AssetLoader {

    private static pathMap: Record<string, string> = {
        'Background':    'textures/bg',
        'MaleLead':      'textures/male_lead',
        'XiaoZhao':      'textures/xiao_zhao',
        'ChapterScroll': 'textures/chapter_scroll',
        'WishAstrolabe': 'textures/wish_astrolabe',
    };

    static applyTexture(node: Node) {
        const path = this.pathMap[node.name];
        if (!path) return;

        resources.load(path, ImageAsset, (err, imageAsset) => {
            if (err) { console.warn(`图片加载失败: ${path}`, err.message); return; }

            const tex = new Texture2D();
            tex.image = imageAsset;
            const sf = new SpriteFrame();
            sf.texture = tex;

            // 创建子节点放图片，不影响父节点的 Graphics
            const imgNode = new Node('Image');
            node.addChild(imgNode);
            imgNode.setPosition(0, 0, 0);

            // 获取父节点尺寸
            const uit = node.getComponent(UITransform);
            const w = uit ? uit.contentSize.width : 100;
            const h = uit ? uit.contentSize.height : 100;

            imgNode.addComponent(UITransform).setContentSize(w, h);
            const sp = imgNode.addComponent(Sprite);
            sp.spriteFrame = sf;
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            sp.trim = false;

            console.log(`图片加载成功: ${path}`);
        });
    }
}