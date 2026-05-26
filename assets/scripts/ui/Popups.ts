import { Node, UITransform, Button } from 'cc';
import { NodeHelper } from '../utils/NodeHelper';
import { Anim } from '../utils/Anim';

export class Popups {

    dailyTarotPopup: Node = null;
    soulReadingPopup: Node = null;

    create(parent: Node): void {
        const popups = new Node('Popups');
        parent.addChild(popups);
        popups.addComponent(UITransform).setContentSize(750, 1334);

        this.dailyTarotPopup = NodeHelper.makeNode('DailyTarotPopup', popups, 600, 800, '#2A2545');
        this.dailyTarotPopup.active = false;
        NodeHelper.makeLabel('今日塔罗', this.dailyTarotPopup, 32, '#F0E4CC', 0, 320);
        NodeHelper.makeLabel('他抽到了：愚者\n\n"今天也是充满可能的一天。"', this.dailyTarotPopup, 22, '#D4A57A', 0, 0);
        const closeDaily = NodeHelper.makeNode('CloseBtn', this.dailyTarotPopup, 80, 80, '#D4A57A', 260, 360);
        closeDaily.addComponent(Button);
        NodeHelper.makeLabel('✕', closeDaily, 28, '#2A2545');
        closeDaily.on(Node.EventType.TOUCH_END, () => {
            Anim.hidePopup(this.dailyTarotPopup);
        });

        this.soulReadingPopup = NodeHelper.makeNode('SoulReadingPopup', popups, 600, 400, '#2A2545');
        this.soulReadingPopup.active = false;
        NodeHelper.makeLabel('想和他占一卦吗？', this.soulReadingPopup, 28, '#F0E4CC', 0, 120);
        const cancelBtn = NodeHelper.makeNode('CancelBtn', this.soulReadingPopup, 180, 70, '#7A4A5C', -120, -100);
        cancelBtn.addComponent(Button);
        NodeHelper.makeLabel('取消', cancelBtn, 24, '#F0E4CC');
        cancelBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(cancelBtn);
            Anim.hidePopup(this.soulReadingPopup);
        });

        const confirmBtn = NodeHelper.makeNode('ConfirmBtn', this.soulReadingPopup, 180, 70, '#D4A57A', 120, -100);
        confirmBtn.addComponent(Button);
        NodeHelper.makeLabel('占卦', confirmBtn, 24, '#2A2545');
        confirmBtn.on(Node.EventType.TOUCH_END, () => {
            Anim.scaleClick(confirmBtn);
            console.log('确认占卦');
            Anim.hidePopup(this.soulReadingPopup);
        });
    }

    showDaily() { Anim.showPopup(this.dailyTarotPopup); }
    showSoul()  { Anim.showPopup(this.soulReadingPopup); }
}