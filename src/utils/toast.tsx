import ReactDOM from 'react-dom/client';

let container: HTMLDivElement | null = null;
let root: ReactDOM.Root | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  }
  return { container, root: root! };
}

function ToastUI({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed',
      top: 40,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      padding: '10px 24px',
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      fontSize: 14,
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'toastIn 0.2s ease',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      {message}
    </div>
  );
}

export default function toast(message: string, duration = 2000) {
  const { root } = getContainer();
  if (timer) clearTimeout(timer);
  root.render(<ToastUI message={message} />);
  timer = setTimeout(() => {
    root.render(null);
    timer = null;
  }, duration);
}
