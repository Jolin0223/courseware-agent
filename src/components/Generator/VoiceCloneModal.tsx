import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  FileAudio,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Upload,
  X,
} from 'lucide-react';

interface VoiceCloneModalProps {
  onClose: () => void;
  onComplete: () => void;
  personName?: string;
}

type CloneStep = 1 | 2 | 3;
type CloneMethod = 'upload' | 'record';

interface CloneAudio {
  name: string;
  duration: number;
  method: CloneMethod;
  url?: string;
}

const AUTHORIZATION_SENTENCE = (name: string) => `我“${name}”，确认我的声音将会被新东方使用于创建合成版本语音。`;
const TRAINING_SENTENCE = '大家好，欢迎来到我的课堂。今天我们将一起探索新知识，请仔细观察、认真思考，让学习变得更有趣。';
const CLONE_STEPS: Array<{ number: CloneStep; label: string }> = [
  { number: 1, label: '上传授权录音文件' },
  { number: 2, label: '上传训练录音文件' },
  { number: 3, label: 'AI复刻声音' },
];

const formatTime = (seconds: number) => `00:${String(seconds).padStart(2, '0')}`;

export default function VoiceCloneModal({
  onClose,
  onComplete,
  personName = '陈佳玲',
}: VoiceCloneModalProps) {
  const [step, setStep] = useState<CloneStep>(1);
  const [method, setMethod] = useState<CloneMethod>('upload');
  const [consent, setConsent] = useState(false);
  const [audioByStep, setAudioByStep] = useState<Partial<Record<1 | 2, CloneAudio>>>({});
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlsRef = useRef<string[]>([]);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => {
      setRecordingSeconds(seconds => {
        if (seconds >= 14) {
          setRecording(false);
          setAudioByStep(current => ({
            ...current,
            [step]: {
              name: step === 1 ? '授权录音' : '训练录音',
              duration: 15,
              method: 'record',
            },
          }));
          return 15;
        }
        return seconds + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording, step]);

  useEffect(() => {
    if (step !== 3) return undefined;
    const timer = window.setTimeout(onComplete, 1800);
    return () => window.clearTimeout(timer);
  }, [onComplete, step]);

  useEffect(() => () => {
    audioUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const currentAudio = step === 1 || step === 2 ? audioByStep[step] : undefined;
  const sentence = step === 1 ? AUTHORIZATION_SENTENCE(personName) : TRAINING_SENTENCE;
  const canContinue = step === 1
    ? Boolean(currentAudio && consent)
    : step === 2
      ? Boolean(currentAudio)
      : false;

  const changeMethod = (nextMethod: CloneMethod) => {
    if (recording) setRecording(false);
    stopAudio();
    setMethod(nextMethod);
    setUploadError('');
    setRecordingSeconds(0);
    if (step < 3) {
      setAudioByStep(current => ({ ...current, [step]: undefined }));
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || step === 3) return;
    const validExtension = /\.(mp3|m4a|wav)$/i.test(file.name);
    if (!file.type.startsWith('audio/') && !validExtension) {
      setUploadError('请上传 wav、mp3 或 m4a 音频文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('音频文件不能超过 10M');
      return;
    }
    stopAudio();
    const url = URL.createObjectURL(file);
    audioUrlsRef.current.push(url);
    setUploadError('');
    setAudioByStep(current => ({
      ...current,
      [step]: { name: file.name, duration: 0, method: 'upload', url },
    }));
  };

  const startRecording = () => {
    stopAudio();
    setUploadError('');
    setRecordingSeconds(0);
    setRecording(true);
    if (step < 3) setAudioByStep(current => ({ ...current, [step]: undefined }));
  };

  const stopRecording = () => {
    if (step === 3) return;
    const duration = Math.max(recordingSeconds, 4);
    setRecording(false);
    setRecordingSeconds(duration);
    setAudioByStep(current => ({
      ...current,
      [step]: {
        name: step === 1 ? '授权录音' : '训练录音',
        duration,
        method: 'record',
      },
    }));
  };

  const clearCurrentAudio = () => {
    stopAudio();
    setRecording(false);
    setRecordingSeconds(0);
    if (step < 3) setAudioByStep(current => ({ ...current, [step]: undefined }));
  };

  const previewCurrentAudio = () => {
    if (!currentAudio?.url) return;
    if (playing) {
      stopAudio();
      return;
    }
    const audio = new Audio(currentAudio.url);
    audioRef.current = audio;
    audio.onended = stopAudio;
    audio.onerror = stopAudio;
    setPlaying(true);
    void audio.play();
  };

  const goNext = () => {
    if (!canContinue) return;
    stopAudio();
    setRecording(false);
    setRecordingSeconds(0);
    setUploadError('');
    setStep(current => current === 1 ? 2 : 3);
  };

  const goBack = () => {
    stopAudio();
    setRecording(false);
    setRecordingSeconds(0);
    setUploadError('');
    setStep(1);
  };

  const renderCapture = () => {
    if (currentAudio) {
      return (
        <div className="aug-voice-clone-audio">
          <button
            type="button"
            className="aug-voice-clone-audio-play"
            onClick={previewCurrentAudio}
            disabled={!currentAudio.url}
            aria-label={currentAudio.url ? '试听录音' : '录音已完成'}
          >
            {currentAudio.url
              ? playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />
              : <Check size={16} />}
          </button>
          <span>
            <b>{currentAudio.name}</b>
            <small>{currentAudio.method === 'upload' ? '已上传' : `${formatTime(currentAudio.duration)} · 录音已完成`}</small>
          </span>
          <button type="button" className="aug-voice-clone-audio-reset" onClick={clearCurrentAudio} aria-label="重新录制或上传">
            <RotateCcw size={15} />
          </button>
        </div>
      );
    }

    if (method === 'upload') {
      return (
        <>
          <button type="button" className="aug-voice-clone-upload" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />上传录音文件
          </button>
          <input
            ref={fileInputRef}
            className="aug-clone-file-input"
            type="file"
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,.mp3,.m4a,.wav"
            onChange={handleFileChange}
          />
        </>
      );
    }

    if (recording) {
      return (
        <div className="aug-voice-clone-recording">
          <div className="aug-recording-status"><span /><b>正在录制</b><em>{formatTime(recordingSeconds)}</em></div>
          <div className="aug-recording-wave" aria-hidden="true">
            {Array.from({ length: 25 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 35}ms` }} />)}
          </div>
          <button type="button" className="aug-clone-stop" onClick={stopRecording}><Square size={14} fill="currentColor" />结束录制</button>
        </div>
      );
    }

    return (
      <button type="button" className="aug-voice-clone-record" onClick={startRecording}>
        <span><Mic size={22} /></span>
        <b>点击录音</b>
      </button>
    );
  };

  const dialog = (
    <div className="aug-modal-mask aug-voice-clone-mask" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="aug-voice-clone-modal" role="dialog" aria-modal="true" aria-labelledby="voice-clone-title">
        <header className="aug-voice-clone-header">
          <h2 id="voice-clone-title">声音复刻</h2>
          <button type="button" className="aug-icon-button" onClick={onClose} aria-label="关闭声音复刻"><X size={19} /></button>
        </header>

        <div className="aug-voice-clone-body">
          {step < 3 && (
            <div className="aug-voice-clone-method" role="tablist" aria-label="录音方式">
              <button type="button" role="tab" aria-selected={method === 'upload'} className={method === 'upload' ? 'is-active' : ''} onClick={() => changeMethod('upload')}>上传声音文件</button>
              <button type="button" role="tab" aria-selected={method === 'record'} className={method === 'record' ? 'is-active' : ''} onClick={() => changeMethod('record')}>录制声音文件</button>
            </div>
          )}

          <ol className="aug-voice-clone-stepper" aria-label="声音复刻进度">
            {CLONE_STEPS.map(item => (
              <li key={item.number} className={`${step === item.number ? 'is-active' : ''} ${step > item.number ? 'is-complete' : ''}`}>
                <span>{step > item.number ? <Check size={14} /> : item.number}</span>
                <b>{item.label}</b>
              </li>
            ))}
          </ol>

          {step < 3 ? (
            <div className="aug-voice-clone-workspace">
              <p className="aug-voice-clone-hint">
                {method === 'upload'
                  ? '请录制下方文本语音文件后上传，支持 wav、mp3、m4a 格式，大小 10M 以内'
                  : '请录制下方文本语音'}
              </p>
              <p className="aug-voice-clone-sentence">{sentence}</p>
              <div className="aug-voice-clone-capture">{renderCapture()}</div>
              {uploadError && <div className="aug-voice-clone-error">{uploadError}</div>}
              <div className="aug-voice-clone-requirements">
                <b>录音要求</b>
                <span>语言清晰流畅</span>
                <span>周围安静无噪声</span>
                <span>音量适中</span>
                <span>录音和文本完全匹配</span>
              </div>
            </div>
          ) : (
            <div className="aug-voice-clone-generating">
              <span><Loader2 size={30} /></span>
              <h3>AI 正在复刻声音</h3>
              <p>正在提取声纹和音色特征，完成后将自动返回“我的专属”。</p>
              <i><span /></i>
            </div>
          )}
        </div>

        <footer className="aug-voice-clone-footer">
          <div className="aug-voice-clone-footer-note">
            {step === 1 ? (
              <button
                type="button"
                className={`aug-voice-clone-consent ${consent ? 'is-checked' : ''}`}
                role="checkbox"
                aria-checked={consent}
                onClick={() => setConsent(checked => !checked)}
              >
                <span>{consent && <Check size={12} />}</span>
                <em>我已阅读并同意</em>
              </button>
            ) : step === 2 ? (
              <span><FileAudio size={15} />授权录音已完成</span>
            ) : (
              <span>AI 复刻中</span>
            )}
            {step === 1 && <a href="https://avatar.roombox.xdf.cn/#/userAgreement" target="_blank" rel="noreferrer">《新东方复刻授权协议》</a>}
          </div>
          <div className="aug-voice-clone-footer-actions">
            {step === 2 && <button type="button" className="aug-button-secondary" onClick={goBack}>上一步</button>}
            {step < 3 && <button type="button" className="aug-button-secondary" onClick={onClose}>取消</button>}
            {step < 3 && <button type="button" className="aug-voice-clone-next" disabled={!canContinue} onClick={goNext}>下一步</button>}
          </div>
        </footer>
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}
