export type AgentThemeId = 'green' | 'iteach' | 'cyan' | 'workbench' | 'orange';

export interface AgentThemeOption {
  id: AgentThemeId;
  name: string;
  shortName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const AGENT_THEMES: AgentThemeOption[] = [
  {
    id: 'green',
    name: '默认绿色',
    shortName: '绿',
    description: '保留当前线上默认主色调',
    colors: {
      primary: '#00C9A7',
      secondary: '#00A8E8',
      accent: '#22C55E',
    },
  },
  {
    id: 'iteach',
    name: 'iTeach 蓝橙',
    shortName: '蓝',
    description: '蓝青承接小学工作台，橙色突出生成动作',
    colors: {
      primary: '#0274FC',
      secondary: '#35DDE7',
      accent: '#FF8A00',
    },
  },
  {
    id: 'cyan',
    name: '蓝青智能',
    shortName: '青',
    description: '去掉橙色动作色，整体保持蓝青智能感',
    colors: {
      primary: '#0274FC',
      secondary: '#00FFF6',
      accent: '#00B8D9',
    },
  },
  {
    id: 'workbench',
    name: 'iTeach 工作台',
    shortName: '工',
    description: '贴近小学工作台的浅蓝白界面，弱化演示感',
    colors: {
      primary: '#1677FF',
      secondary: '#68B8FF',
      accent: '#1677FF',
    },
  },
  {
    id: 'orange',
    name: '橙光创作',
    shortName: '橙',
    description: '更强调创作、灵感和低龄活力',
    colors: {
      primary: '#FF7A1A',
      secondary: '#FFD35C',
      accent: '#0274FC',
    },
  },
];

const THEME_STORAGE_KEY = 'courseware-agent-theme';
const DEFAULT_THEME_ID: AgentThemeId = 'iteach';

const aliases: Record<string, AgentThemeId> = {
  default: 'green',
  current: 'green',
  green: 'green',
  iteach: 'iteach',
  blue: 'iteach',
  c: 'iteach',
  cyan: 'cyan',
  blueai: 'cyan',
  smartblue: 'cyan',
  qing: 'cyan',
  workbench: 'workbench',
  iteachworkbench: 'workbench',
  platform: 'workbench',
  xiaoxue: 'workbench',
  orange: 'orange',
  b: 'orange',
};

export function getAgentTheme(id?: string | null) {
  const normalized = id ? aliases[id.toLowerCase()] : undefined;
  return AGENT_THEMES.find(theme => theme.id === normalized) || AGENT_THEMES[0];
}

export function getStoredThemeId(): AgentThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored ? getAgentTheme(stored).id : DEFAULT_THEME_ID;
}

export function applyAgentTheme(id: AgentThemeId, persist = true) {
  if (typeof document === 'undefined') return;
  const theme = getAgentTheme(id);
  document.documentElement.dataset.agentTheme = theme.id;
  if (persist && typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }
}

export function initAgentTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const params = new URLSearchParams(window.location.search);
  const queryTheme = params.get('theme') || params.get('agentTheme');
  const themeId = queryTheme ? getAgentTheme(queryTheme).id : getStoredThemeId();
  applyAgentTheme(themeId, Boolean(queryTheme));
  return themeId;
}
