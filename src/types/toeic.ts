export type GrammarCategory = 
  | '품사 자리'
  | '동사 (수/시제/태)'
  | '동사 시제·수일치·태'
  | '전치사 vs 접속사'
  | '대명사'
  | '형용사 & 부사'
  | 'to부정사 & 동명사'
  | '상관접속사 & 어휘'
  | '초급 빈출 어휘';

export interface Question {
  id: string;
  category: GrammarCategory;
  question: string; // The English sentence with blank '_____'
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  koreanTranslation: string;
  explanation: {
    coreRule: string; // 3초 풀이 핵심 공식
    detailed: string; // 상세 해설
    vocabulary: { word: string; meaning: string }[];
    distractors?: string; // 왜 오답인지 (선택지 분석)
  };
  difficulty: '기초 500' | '입문 600' | '도약 650';
}

export interface AnswerRecord {
  questionId: string;
  userAnswer: 'A' | 'B' | 'C' | 'D' | 'TIMEOUT';
  isCorrect: boolean;
  timeSpentSec: number;
  question: Question;
}

export interface WrongNoteItem {
  id: string;
  questionId: string;
  question: Question;
  userAnswer: 'A' | 'B' | 'C' | 'D' | 'TIMEOUT';
  dateAdded: string; // ISO string
  userMemo: string;
  isMastered: boolean;
  reviewCount: number;
  lastTestedAt?: string;
}

export interface UserProfile {
  nickname: string;
  createdAt: string;
  totalStudyTimeSec: number; // 총 누적 학습 시간(초)
  questionsAttempted: number; // 총 풀이 시도 문항 수
  correctCount: number; // 총 정답 수
  wrongCount: number; // 총 오답 수
  setsOf10Completed: number; // 완료한 10문제 세트 수
  testsCompleted: number;
  soundEnabled: boolean;
}

export interface GoogleSheetConfig {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'failed';
  lastSyncError?: string;
}

export interface GoogleSheetSyncPayload {
  student_name?: string;
  total_study_time?: number;
  questions_solved?: number;
  correct_answers?: number;
  sets_completed?: number;
  accuracy?: number;

  // Backwards compatibility
  nickname: string;
  timestamp: string;
  study_time_sec: number;
  correct_count: number;
  wrong_count: number;
  sets_of_10_completed?: number;
  questions_attempted?: number;
}

export type QuizMode = 'set1' | 'set2' | 'set3' | 'random10' | 'wrongReview';

