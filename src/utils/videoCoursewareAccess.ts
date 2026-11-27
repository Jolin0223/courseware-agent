import { create } from 'zustand';

type AccessStatus = 'loading' | 'allowed' | 'denied' | 'error';
type FeatureGrants = { videoCourseware?: boolean };
type AccessHost = Window & {
  __COURSEWARE_FEATURE_ACCESS__?: FeatureGrants;
  __LOAD_COURSEWARE_FEATURE_ACCESS__?: () => Promise<FeatureGrants>;
};

const host = window as AccessHost;
// Review switches are confined to this standalone demo, never a host's real grants.
const demoHost = window.location.hostname === 'coursewareagent.chenjialing.cn'
  || window.location.hostname === 'courseware-agent.pages.dev'
  || window.location.hostname.endsWith('.courseware-agent.pages.dev');
const canSimulate = (import.meta.env.DEV || demoHost)
  && !host.__COURSEWARE_FEATURE_ACCESS__ && !host.__LOAD_COURSEWARE_FEATURE_ACCESS__;
const requestedDemo = canSimulate ? new URLSearchParams(window.location.search).get('demoVideoAccess') : null;
const demo = requestedDemo && ['on', 'off', 'slow', 'slow-on', 'slow-off', 'error', 'timeout'].includes(requestedDemo) ? requestedDemo : null;
const initialStatus: AccessStatus = demo === 'off' ? 'denied'
  : demo === 'on' ? 'allowed'
  : demo === 'slow' || demo === 'slow-on' || demo === 'error' || demo === 'slow-off' || demo === 'timeout' ? 'loading'
  : typeof host.__COURSEWARE_FEATURE_ACCESS__?.videoCourseware === 'boolean'
    ? host.__COURSEWARE_FEATURE_ACCESS__.videoCourseware ? 'allowed' : 'denied'
    : host.__LOAD_COURSEWARE_FEATURE_ACCESS__ ? 'loading'
    // This standalone product demo has no identity service. Its default is the demo account.
    : 'allowed';

export const useVideoAccess = create<{ status: AccessStatus }>(() => ({ status: initialStatus }));
let pending: Promise<void> | undefined;
let attempts = 0;

/** One request shared by all input instances; real grants are never cached in localStorage. */
export function loadVideoCoursewareAccess(): Promise<void> {
  if (pending) return pending;
  if (useVideoAccess.getState().status === 'allowed' || useVideoAccess.getState().status === 'denied') return Promise.resolve();
  attempts += 1;
  useVideoAccess.setState({ status: 'loading' });
  let timeoutTimer: ReturnType<typeof setTimeout>;
  pending = (async () => {
    try {
      const request: Promise<FeatureGrants> = demo
        ? new Promise((resolve, reject) => {
            if (demo === 'timeout') return;
            setTimeout(() => {
              if (demo === 'error' && attempts === 1) reject(new Error('Demo request failed'));
              else resolve({ videoCourseware: demo !== 'slow-off' });
            }, demo === 'error' ? 2000 : 6000);
          })
        : host.__LOAD_COURSEWARE_FEATURE_ACCESS__!();
      const grants = await Promise.race([
        request,
        new Promise<never>((_, reject) => { timeoutTimer = setTimeout(() => reject(new Error('Access timeout')), 10000); }),
      ]);
      if (typeof grants.videoCourseware !== 'boolean') throw new Error('Missing access result');
      useVideoAccess.setState({ status: grants.videoCourseware ? 'allowed' : 'denied' });
    } catch {
      useVideoAccess.setState({ status: 'error' });
    } finally {
      clearTimeout(timeoutTimer!);
    }
  })().finally(() => { pending = undefined; });
  return pending;
}

export function hasVideoCoursewareAccess(): boolean {
  return useVideoAccess.getState().status === 'allowed';
}
