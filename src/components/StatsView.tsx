import React from 'react';
import { UserProfile, WrongNoteItem } from '../types/toeic';
import { Storage, TestHistoryEntry } from '../utils/storage';
import { 
  Award, 
  RotateCcw, 
  TrendingUp, 
  Trash2
} from 'lucide-react';

interface StatsViewProps {
  profile: UserProfile;
  wrongNotes: WrongNoteItem[];
  onStartTest: () => void;
  onRefreshData: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  profile,
  wrongNotes,
  onStartTest,
  onRefreshData,
}) => {
  const history: TestHistoryEntry[] = Storage.getTestHistory();
  const overallAccuracy = profile.questionsAttempted > 0 
    ? Math.round((profile.correctCount / profile.questionsAttempted) * 100) 
    : 0;

  const formatStudyTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}초`;
    return `${mins}분 ${secs}초`;
  };

  const handleResetHistory = () => {
    if (confirm('모든 시험 응시 기록과 오답 노트를 초기화하시겠습니까?')) {
      localStorage.removeItem('toeic_test_history');
      localStorage.removeItem('toeic_wrong_notes');
      const resetProfile: UserProfile = {
        ...profile,
        totalStudyTimeSec: 0,
        questionsAttempted: 0,
        correctCount: 0,
        wrongCount: 0,
        setsOf10Completed: 0,
        testsCompleted: 0,
      };
      Storage.saveProfile(resetProfile);
      onRefreshData();
    }
  };

  return (
    <div className="max-w-lg mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {profile.nickname ? `${profile.nickname} 님의 학습 리포트` : '실시간 학습 리포트'}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          학습 시간, 정답/오답 수, 10문제 완료 세트가 누적되어 나의 성취도를 실시간으로 확인할 수 있습니다.
        </p>

        {/* 4 Core Tracked Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-bold block">
              누적 학습 시간
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 tabular-nums mt-0.5">
              {formatStudyTime(profile.totalStudyTimeSec)}
            </div>
            <span className="text-[11px] text-slate-400">
              총 {profile.totalStudyTimeSec}초
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-bold block">
              풀이 문항
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-0.5">
              {profile.questionsAttempted}문항
            </div>
            <span className="text-[11px] text-slate-400">총 {profile.testsCompleted}회 응시</span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <span className="text-xs text-emerald-800 font-bold block">
              맞힌 정답 수
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums mt-0.5">
              {profile.correctCount}개
            </div>
            <span className="text-[11px] text-emerald-700 font-bold tabular-nums">
              정답률 {overallAccuracy}%
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100">
            <span className="text-xs text-indigo-800 font-bold block">
              10문제 완주 세트
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-800 tabular-nums mt-0.5">
              {profile.setsOf10Completed}세트
            </div>
            <span className="text-[11px] text-indigo-600 font-medium">
              10문제 완주
            </span>
          </div>
        </div>

        <button
          onClick={onStartTest}
          className="w-full mt-4 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-base rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>새 10문제 세트 풀기</span>
        </button>
      </div>

      {/* Test History List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              최근 10초 스피드런 기록
            </h2>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleResetHistory}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
            아직 완료된 시험 기록이 없습니다. 지금 10문제 1세트를 풀어보세요!
          </div>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                    <span>{item.mode}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    풀이 시간 <strong>{item.studyTimeSec || Math.round(item.avgTimeSec * item.totalQuestions)}초</strong> · {item.totalQuestions}문제 중 <strong>{item.score}개 정답</strong>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-base font-black tabular-nums ${
                    item.accuracy >= 80 ? 'text-emerald-600' : item.accuracy >= 60 ? 'text-indigo-600' : 'text-slate-700'
                  }`}>
                    {item.accuracy}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
