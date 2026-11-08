import React, { useState } from 'react';
import { UserProfile, WrongNoteItem } from '../types/toeic';
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Award,
  PlayCircle,
  User,
  Check,
  RotateCcw,
  GraduationCap,
  Shuffle
} from 'lucide-react';

interface HomeViewProps {
  profile: UserProfile;
  wrongNotes: WrongNoteItem[];
  onStartQuiz: (count: number, category?: string, setIndex?: number) => void;
  onStartWrongQuiz: () => void;
  onOpenCheatsheet: () => void;
  onOpenWrongNotes: () => void;
  onSaveStudentName: (name: string) => void;
}

const SETS_DATA = [
  {
    setIndex: 1,
    title: '제 1세트: 기초 품사 & 어휘',
    desc: '명사/형용사/부사 자리 찾기 및 파트 5 필수 어휘 10문제 (회차마다 새로운 문제 랜덤 편성)',
    badge: '매회 랜덤 10문항',
    focus: '품사 자리 & 어휘',
  },
  {
    setIndex: 2,
    title: '제 2세트: 동사 시제·수일치·태',
    desc: '단수/복수 수일치, 과거/미래 시제 단서, 능동태 vs 수동태 판별 10문제 (매회 랜덤 편성)',
    badge: '매회 랜덤 10문항',
    focus: '동사의 수/시제/태',
  },
  {
    setIndex: 3,
    title: '제 3세트: 전치사 vs 접속사 & 대명사',
    desc: '명사구 vs 절 구별, 소유격, 재귀대명사 1초 컷 공식 10문제 (매회 랜덤 편성)',
    badge: '매회 랜덤 10문항',
    focus: '전치사/접속사/대명사',
  },
  {
    setIndex: 4,
    title: '제 4세트: 실전 랜덤 올인원',
    desc: '전체 문항 풀에서 골고루 무작위 추출하여 실전 감각을 극대화하는 10문제 종합 세트',
    badge: '전체 풀 랜덤 10문항',
    focus: '실전 종합 스피드런',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  wrongNotes,
  onStartQuiz,
  onStartWrongQuiz,
  onOpenCheatsheet,
  onOpenWrongNotes,
  onSaveStudentName,
}) => {
  const [inputName, setInputName] = useState<string>(profile.nickname || '');
  const [nameSavedSuccess, setNameSavedSuccess] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string>('');

  const unmasteredWrongNotes = wrongNotes.filter(n => !n.isMastered);

  const formatStudyTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}초`;
    return `${mins}분 ${secs}초`;
  };

  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) {
      setNameError('학생 이름(또는 학번과 이름)을 입력해 주세요.');
      return;
    }
    setNameError('');
    onSaveStudentName(trimmed);
    setNameSavedSuccess(true);
    setTimeout(() => setNameSavedSuccess(false), 2500);
  };

  const handleStartSetWithValidation = (count: number, category?: string, setIndex?: number) => {
    const trimmed = (profile.nickname || inputName).trim();
    if (!trimmed) {
      setNameError('문제를 풀기 전에 먼저 아래 칸에 학습자 이름을 입력하고 등록해 주세요!');
      const el = document.getElementById('student-name-input');
      if (el) el.focus();
      return;
    }
    onStartQuiz(count, category, setIndex);
  };

  return (
    <div className="max-w-lg mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Mobile Hero & Student Name Input Card */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 text-indigo-200 text-xs sm:text-sm font-bold">
          <GraduationCap className="w-4 h-4 text-amber-300" />
          <span>TOEIC Practice</span>
          <span>·</span>
          <span className="text-amber-300">문항당 10초 스피드런</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
          초급 토익 Part 5
        </h1>
        <p className="text-sm sm:text-base text-indigo-100 mt-1 leading-snug">
          회차마다 새로운 문제가 랜덤으로 출제됩니다.
        </p>

        {/* Student Name Registration Box */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="student-name-input" className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-200" />
              <span>학습자 이름 (학생 이름)</span>
            </label>
            {profile.nickname && (
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>등록 완료</span>
              </span>
            )}
          </div>

          <form onSubmit={handleNameSubmit} className="flex gap-2">
            <input
              id="student-name-input"
              type="text"
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                setNameError('');
              }}
              placeholder="예: 홍길동, 2학년 김토익"
              maxLength={20}
              className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-base sm:text-lg font-bold px-4 py-3 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-sm sm:text-base font-black rounded-2xl transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              {nameSavedSuccess ? '저장됨' : '등록'}
            </button>
          </form>

          {nameError ? (
            <p className="text-xs sm:text-sm text-amber-200 font-bold mt-2 animate-pulse">
              ⚠️ {nameError}
            </p>
          ) : profile.nickname ? (
            <p className="text-xs sm:text-sm text-indigo-100 mt-2 font-medium">
              현재 학습자: <strong className="text-white font-bold underline underline-offset-2">{profile.nickname}</strong>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-indigo-200 mt-2">
              이름을 입력해야 문제 풀이를 시작할 수 있습니다.
            </p>
          )}
        </div>
      </div>

      {/* 10-Question Structured Sets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              10문제 1세트 스피드런
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              회차마다 10문항이 무작위로 편성됩니다.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {SETS_DATA.map((set) => (
            <div
              key={set.setIndex}
              onClick={() => handleStartSetWithValidation(10, undefined, set.setIndex)}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 active:bg-indigo-50/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {set.focus}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Shuffle className="w-3 h-3 text-indigo-400" />
                  <span>{set.badge}</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {set.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {set.desc}
              </p>

              <button
                type="button"
                className="w-full mt-3.5 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <PlayCircle className="w-5 h-5" />
                <span>10초 스피드런 1세트 풀기</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Wrong Answer Review Banner (오답 학습) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                오답 학습 노트
              </h2>
              <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full tabular-nums">
                {wrongNotes.length}문제 누적
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              10초 풀이 중 틀리거나 시간 초과된 문제가 자동 저장됩니다.
            </p>

            <div className="flex items-center gap-2 mt-3.5">
              {unmasteredWrongNotes.length > 0 && (
                <button
                  onClick={onStartWrongQuiz}
                  className="flex-1 py-3 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-black rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  오답 집중 풀기 ({unmasteredWrongNotes.length})
                </button>
              )}
              <button
                onClick={onOpenWrongNotes}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                오답노트 열기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Learning Status Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {profile.nickname ? `${profile.nickname} 님의 학습 성과` : '나의 학습 성과'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">실시간 누적</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-3.5">
          {/* 학습 시간 */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-bold block">
              누적 학습 시간
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 tabular-nums mt-0.5 truncate">
              {formatStudyTime(profile.totalStudyTimeSec)}
            </div>
          </div>

          {/* 푼 문항 수 */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-bold block">
              푼 문항 수
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-0.5">
              {profile.questionsAttempted}문제
            </div>
          </div>

          {/* 정답 수 */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <span className="text-xs text-emerald-800 font-bold block">
              맞힌 정답 수
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums mt-0.5">
              {profile.correctCount}개
            </div>
          </div>

          {/* 완료 세트 수 */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100">
            <span className="text-xs text-indigo-800 font-bold block">
              10문제 완주
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-800 tabular-nums mt-0.5">
              {profile.setsOf10Completed}세트
            </div>
          </div>
        </div>
      </div>

      {/* Quick 3-Second Rule Cheatsheet Button */}
      <div 
        onClick={onOpenCheatsheet}
        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              초급자 3초 풀이 핵심 공식
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              품사 자리, 전치사 vs 접속사 공식 요약
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
      </div>
    </div>
  );
};
