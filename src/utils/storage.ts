import { Question, UserProfile, WrongNoteItem } from '../types/toeic';

const PROFILE_KEY = 'toeic_user_profile';
const WRONG_NOTES_KEY = 'toeic_wrong_notes';
const TEST_HISTORY_KEY = 'toeic_test_history';

export interface TestHistoryEntry {
  id: string;
  date: string;
  nickname: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  avgTimeSec: number;
  studyTimeSec: number;
  mode: string;
  is10QuestionSet: boolean;
}

export const Storage = {
  getProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(PROFILE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Ensure defaults for all required metrics
      return {
        nickname: parsed.nickname || '토익꿈나무',
        createdAt: parsed.createdAt || new Date().toISOString(),
        totalStudyTimeSec: Number(parsed.totalStudyTimeSec || 0),
        questionsAttempted: Number(parsed.questionsAttempted || parsed.totalSolved || 0),
        correctCount: Number(parsed.correctCount || parsed.totalCorrect || 0),
        wrongCount: Number(parsed.wrongCount !== undefined ? parsed.wrongCount : ((parsed.totalSolved || 0) - (parsed.totalCorrect || 0))),
        setsOf10Completed: Number(parsed.setsOf10Completed || 0),
        testsCompleted: Number(parsed.testsCompleted || 0),
        soundEnabled: parsed.soundEnabled !== false,
      };
    } catch {
      return null;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  updateStudySession(params: {
    timeSpentSec: number;
    attemptedCount: number;
    correctCount: number;
    wrongCount: number;
    completedSetOf10: boolean;
  }): UserProfile {
    const current = this.getProfile() || {
      nickname: '토익꿈나무',
      createdAt: new Date().toISOString(),
      totalStudyTimeSec: 0,
      questionsAttempted: 0,
      correctCount: 0,
      wrongCount: 0,
      setsOf10Completed: 0,
      testsCompleted: 0,
      soundEnabled: true,
    };

    const updated: UserProfile = {
      ...current,
      totalStudyTimeSec: current.totalStudyTimeSec + Math.round(params.timeSpentSec),
      questionsAttempted: current.questionsAttempted + params.attemptedCount,
      correctCount: current.correctCount + params.correctCount,
      wrongCount: current.wrongCount + params.wrongCount,
      setsOf10Completed: current.setsOf10Completed + (params.completedSetOf10 ? 1 : 0),
      testsCompleted: current.testsCompleted + 1,
    };

    this.saveProfile(updated);
    return updated;
  },

  getWrongNotes(): WrongNoteItem[] {
    try {
      const data = localStorage.getItem(WRONG_NOTES_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  /**
   * Automatically adds or updates an incorrect or timed-out question in the Wrong Answer Notebook.
   * If it already exists, updates the review count, timestamp, and user answer.
   */
  addWrongNote(question: Question, userAnswer: 'A' | 'B' | 'C' | 'D' | 'TIMEOUT'): WrongNoteItem {
    const notes = this.getWrongNotes();
    const existingIndex = notes.findIndex(n => n.questionId === question.id);

    let updatedNote: WrongNoteItem;

    if (existingIndex >= 0) {
      const existing = notes[existingIndex];
      updatedNote = {
        ...existing,
        userAnswer,
        reviewCount: existing.reviewCount + 1,
        isMastered: false, // reset mastered status since they got it wrong again
        lastTestedAt: new Date().toISOString(),
      };
      notes[existingIndex] = updatedNote;
    } else {
      updatedNote = {
        id: `wn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        questionId: question.id,
        question,
        userAnswer,
        dateAdded: new Date().toISOString(),
        userMemo: '',
        isMastered: false,
        reviewCount: 1,
        lastTestedAt: new Date().toISOString(),
      };
      notes.unshift(updatedNote);
    }

    try {
      localStorage.setItem(WRONG_NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save wrong notes', e);
    }

    return updatedNote;
  },

  updateWrongNoteMemo(id: string, memo: string): void {
    const notes = this.getWrongNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index >= 0) {
      notes[index].userMemo = memo;
      try {
        localStorage.setItem(WRONG_NOTES_KEY, JSON.stringify(notes));
      } catch (e) {
        console.error('Failed to save wrong note memo', e);
      }
    }
  },

  toggleWrongNoteMastered(id: string): boolean {
    const notes = this.getWrongNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index >= 0) {
      notes[index].isMastered = !notes[index].isMastered;
      try {
        localStorage.setItem(WRONG_NOTES_KEY, JSON.stringify(notes));
      } catch (e) {
        console.error('Failed to update mastered state', e);
      }
      return notes[index].isMastered;
    }
    return false;
  },

  markQuestionAsMastered(questionId: string): void {
    const notes = this.getWrongNotes();
    const index = notes.findIndex(n => n.questionId === questionId);
    if (index >= 0) {
      notes[index].isMastered = true;
      try {
        localStorage.setItem(WRONG_NOTES_KEY, JSON.stringify(notes));
      } catch (e) {
        console.error('Failed to mark mastered', e);
      }
    }
  },

  deleteWrongNote(id: string): void {
    const notes = this.getWrongNotes().filter(n => n.id !== id);
    try {
      localStorage.setItem(WRONG_NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to delete wrong note', e);
    }
  },

  clearAllWrongNotes(): void {
    try {
      localStorage.removeItem(WRONG_NOTES_KEY);
    } catch (e) {
      console.error('Failed to clear wrong notes', e);
    }
  },

  saveTestHistory(entry: TestHistoryEntry): void {
    try {
      const history: TestHistoryEntry[] = JSON.parse(localStorage.getItem(TEST_HISTORY_KEY) || '[]');
      history.unshift(entry);
      // keep latest 20 tests
      const trimmed = history.slice(0, 20);
      localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save test history', e);
    }
  },

  getTestHistory(): TestHistoryEntry[] {
    try {
      return JSON.parse(localStorage.getItem(TEST_HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  },
};
