import React, { useEffect } from 'react';
import { AnswerRecord, Question, UserProfile } from '../types/toeic';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Home,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface ResultViewProps {
  records: AnswerRecord[];
  nickname: string;
  profile: UserProfile;
  onRetryAll: () => void;
  onRetryWrongOnly: (wrongQuestions: Question[]) => void;
  onGoToWrongNotes: () => void;
  onGoHome: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  records,
  nickname,
  profile,
  onRetryAll,
  onRetryWrongOnly,
  onGoToWrongNotes,
  onGoHome,
}) => {
  const totalQuestions = records.length;
  const correctCount = records.filter(r => r.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const accuracy = Math.round((correctCount / (totalQuestions || 1)) * 100);
  const sessionTimeSpentSec = Math.round(records.reduce((acc, r) => acc + r.timeSpentSec, 0));

  const wrongQuestions = records.filter(r => !r.isCorrect).map(r => r.question);
  const isSetOf10 = totalQuestions === 10;

  useEffect(() => {
    if (accuracy >= 70) {
      soundManager.playFanfare();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [accuracy]);

  return (
    <div className="max-w-lg mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
      {/* Result Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-xs">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          {isSetOf10 ? '토익 Part 5 10문제 1세트 완료!' : 'TOEIC Part 5 스피드런 결과'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          <span className="text-indigo-600">{nickname || '학습자'}</span> 님의 성적표
        </h1>

        {/* Big Score Callout */}
        <div className="my-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-4">
          <div>
            <span className="text-xs text-slate-400 font-bold block">정답률</span>
            <span className="text-4xl sm:text-5xl font-black text-indigo-600 tabular-nums">
              {accuracy}%
            </span>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-400 font-bold block">맞힌 문항</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-800 tabular-nums">
              {correctCount} / {totalQuestions}
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
          {accuracy >= 80
            ? '대단합니다! 실전 토익에서도 10초 컷으로 고득점을 노릴 수 있는 실력입니다!'
            : accuracy >= 60
            ? '좋은 속도감입니다! 틀린 문제를 오답 노트에서 복습하면 점수가 빠르게 오릅니다.'
            : '10초 풀이에 적응 중입니다. 아래 해설과 오답 노트를 통해 3초 공식을 익혀보세요!'}
        </p>

        {/* 4 Core Tracked Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 text-left">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-semibold block">세트 풀이 시간</span>
            <div className="text-xl font-black text-slate-800 tabular-nums mt-0.5">
              {sessionTimeSpentSec}초
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <span className="text-xs text-emerald-800 font-semibold block">맞힌 정답</span>
            <div className="text-xl font-black text-emerald-600 tabular-nums mt-0.5">
              {correctCount}문제
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100">
            <span className="text-xs text-rose-800 font-semibold block">틀린 오답</span>
            <div className="text-xl font-black text-rose-600 tabular-nums mt-0.5">
              {wrongCount}문제
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
            <span className="text-xs text-indigo-800 font-semibold block">10문제 완주 세트</span>
            <div className="text-xl font-black text-indigo-800 tabular-nums mt-0.5">
              {profile.setsOf10Completed}세트
            </div>
          </div>
        </div>

        {/* Full-width Mobile Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={onRetryAll}
            className="w-full flex items-center justify-center gap-2 py-4 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-base sm:text-lg rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>다음 10문제 풀기</span>
          </button>

          {wrongQuestions.length > 0 && (
            <button
              onClick={() => onRetryWrongOnly(wrongQuestions)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>틀린 {wrongCount}문제 즉시 재도전</span>
            </button>
          )}

          {wrongCount > 0 && (
            <button
              onClick={onGoToWrongNotes}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-sm sm:text-base rounded-2xl transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>오답 학습 노트 열기</span>
            </button>
          )}

          <button
            onClick={onGoHome}
            className="w-full py-3 px-5 text-slate-600 hover:text-slate-900 font-bold text-sm rounded-2xl transition-colors cursor-pointer text-center"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>

      {/* Question By Question Review List - Mobile Typography */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-black text-slate-900">
            문항별 해설 & 오답 학습
          </h2>
          <span className="text-xs text-slate-500 font-medium">총 {totalQuestions}문항</span>
        </div>

        <div className="space-y-3">
          {records.map((rec, idx) => {
            const isCorrect = rec.isCorrect;
            const isTimeout = rec.userAnswer === 'TIMEOUT';

            return (
              <details
                key={rec.questionId}
                className="group bg-white rounded-2xl border border-slate-200 p-4 transition-all open:ring-1 open:ring-indigo-400"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : isTimeout ? (
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-900 font-black">Q{idx + 1}.</span>
                        <span className="text-indigo-600">{rec.question.category}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{rec.timeSpentSec}초</span>
                      </div>
                      <p className="text-base font-bold text-slate-900 mt-1 line-clamp-2 leading-snug">
                        {rec.question.question}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block">선택: {rec.userAnswer}</span>
                      <span className="font-extrabold text-indigo-700">정답: {rec.question.correctAnswer}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                  </div>
                </summary>

                {/* Expanded Details with Large Student-Friendly Fonts */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-slate-800">
                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-indigo-900 block">3초 풀이 핵심 공식</strong>
                      <span className="text-sm sm:text-base font-bold text-indigo-950">{rec.question.explanation.coreRule}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-0.5">해석</span>
                    <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">{rec.question.koreanTranslation}</p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-0.5">문법 해설</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{rec.question.explanation.detailed}</p>
                  </div>

                  <div className="pt-1">
                    <span className="text-xs font-bold text-slate-500 block mb-1.5">어휘</span>
                    <div className="space-y-1">
                      {rec.question.explanation.vocabulary.map((v, i) => (
                        <div key={i} className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm flex items-center justify-between">
                          <strong className="text-slate-900">{v.word}</strong>
                          <span className="text-slate-600">{v.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
};
