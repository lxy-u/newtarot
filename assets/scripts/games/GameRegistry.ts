export interface GameMeta {
    id: string;
    title: string;
    subtitle: string;
    bundleName: string;
    entryClass: string;
    badgeHex: string;
}

export const GAME_LIST: GameMeta[] = [
    {
        id: 'shoumen',
        title: '守门人',
        subtitle: '丧尸打地鼠 · 60s',
        bundleName: 'game-shoumen',
        entryClass: 'ShoumenGame',
        badgeHex: '#ff5b5b',
    },
    {
        id: 'wenda',
        title: '前世问答',
        subtitle: '真假记忆 · 8 关重生洞察',
        bundleName: 'game-wenda',
        entryClass: 'WendaGame',
        badgeHex: '#5bc8ff',
    },
    {
        id: 'gouwuche',
        title: '末世购物车',
        subtitle: '末世 · 抢购倒计时',
        bundleName: 'game-gouwuche',
        entryClass: 'GouwucheGame',
        badgeHex: '#ffc24b',
    },
    {
        id: 'xiufutai',
        title: '修复台',
        subtitle: '残光社 · 让残影好好走',
        bundleName: 'game-xiufutai',
        entryClass: 'XiufutaiGame',
        badgeHex: '#d4a557',
    },
    {
        id: 'taifang',
        title: '残光社 · 塔防夜',
        subtitle: '5 元素装炮台,守住 3 波夜访者',
        bundleName: 'game-taifang',
        entryClass: 'TaifangGame',
        badgeHex: '#d4a557',
    },
];

export function findGame(id: string): GameMeta | null {
    return GAME_LIST.find(g => g.id === id) || null;
}
