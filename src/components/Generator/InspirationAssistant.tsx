import { useMemo, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  Lightbulb,
  MessageCircle,
  SendHorizontal,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';

interface InspirationAssistantProps {
  onApplyPrompt: (prompt: string) => void;
}

interface AssistantReply {
  title: string;
  body: string;
  ideas: string[];
  finalPrompt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  reply?: AssistantReply;
}

const quickQuestions = [
  '颜色单词适合做什么互动？',
  '20以内口算怎么更有游戏感？',
  '古诗背诵可以怎么互动？',
  '低龄英语启蒙怎么做不枯燥？',
];

const buildReply = (question: string): AssistantReply => {
  if (/颜色|color/i.test(question)) {
    return {
      title: '建议用“彩虹修复 + 单词图片配对”',
      body: '颜色单词的难点不是讲解，而是让学生反复听、看、选、说。可以把抽象单词变成彩虹缺口修复任务，每轮只解决一个颜色，课堂上很好投屏互动。',
      ideas: ['听音辨色', '拖拽颜色卡', '点亮彩虹进度', '答对播放英文发音'],
      finalPrompt: `做一个 5-8 岁儿童使用的颜色单词互动课件。\n\n生成设置：单关卡学练融合，练习模式，可多次尝试，采用明亮卡片风。\n课堂玩法：彩虹修复师。学生听到或看到英文颜色单词后，从颜色卡片中选择正确颜色，并拖到彩虹缺口。\n互动流程：播放颜色单词 → 选择颜色卡 → 拖到彩虹缺口 → 点亮彩虹 → 播放英文发音 → 获得星星奖励。\n题目内容：red、blue、yellow、green、orange、purple，分 3 轮递进：看词选色、听音选色、多颜色混合挑战。\n反馈方式：答对时彩虹点亮并朗读单词，答错时正确颜色边缘轻闪提示，允许再次尝试。`,
    };
  }

  if (/口算|计算|20|数学|加减/.test(question)) {
    return {
      title: '建议用“口算赛车”做熟练度练习',
      body: '口算适合用轻竞技包装，但题目区域要始终清楚。赛车前进、连击加速、维修提示这些反馈能让学生愿意多做几轮。',
      ideas: ['三关递进', '连击加速', '错题维修站', '终点通关反馈'],
      finalPrompt: `做一个小学低年级 20 以内加减法口算互动课件。\n\n生成设置：多关卡学练融合，练习模式，采用逻辑风格 + 轻竞技进度反馈。\n课堂玩法：口算赛车。学生每答对一道题，赛车向前加速；连续答对触发连击加速，答错进入维修提示。\n互动流程：出现口算题 → 选择答案 → 赛车前进 → 连击加速 → 到达终点 → 解锁下一关。\n题目内容：3 关递进，每关 6 道题：第一关 10 以内加减，第二关 20 以内不进退位，第三关 20 以内混合计算。\n反馈方式：答对赛车前进并获得星星，答错展示简单计算提示，允许重新选择。`,
    };
  }

  if (/古诗|诗句|背诵|排序|语文/.test(question)) {
    return {
      title: '建议用“诗句小路排序”承接背诵',
      body: '古诗不要只做填空，可以先让学生把诗句顺序拼回来。排序完成后再完整朗读，能自然衔接理解和背诵。',
      ideas: ['诗句拖拽排序', '关键词提示', '月光进度', '完成后整诗朗读'],
      finalPrompt: `做一个小学语文古诗背诵前的互动课件，内容以《静夜思》为例。\n\n生成设置：单关卡学练融合，练习模式，采用温和国风课堂风。\n课堂玩法：诗句小路排序。学生把打乱的诗句拖回正确顺序，每排对一句，小路或月光点亮一步。\n互动流程：展示打乱诗句 → 拖拽排序 → 自动校验 → 点亮进度 → 完整展示古诗 → 播放朗读。\n题目内容：床前明月光、疑是地上霜、举头望明月、低头思故乡；可加入关键词“明月、霜、举头、低头”作为提示。\n反馈方式：排序正确时诗句吸附并点亮，错误时提示相邻诗句关系，不直接打断学生操作。`,
    };
  }

  return {
    title: '建议先选“图片找词”或“单词图片配对”',
    body: '低龄英语启蒙要减少文字压力，用图片、声音和即时反馈承接学习目标。每轮操作越短，课堂参与越稳定。',
    ideas: ['图片大目标', '听音点击', '配对消除', '星星奖励'],
    finalPrompt: `做一个 3-6 岁儿童使用的英语启蒙互动课件。\n\n生成设置：微关卡学练融合，练习模式，采用英语启蒙风，按钮和图片要适合大屏点击。\n课堂玩法：图片找词。系统播放或展示一个英文单词，学生在图片区域找到对应目标并点击。\n互动流程：播放单词 → 观察图片 → 点击目标 → 播放发音 → 星星奖励 → 进入下一轮。\n题目内容：围绕动物、颜色或水果生成 6 个基础词，每轮只出现一个目标词。\n反馈方式：答对时目标高亮并播放发音，答错时正确目标轮廓轻闪，允许再次尝试。`,
  };
};

export default function InspirationAssistant({ onApplyPrompt }: InspirationAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '你可以把一个很粗的想法丢给我，比如“颜色单词”“口算复习”“古诗背诵”。我会帮你找适合课堂的互动方式，并整理成可直接生成课件的提示词。',
    },
  ]);

  const latestReply = useMemo(() => [...messages].reverse().find(item => item.reply)?.reply, [messages]);

  const sendQuestion = (question: string) => {
    const value = question.trim();
    if (!value) return;
    const reply = buildReply(value);
    setMessages(prev => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', text: value },
      {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: reply.body,
        reply,
      },
    ]);
    setInput('');
  };

  const applyPrompt = (prompt: string) => {
    onApplyPrompt(prompt);
    setOpen(false);
  };

  return (
    <>
      <button type="button" style={styles.fab} onClick={() => setOpen(true)}>
        <Sparkles size={18} />
        灵感助手
      </button>

      {open && (
        <div style={styles.overlay}>
          <style>{`
            .assistant-scroll {
              scrollbar-width: none;
            }
            .assistant-scroll::-webkit-scrollbar {
              display: none;
            }
            .assistant-slim-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(14, 116, 144, 0.24) transparent;
            }
            .assistant-slim-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .assistant-slim-scroll::-webkit-scrollbar-thumb {
              background: rgba(14, 116, 144, 0.18);
              border-radius: 999px;
            }
          `}</style>
          <div style={styles.panel}>
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <span style={styles.logo}><BrainCircuit size={18} /></span>
                <div>
                  <div style={styles.title}>灵感助手</div>
                  <div style={styles.subtitle}>聊出玩法，再带回输入框生成课件</div>
                </div>
              </div>
              <div style={styles.statusPill}>
                <span style={styles.statusDot} />
                正在待命
              </div>
              <button type="button" style={styles.closeBtn} onClick={() => setOpen(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            <div style={styles.agentStrip}>
              <span style={styles.agentChip}><Lightbulb size={12} />找玩法</span>
              <span style={styles.agentChip}><Sparkles size={12} />补提示词</span>
              <span style={styles.agentChip}><Wand2 size={12} />带回输入框</span>
            </div>

            <div className="assistant-scroll" style={styles.quickRow}>
              {quickQuestions.map(question => (
                <button key={question} type="button" style={styles.quickChip} onClick={() => sendQuestion(question)}>
                  {question}
                </button>
              ))}
            </div>

            <div className="assistant-slim-scroll" style={styles.messageList}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    ...styles.messageRow,
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {message.role === 'assistant' && (
                    <span style={styles.avatar}><Bot size={15} /></span>
                  )}
                  <div style={message.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                    {message.reply && (
                      <div style={styles.replyCard}>
                        <div style={styles.replyTitle}>{message.reply.title}</div>
                        <div style={styles.ideaRow}>
                          {message.reply.ideas.map(idea => (
                            <span key={idea} style={styles.ideaChip}>{idea}</span>
                          ))}
                        </div>
                        <div className="assistant-slim-scroll" style={styles.promptPreview}>{message.reply.finalPrompt}</div>
                        <button type="button" style={styles.applyBtn} onClick={() => applyPrompt(message.reply!.finalPrompt)}>
                          <Wand2 size={14} />
                          带回输入框
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {latestReply && (
              <div style={styles.footerHint}>
                已整理出一版可生成提示词，可以继续追问，也可以直接带回输入框。
              </div>
            )}

            <div style={styles.inputBar}>
              <MessageCircle size={17} color="#0F766E" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') sendQuestion(input);
                }}
                placeholder="例如：一年级形状认知，适合什么互动？"
                style={styles.input}
              />
              <button type="button" style={styles.sendBtn} onClick={() => sendQuestion(input)} aria-label="发送">
                <SendHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed',
    right: 28,
    bottom: 28,
    zIndex: 1200,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 44,
    padding: '0 17px',
    border: '1px solid rgba(0, 201, 167, 0.28)',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 900,
    boxShadow: '0 18px 42px rgba(0, 168, 232, 0.22)',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2200,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    padding: 24,
    background: 'rgba(15, 23, 42, 0.24)',
    backdropFilter: 'blur(5px)',
  },
  panel: {
    width: 492,
    maxWidth: 'calc(100vw - 48px)',
    height: '100%',
    maxHeight: 720,
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 22,
    background: 'linear-gradient(180deg, #FFFFFF, #F8FEFF 44%, #F0FDF9)',
    border: '1px solid rgba(103, 232, 249, 0.62)',
    boxShadow: '0 30px 90px rgba(15, 23, 42, 0.28), inset 0 1px 0 rgba(255,255,255,0.95)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px',
    background: 'linear-gradient(135deg, #ECFEFF, #F0FDF9 58%, #EFF6FF)',
    borderBottom: '1px solid rgba(214, 243, 239, 0.9)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#047857',
    background: 'linear-gradient(135deg, #CCFBF1, #E0F2FE)',
    boxShadow: '0 10px 24px rgba(0, 201, 167, 0.16)',
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: 950,
  },
  subtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #D6F3EF',
    background: '#FFFFFF',
    color: '#64748B',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid #D6F3EF',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 850,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#00C9A7',
    boxShadow: '0 0 0 4px rgba(0, 201, 167, 0.12)',
  },
  agentStrip: {
    display: 'flex',
    gap: 8,
    padding: '11px 16px 0',
    background: 'rgba(255,255,255,0.56)',
  },
  agentChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 26,
    padding: '0 9px',
    borderRadius: 999,
    background: '#F0FDF9',
    color: '#0F766E',
    border: '1px solid #CFFAFE',
    fontSize: 11,
    fontWeight: 850,
  },
  quickRow: {
    display: 'flex',
    gap: 8,
    padding: '10px 16px 13px',
    overflowX: 'auto',
    borderBottom: '1px solid rgba(226, 232, 240, 0.72)',
    background: 'rgba(255,255,255,0.56)',
  },
  quickChip: {
    height: 30,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid rgba(0, 201, 167, 0.22)',
    background: 'rgba(255,255,255,0.76)',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: 'linear-gradient(180deg, rgba(248,250,252,0.92), rgba(240,253,249,0.82))',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#047857',
    background: 'linear-gradient(135deg, #CCFBF1, #E0F2FE)',
  },
  assistantBubble: {
    maxWidth: '88%',
    padding: '13px 14px',
    borderRadius: '15px 15px 15px 5px',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(207,250,254,0.95)',
    color: '#334155',
    fontSize: 13,
    lineHeight: 1.58,
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)',
  },
  userBubble: {
    maxWidth: '82%',
    padding: '10px 12px',
    borderRadius: '13px 13px 4px 13px',
    background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 1.55,
  },
  replyCard: {
    marginTop: 10,
    padding: 11,
    borderRadius: 11,
    background: 'linear-gradient(180deg, #FFFFFF, #F8FAFC)',
    border: '1px solid #D6F3EF',
    boxShadow: '0 8px 20px rgba(14, 165, 233, 0.06)',
  },
  replyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 8,
  },
  ideaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 9,
  },
  ideaChip: {
    height: 22,
    padding: '0 7px',
    borderRadius: 999,
    background: '#ECFEFF',
    color: '#0E7490',
    fontSize: 11,
    fontWeight: 850,
    lineHeight: '22px',
  },
  promptPreview: {
    maxHeight: 140,
    overflowY: 'auto',
    padding: 10,
    borderRadius: 9,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  },
  applyBtn: {
    marginTop: 10,
    width: '100%',
    height: 34,
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #00C9A7, #00A8E8)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  footerHint: {
    padding: '8px 16px',
    color: '#0F766E',
    background: '#F0FDF9',
    borderTop: '1px solid #D6F3EF',
    fontSize: 12,
    fontWeight: 750,
  },
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderTop: '1px solid #E2E8F0',
    background: 'rgba(255,255,255,0.92)',
  },
  input: {
    flex: 1,
    height: 36,
    border: '1px solid #BDEFE8',
    borderRadius: 12,
    padding: '0 10px',
    outline: 'none',
    color: '#0F172A',
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: 'none',
    background: '#00C9A7',
    color: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
};
