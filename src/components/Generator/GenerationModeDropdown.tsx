import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Sparkles, SlidersHorizontal } from 'lucide-react';
import { generationModeOptions } from '../../data/augustDemoData';
import './augustDemo.css';

interface GenerationModeDropdownProps {
  value?: string;
  onChange: (modeId: string) => void;
  disabled?: boolean;
  variant?: 'adjust' | 'input';
}

export default function GenerationModeDropdown({
  value,
  onChange,
  disabled,
  variant = 'adjust',
}: GenerationModeDropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const selectedMode = generationModeOptions.find(mode => mode.id === value)
    || generationModeOptions.find(mode => mode.id === 'smart')
    || generationModeOptions[0];

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.right - width), Math.max(12, window.innerWidth - width - 12));
    const openUpward = variant === 'adjust' && rect.top > 250;
    setPopoverStyle({
      left,
      width,
      top: openUpward ? undefined : rect.bottom + 6,
      bottom: openUpward ? window.innerHeight - rect.top + 6 : undefined,
    });
  }, [variant]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handlePositionChange = () => updatePosition();
    updatePosition();
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handlePositionChange);
    window.addEventListener('scroll', handlePositionChange, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handlePositionChange);
      window.removeEventListener('scroll', handlePositionChange, true);
    };
  }, [open, updatePosition]);

  return (
    <div className={variant === 'input' ? 'aug-input-mode-control' : 'aug-adjust-mode-control'}>
      <button
        ref={triggerRef}
        type="button"
        className={variant === 'input' ? 'aug-input-mode-trigger' : 'aug-adjust-mode-trigger'}
        disabled={disabled}
        onClick={() => {
          if (!open) updatePosition();
          setOpen(current => !current);
        }}
        aria-label={variant === 'input' ? `生成模式：${selectedMode.name}` : `生成设置，当前${selectedMode.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {variant === 'input' ? <Sparkles size={15} /> : <SlidersHorizontal size={14} />}
        <span>{variant === 'input' ? selectedMode.name : '生成设置'}</span>
        {variant === 'input' && <ChevronDown size={13} />}
      </button>
      {open && createPortal(
        <div
          ref={popoverRef}
          className="aug-mode-popover aug-adjust-mode-popover"
          role="menu"
          aria-label={variant === 'input' ? '选择生成模式' : '调整风格生成模式'}
          style={popoverStyle}
        >
          {variant === 'adjust' && (
            <div className="aug-adjust-mode-popover-header">
              <span>
                <b>生成模式</b>
                <small>默认沿用当前课件，无需修改</small>
              </span>
              <em>{selectedMode.name}</em>
            </div>
          )}
          {generationModeOptions.map(mode => {
            const selected = mode.id === selectedMode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={selected ? 'is-selected' : ''}
                onClick={() => {
                  onChange(mode.id);
                  setOpen(false);
                }}
                role="menuitemradio"
                aria-checked={selected}
              >
                <span>
                  <b>{mode.name}</b>
                  <small>{mode.description}</small>
                </span>
                <em>{mode.tag}</em>
                {selected && <Check size={15} />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
