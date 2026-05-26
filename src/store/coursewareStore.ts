import { create } from 'zustand';
import type { Courseware } from '../types';
import { mockCoursewares } from '../data/mockCoursewares';

interface CoursewareState {
  coursewares: Courseware[];
  filterSubject: string;
  filterGrade: string;
  filterType: string;
  sortBy: string;
  
  // Actions
  addCourseware: (courseware: Courseware) => void;
  updateCourseware: (id: number, updates: Partial<Courseware>) => void;
  deleteCourseware: (id: number) => void;
  setFilter: (key: string, value: string) => void;
  setSortBy: (sortBy: string) => void;
  getFilteredCoursewares: (showOwnOnly?: boolean) => Courseware[];
  getInspirationCoursewares: () => Courseware[];
}

export const useCoursewareStore = create<CoursewareState>((set, get) => ({
  coursewares: mockCoursewares,
  filterSubject: '全部',
  filterGrade: '全部',
  filterType: '全部',
  sortBy: '最热',

  addCourseware: (courseware) => set((state) => ({
    coursewares: [courseware, ...state.coursewares],
  })),

  updateCourseware: (id, updates) => set((state) => ({
    coursewares: state.coursewares.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),

  deleteCourseware: (id) => set((state) => ({
    coursewares: state.coursewares.filter((c) => c.id !== id),
  })),

  setFilter: (key, value) => set({ [`filter${key.charAt(0).toUpperCase() + key.slice(1)}`]: value }),

  setSortBy: (sortBy) => set({ sortBy }),

  getFilteredCoursewares: (showOwnOnly = false) => {
    const { coursewares, filterSubject, filterGrade, filterType, sortBy } = get();
    
    let filtered = [...coursewares];
    
    if (showOwnOnly) {
      filtered = filtered.filter((c) => c.isOwn);
    }
    
    if (filterSubject !== '全部') {
      filtered = filtered.filter((c) => c.subject === filterSubject);
    }
    if (filterGrade !== '全部') {
      filtered = filtered.filter((c) => c.grade === filterGrade);
    }
    if (filterType !== '全部') {
      filtered = filtered.filter((c) => c.type === filterType);
    }
    
    // Sort
    switch (sortBy) {
      case '最热':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case '最新':
        filtered.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
        break;
      case '最多收藏':
        filtered.sort((a, b) => b.favorites - a.favorites);
        break;
      case '最多下载':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
    }
    
    return filtered;
  },

  getInspirationCoursewares: () => {
    const { coursewares, sortBy } = get();
    let sorted = [...coursewares];
    
    switch (sortBy) {
      case '最热':
        sorted.sort((a, b) => b.views - a.views);
        break;
      case '最新':
        sorted.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
        break;
      case '最多收藏':
        sorted.sort((a, b) => b.favorites - a.favorites);
        break;
      case '最多下载':
        sorted.sort((a, b) => b.likes - a.likes);
        break;
    }
    
    return sorted;
  },
}));
