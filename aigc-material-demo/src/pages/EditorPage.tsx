import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import ModeSwitcher from '../components/Layout/ModeSwitcher';
import toast from '../utils/toast';

export default function EditorPage() {
  const {
    openEditorDrawer,
    insertedCoursewares,
    triggerVersionUpdate,
    updateInsertedCourseware,
    removeInsertedCourseware,
  } = useUIStore();

  const hasInserted = insertedCoursewares.length > 0;
  const hasUpdate = insertedCoursewares.some(c => c.hasUpdate);
  const hasSourceDeleted = insertedCoursewares.some(c => c.isSourceDeleted);

  const bgImage = !hasInserted
    ? '/editor-assets/editor-overview.png'
    : hasUpdate
      ? '/editor-assets/inserted-style.png'
      : '/editor-assets/editor-bg.png';

  useEffect(() => {
    if (!hasInserted) return;
    const latest = insertedCoursewares[insertedCoursewares.length - 1];
    if (latest.hasUpdate || latest.isSourceDeleted) return;
    const timer = setTimeout(() => {
      triggerVersionUpdate(latest.id, 'v1.1');
      toast('互动课件有新版本可用，请查看编辑器');
    }, 8000);
    return () => clearTimeout(timer);
  }, [insertedCoursewares.length]);

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    const toUpdate = insertedCoursewares.find(c => c.hasUpdate);
    if (toUpdate) {
      updateInsertedCourseware(toUpdate.id, {
        version: toUpdate.latestVersion || toUpdate.version,
      });
      toast('课件已同步至最新版本~');
    }
  };

  return (
    <div
      onClick={hasUpdate ? handleSync : openEditorDrawer}
      style={{
        width: '100vw',
        height: '100vh',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <img
        src={bgImage}
        alt="课件编辑器"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top left',
          display: 'block',
        }}
      />

      {/* 模式切换 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 12, right: 16, zIndex: 10 }}
      >
        <ModeSwitcher />
      </div>

      {/* 源课件已下架提示 */}
      {hasSourceDeleted && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: '#FFF7ED',
            border: '1px solid #FDBA74',
            borderRadius: 12,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            maxWidth: 520,
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 14, color: '#9A3412', flex: 1 }}>
            源互动课件已被作者下架，当前为缓存版本，无法同步更新
          </span>
          <button
            onClick={() => {
              const deleted = insertedCoursewares.find(c => c.isSourceDeleted);
              if (deleted) {
                removeInsertedCourseware(deleted.id);
                toast('已移除下架课件');
              }
            }}
            style={{
              padding: '6px 16px',
              background: '#fff',
              color: '#EA580C',
              border: '1px solid #FDBA74',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              outline: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            移除课件
          </button>
        </div>
      )}
    </div>
  );
}
