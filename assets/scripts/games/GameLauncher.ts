import { assetManager, AssetManager, Component, js, Node } from 'cc';
import { GameMeta, findGame } from './GameRegistry';

interface RunningGame {
    bundle: AssetManager.Bundle;
    node: Node;
}

export class GameLauncher {

    private static current: RunningGame | null = null;

    static launch(gameId: string, parent: Node, onClose: () => void): void {
        if (GameLauncher.current) {
            console.warn('已有小游戏在运行,先关闭');
            return;
        }
        const meta = findGame(gameId);
        if (!meta) {
            console.warn(`未知小游戏 id: ${gameId}`);
            return;
        }

        assetManager.loadBundle(meta.bundleName, (err, bundle) => {
            if (err) {
                console.error(`Bundle 加载失败: ${meta.bundleName}`, err);
                return;
            }
            GameLauncher.mountEntry(meta, bundle, parent, onClose);
        });
    }

    private static mountEntry(meta: GameMeta, bundle: AssetManager.Bundle, parent: Node, onClose: () => void): void {
        const Cls = js.getClassByName(meta.entryClass) as (new () => Component) | null;
        if (!Cls) {
            console.error(`Bundle 内未找到入口类: ${meta.entryClass} (bundle=${meta.bundleName})`);
            assetManager.removeBundle(bundle);
            return;
        }

        const node = new Node(meta.id);
        parent.addChild(node);
        const comp = node.addComponent(Cls) as Component & { setCloseCallback?: (cb: () => void) => void };
        if (typeof comp.setCloseCallback === 'function') {
            comp.setCloseCallback(() => GameLauncher.close(onClose));
        }
        GameLauncher.current = { bundle, node };
    }

    static close(onClose?: () => void): void {
        if (!GameLauncher.current) return;
        const { bundle, node } = GameLauncher.current;
        GameLauncher.current = null;
        if (node && node.isValid) node.destroy();
        assetManager.removeBundle(bundle);
        if (onClose) onClose();
    }

    static isRunning(): boolean {
        return GameLauncher.current !== null;
    }
}
