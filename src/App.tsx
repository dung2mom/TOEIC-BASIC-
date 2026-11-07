import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WrongNoteItem, Question, AnswerRecord } from './types/toeic';
import { TOEIC_PART5_QUESTIONS } from './data/toeicQuestions';
import { Storage, TestHistoryEntry } from './utils/storage';
import { GoogleSheetService } from './utils/googleSheetSync';
import { Header } from './components/Header';
import { NicknameModal } from './components/NicknameModal';
import { HomeView } from './components/HomeView';
import { QuizView } from './components/QuizView';
import { ResultView } from './components/ResultView';
import { WrongNotesView } from './components/WrongNotesView';
import { CheatsheetView } from './components/CheatsheetView';
import { StatsView } from './components/StatsView';
import { PenTool, BookOpen, Sparkles, Award } from 'lucide-react';

type ViewMode = 'home' | 'quiz' | 'result' | 'wrongNotes' | 'cheatsheet' | 'stats';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    return Storage.getProfile() || {
      nickname: '',
      createdAt: new Date().toISOString(),
      totalStudyTimeSec: 0,
      questionsAttempted: 0,
      correctCount: 0,
      wrongCount: 0,
      setsOf10Completed: 0,
      testsCompleted: 0,
      soundEnabled: true,
    };
  });

  const [wrongNotes, setWrongNotes] = useState<WrongNoteItem[]>(() => {
    return Storage.getWrongNotes();
  });

  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState<boolean>(false);
  const [isFirstTimeNickname, setIsFirstTimeNickname] = useState<boolean>(false);

  // Active Quiz State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [quizModeTitle, setQuizModeTitle] = useState<string>('제 1세트 (10문제)');
  const [lastQuizRecords, setLastQuizRecords] = useState<AnswerRecord[]>([]);

  // Track recently used question IDs in session to prioritize unseen questions
  const seenQuestionIdsRef = useRef<Set<string>>(new Set<string>());

  const refreshWrongNotes = () => {
    setWrongNotes(Storage.getWrongNotes());
  };

  const refreshAllData = () => {
    const p = Storage.getProfile();
    if (p) setProfile(p);
    refreshWrongNotes();
  };

  const handleSaveNickname = (newNickname: string) => {
    const updated: UserProfile = {
      ...profile,
      nickname: newNickname,
    };
    setProfile(updated);
    Storage.saveProfile(updated);
    setIsFirstTimeNickname(false);
  };

  // Fisher-Yates array shuffler
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Smart Random Question Picker
  const pickRandomQuestions = (candidatePool: Question[], count: number = 10): Question[] => {
    if (candidatePool.length <= count) {
      return shuffleArray(candidatePool);
    }

    const seenSet = seenQuestionIdsRef.current;
    const unseen = candidatePool.filter(q => !seenSet.has(q.id));
    const seen = candidatePool.filter(q => seenSet.has(q.id));

    let chosen: Question[] = [];
    if (unseen.length >= count) {
      chosen = shuffleArray(unseen).slice(0, count);
    } else {
      chosen = [...unseen, ...shuffleArray(seen).slice(0, count - unseen.length)];
      seenSet.clear();
    }

    chosen.forEach(q => seenSet.add(q.id));
    return shuffleArray(chosen);
  };

  // Start a regular 10-question quiz with dynamic randomization
  const handleStartQuiz = (count: number = 10, category?: string, setIndex?: number) => {
    if (!profile.nickname.trim()) {
      setIsFirstTimeNickname(true);
      setIsNicknameModalOpen(true);
      return;
    }

    let selectedQuestions: Question[] = [];

    if (setIndex === 1) {
      // Set 1: 품사 & 어휘 집중
      const pool = TOEIC_PART5_QUESTIONS.filter(q => 
        q.category === '품사 자리' || q.category === '초급 빈출 어휘'
      );
      selectedQuestions = pickRandomQuestions(pool, 10);
      setQuizModeTitle('제 1세트: 기초 품사 & 어휘 10문제');
    } else if (setIndex === 2) {
      // Set 2: 동사 시제·수일치·태 & 준동사
      const pool = TOEIC_PART5_QUESTIONS.filter(q => 
        q.category === '동사 시제·수일치·태' || q.category === 'to부정사 & 동명사'
      );
      selectedQuestions = pickRandomQuestions(pool, 10);
      setQuizModeTitle('제 2세트: 동사 시제·수일치·태 10문제');
    } else if (setIndex === 3) {
      // Set 3: 전치사 vs 접속사 & 대명사
      const pool = TOEIC_PART5_QUESTIONS.filter(q => 
        q.category === '전치사 vs 접속사' || q.category === '대명사' || q.category === '상관접속사 & 어휘'
      );
      selectedQuestions = pickRandomQuestions(pool, 10);
      setQuizModeTitle('제 3세트: 전치사 vs 접속사 & 대명사 10문제');
    } else if (setIndex === 4) {
      // Set 4: 전 영역 실전 올인원 랜덤
      selectedQuestions = pickRandomQuestions(TOEIC_PART5_QUESTIONS, 10);
      setQuizModeTitle('제 4세트: 실전 랜덤 올인원 10문제');
    } else if (category) {
      const filtered = TOEIC_PART5_QUESTIONS.filter(q => q.category === category);
      selectedQuestions = pickRandomQuestions(filtered.length > 0 ? filtered : TOEIC_PART5_QUESTIONS, count);
      setQuizModeTitle(`${category} 10초 집중 훈련 (${selectedQuestions.length}문항)`);
    } else {
      selectedQuestions = pickRandomQuestions(TOEIC_PART5_QUESTIONS, count);
      setQuizModeTitle(`실전 10초 스피드런 1세트 (${selectedQuestions.length}문항)`);
    }

    setActiveQuizQuestions(selectedQuestions);
    setCurrentView('quiz');
  };

  // Start quiz from Wrong Notes (Re-test)
  const handleStartWrongNotesQuiz = (customQuestions?: Question[]) => {
    if (!profile.nickname.trim()) {
      setIsFirstTimeNickname(true);
      setIsNicknameModalOpen(true);
      return;
    }

    let questionsToTest = customQuestions;
    if (!questionsToTest) {
      const unmastered = wrongNotes.filter(n => !n.isMastered);
      questionsToTest = unmastered.length > 0 ? unmastered.map(n => n.question) : wrongNotes.map(n => n.question);
    }

    if (!questionsToTest || questionsToTest.length === 0) {
      alert('복습할 오답 문제가 없습니다. 먼저 실전 10초 세트를 풀어보세요!');
      return;
    }

    const setOf10Wrong = shuffleArray(questionsToTest).slice(0, 10);
    setActiveQuizQuestions(setOf10Wrong);
    setQuizModeTitle(`오답 학습 1세트 (${setOf10Wrong.length}문항)`);
    setCurrentView('quiz');
  };

  // Finish a quiz session: Calculate metrics and immediately record to Google Sheets
  const handleFinishQuiz = (records: AnswerRecord[]) => {
    setLastQuizRecords(records);
    refreshWrongNotes();

    if (quizModeTitle.includes('오답')) {
      records.forEach(r => {
        if (r.isCorrect) {
          Storage.markQuestionAsMastered(r.questionId);
        }
      });
      refreshWrongNotes();
    }

    // Metric Calculations
    const attemptedCount = records.length;
    const correctCount = records.filter(r => r.isCorrect).length;
    const wrongCount = attemptedCount - correctCount;
    const sessionStudyTimeSec = Math.round(records.reduce((acc, r) => acc + r.timeSpentSec, 0));
    const isCompleted10Set = attemptedCount === 10;

    // Update overall profile in localStorage
    const updatedProfile = Storage.updateStudySession({
      timeSpentSec: sessionStudyTimeSec,
      attemptedCount,
      correctCount,
      wrongCount,
      completedSetOf10: isCompleted10Set,
    });
    setProfile(updatedProfile);

    // Save test history entry
    const avgTimeSec = Number((sessionStudyTimeSec / (attemptedCount || 1)).toFixed(1));
    const historyEntry: TestHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: new Date().toISOString(),
      nickname: profile.nickname || '학습자',
      score: correctCount,
      totalQuestions: attemptedCount,
      accuracy: Math.round((correctCount / (attemptedCount || 1)) * 100),
      avgTimeSec,
      studyTimeSec: sessionStudyTimeSec,
      mode: quizModeTitle,
      is10QuestionSet: isCompleted10Set,
    };
    Storage.saveTestHistory(historyEntry);

    // Bulletproof Auto-sync to Google Sheet immediately when set finishes
    const targetUrl = GoogleSheetService.getEnvUrl();
    if (targetUrl) {
      const overallAcc = Math.round((updatedProfile.correctCount / (updatedProfile.questionsAttempted || 1)) * 100);
      const studentName = updatedProfile.nickname || '학습자';
      const syncPayload = {
        student_name: studentName,
        total_study_time: updatedProfile.totalStudyTimeSec,
        questions_solved: updatedProfile.questionsAttempted,
        correct_answers: updatedProfile.correctCount,
        sets_completed: updatedProfile.setsOf10Completed,
        accuracy: overallAcc,

        // Backwards compatibility
        nickname: studentName,
        timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        study_time_sec: sessionStudyTimeSec,
        correct_count: correctCount,
        wrong_count: wrongCount,
        sets_of_10_completed: updatedProfile.setsOf10Completed,
        questions_attempted: updatedProfile.questionsAttempted,
      };
      
      GoogleSheetService.sync(syncPayload, targetUrl).catch(e => {
        console.error('Silent Google Sheet sync error:', e);
      });
    }

    setCurrentView('result');
  };

  // Map currentView to navigation tab
  const getActiveTab = (): 'quiz' | 'wrongNotes' | 'cheatsheet' | 'stats' => {
    if (currentView === 'wrongNotes') return 'wrongNotes';
    if (currentView === 'cheatsheet') return 'cheatsheet';
    if (currentView === 'stats') return 'stats';
    return 'quiz';
  };

  const handleSelectNavTab = (tab: 'quiz' | 'wrongNotes' | 'cheatsheet' | 'stats') => {
    if (currentView === 'quiz' && tab !== 'quiz') {
      if (!confirm('현재 풀고 있는 시험을 중단하고 이동하시겠습니까?')) {
        return;
      }
    }
    if (tab === 'quiz') {
      if (currentView !== 'quiz') {
        setCurrentView('home');
      }
    }
    if (tab === 'wrongNotes') {
      refreshWrongNotes();
      setCurrentView('wrongNotes');
    }
    if (tab === 'cheatsheet') setCurrentView('cheatsheet');
    if (tab === 'stats') setCurrentView('stats');
  };

  const wrongCountUnmastered = wrongNotes.filter(n => !n.isMastered).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Header
        currentTab={getActiveTab()}
        onSelectTab={handleSelectNavTab}
        nickname={profile.nickname}
        onOpenNicknameModal={() => {
          setIsFirstTimeNickname(false);
          setIsNicknameModalOpen(true);
        }}
        wrongNotesCount={wrongCountUnmastered}
      />

      {/* Main Content Area - Mobile Padding */}
      <main className="flex-1 pb-24 md:pb-16">
        {currentView === 'home' && (
          <HomeView
            profile={profile}
            wrongNotes={wrongNotes}
            onStartQuiz={handleStartQuiz}
            onStartWrongQuiz={() => handleStartWrongNotesQuiz()}
            onOpenCheatsheet={() => setCurrentView('cheatsheet')}
            onOpenWrongNotes={() => {
              refreshWrongNotes();
              setCurrentView('wrongNotes');
            }}
            onSaveStudentName={handleSaveNickname}
          />
        )}

        {currentView === 'quiz' && (
          <QuizView
            questions={activeQuizQuestions}
            modeTitle={quizModeTitle}
            onFinish={handleFinishQuiz}
            onExit={() => setCurrentView('home')}
          />
        )}

        {currentView === 'result' && (
          <ResultView
            records={lastQuizRecords}
            nickname={profile.nickname}
            profile={profile}
            onRetryAll={() => handleStartQuiz(10)}
            onRetryWrongOnly={(wrongQuestions) => handleStartWrongNotesQuiz(wrongQuestions)}
            onGoToWrongNotes={() => {
              refreshWrongNotes();
              setCurrentView('wrongNotes');
            }}
            onGoHome={() => setCurrentView('home')}
          />
        )}

        {currentView === 'wrongNotes' && (
          <WrongNotesView
            wrongNotes={wrongNotes}
            onRefreshNotes={refreshWrongNotes}
            onStartRetest={(questions) => handleStartWrongNotesQuiz(questions)}
          />
        )}

        {currentView === 'cheatsheet' && (
          <CheatsheetView
            onStartPracticeWithCategory={(cat) => handleStartQuiz(5, cat)}
          />
        )}

        {currentView === 'stats' && (
          <StatsView
            profile={profile}
            wrongNotes={wrongNotes}
            onStartTest={() => handleStartQuiz(10)}
            onRefreshData={refreshAllData}
          />
        )}
      </main>

      {/* Native-feeling Mobile Bottom Navigation Bar (Hidden during active quiz for 100% focus) */}
      {currentView !== 'quiz' && (
        <nav 
          aria-label="모바일 하단 네비게이션"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around"
        >
          <button
            onClick={() => handleSelectNavTab('quiz')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer min-h-[48px] ${
              getActiveTab() === 'quiz' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <PenTool className="w-5 h-5" />
            <span className="text-[11px] leading-none">실전 풀이</span>
          </button>

          <button
            onClick={() => handleSelectNavTab('wrongNotes')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer min-h-[48px] relative ${
              getActiveTab() === 'wrongNotes' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <BookOpen className="w-5 h-5" />
              {wrongCountUnmastered > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wrongCountUnmastered > 9 ? '9+' : wrongCountUnmastered}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none">오답 노트</span>
          </button>

          <button
            onClick={() => handleSelectNavTab('cheatsheet')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer min-h-[48px] ${
              getActiveTab() === 'cheatsheet' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[11px] leading-none">3초 공식</span>
          </button>

          <button
            onClick={() => handleSelectNavTab('stats')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer min-h-[48px] ${
              getActiveTab() === 'stats' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[11px] leading-none">리포트</span>
          </button>
        </nav>
      )}

      {/* Nickname Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        currentNickname={profile.nickname}
        isFirstTime={isFirstTimeNickname}
        onSave={handleSaveNickname}
        onClose={() => setIsNicknameModalOpen(false)}
      />
    </div>
  );
}
