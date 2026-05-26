import { _decorator, Component, Node } from 'cc';
import { NodeHelper } from './utils/NodeHelper';
import { MaleLead } from './ui/MaleLead';
import { TopUI } from './ui/TopUI';
import { SideFloating } from './ui/SideFloating';
import { BottomTabs } from './ui/BottomTabs';
import { FloatingHints } from './ui/FloatingHints';
import { Popups } from './ui/Popups';
const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Component {

    private popups = new Popups();

    start() {
        NodeHelper.makeNode('Background', this.node, 750, 1334, '#3D2B4A');
        MaleLead.create(this.node, () => this.popups.showSoul());
        TopUI.create(this.node);
        SideFloating.create(this.node);
        BottomTabs.create(this.node);
        FloatingHints.create(this.node, () => this.popups.showDaily());
        this.popups.create(this.node);
        console.log('首页节点树创建完成');
    }
}