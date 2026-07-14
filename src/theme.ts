export type AgentThemeId = 'green' | 'iteach';

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
};

export function getAgentTheme(id?: string | null) {
  const normalized = id ? aliases[id.toLowerCase()] : DEFAULT_THEME_ID;
  return (
    AGENT_THEMES.find(theme => theme.id === normalized)
    || AGENT_THEMES.find(theme => theme.id === DEFAULT_THEME_ID)
    || AGENT_THEMES[0]
  );
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
  if (params.has('box-green')) {
    applyAgentTheme('green', false);
    return 'green';
  }
  const queryTheme = params.get('theme') || params.get('agentTheme');
  const themeId = queryTheme ? getAgentTheme(queryTheme).id : getStoredThemeId();
  applyAgentTheme(themeId, Boolean(queryTheme));
  return themeId;
}
