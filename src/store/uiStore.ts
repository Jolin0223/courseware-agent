import { create } from 'zustand';

type AppMode = 'standalone' | 'embedded';

interface UIState {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  sidebarCollapsed: boolean;
  previewPanelOpen: boolean;
  previewCoursewareId: number | null;
  publishModalOpen: boolean;
  publishCoursewareId: number | null;
  editorDrawerOpen: boolean;
  insertedCoursewares: InsertedCourseware[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openPreview: (coursewareId: number) => void;
  closePreview: () => void;
  openPublishModal: (coursewareId: number) => void;
  closePublishModal: () => void;
  openEditorDrawer: () => void;
  closeEditorDrawer: () => void;
  insertCourseware: (cw: InsertedCourseware) => void;
  triggerVersionUpdate: (id: number, newVersion: string) => void;
  updateInsertedCourseware: (id: number, updates: Partial<InsertedCourseware>) => void;
  removeInsertedCourseware: (id: number) => void;
  markSourceDeleted: (id: number) => void;
  linkedCoursewareCount: number;
  setLinkedCoursewareCount: (count: number) => void;
}

export interface InsertedCourseware {
  id: number;
  title: string;
  version: string;
  latestVersion?: string;
  htmlContent?: string;
  slideIndex: number;
  hasUpdate?: boolean;
  isSourceDeleted?: boolean;
}

export const useUIStore = create<UIState>((set) => ({
  appMode: 'standalone',
  setAppMode: (mode) => set({ appMode: mode }),
  sidebarCollapsed: false,
  previewPanelOpen: false,
  previewCoursewareId: null,
  publishModalOpen: false,
  publishCoursewareId: null,
  editorDrawerOpen: false,
  insertedCoursewares: [],
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openPreview: (coursewareId) => set({ previewPanelOpen: true, previewCoursewareId: coursewareId }),
  closePreview: () => set({ previewPanelOpen: false, previewCoursewareId: null }),
  openPublishModal: (coursewareId) => set({ publishModalOpen: true, publishCoursewareId: coursewareId }),
  closePublishModal: () => set({ publishModalOpen: false, publishCoursewareId: null }),
  openEditorDrawer: () => set({ editorDrawerOpen: true }),
  closeEditorDrawer: () => set({ editorDrawerOpen: false }),
  insertCourseware: (cw) => set((state) => ({
    insertedCoursewares: [...state.insertedCoursewares, cw],
    editorDrawerOpen: false,
  })),
  triggerVersionUpdate: (id, newVersion) => set((state) => ({
    insertedCoursewares: state.insertedCoursewares.map(c =>
      c.id === id ? { ...c, hasUpdate: true, latestVersion: newVersion } : c
    ),
  })),
  updateInsertedCourseware: (id, updates) => set((state) => ({
    insertedCoursewares: state.insertedCoursewares.map(c =>
      c.id === id ? { ...c, ...updates, hasUpdate: false } : c
    ),
  })),
  removeInsertedCourseware: (id) => set((state) => ({
    insertedCoursewares: state.insertedCoursewares.filter(c => c.id !== id),
  })),
  markSourceDeleted: (id) => set((state) => ({
    insertedCoursewares: state.insertedCoursewares.map(c =>
      c.id === id ? { ...c, isSourceDeleted: true, hasUpdate: false } : c
    ),
  })),
  linkedCoursewareCount: 0,
  setLinkedCoursewareCount: (count) => set({ linkedCoursewareCount: count }),
}));
