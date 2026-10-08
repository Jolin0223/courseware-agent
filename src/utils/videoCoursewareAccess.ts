/** UI entitlement adapter. Production should set this from the signed-in user's feature grants. */
export function hasVideoCoursewareAccess(): boolean {
  const granted = (window as Window & { __COURSEWARE_FEATURE_ACCESS__?: { videoCourseware?: boolean } })
    .__COURSEWARE_FEATURE_ACCESS__?.videoCourseware ?? true;
  if (import.meta.env.DEV) {
    const demo = new URLSearchParams(window.location.search).get('demoVideoAccess');
    if (demo === 'on') return true;
    if (demo === 'off') return false;
  }
  return granted;
}
