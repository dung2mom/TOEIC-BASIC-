import React from 'react';
import { TOEIC_BEGINNER_RULES } from '../data/grammarCheatsheet';
import { Sparkles, Lightbulb, PlayCircle } from 'lucide-react';

interface CheatsheetViewProps {
  onStartPracticeWithCategory: (category: string) => void;
}

export const CheatsheetView: React.FC<CheatsheetViewProps> = ({
  onStartPracticeWithCategory,
}) => {
  return (
    <div className="max-w-lg mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            초급 3초 풀이 핵심 공식
          </h1>
        </div>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          초급 토익 파트 5의 핵심 빈출 공식과 정답 단서를 빠르게 확인하고 연습하세요.
        </p>

        {/* Quick summary grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-extrabold text-indigo-600 block mb-0.5">명사 자리</span>
            <span className="text-slate-700 font-medium">관사 / 소유격 뒤</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-extrabold text-indigo-600 block mb-0.5">부사 자리</span>
            <span className="text-slate-700 font-medium">완전한 문장 뒤 / 동사 수식</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-extrabold text-indigo-600 block mb-0.5">전치사 vs 접속사</span>
            <span className="text-slate-700 font-medium">명사구 vs 주어+동사</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-extrabold text-indigo-600 block mb-0.5">수동태 판별</span>
            <span className="text-slate-700 font-medium">뒤에 목적어 명사 없음</span>
          </div>
        </div>
      </div>

      {/* Rules Detail List */}
      <div className="space-y-3.5">
        {TOEIC_BEGINNER_RULES.map((rule, idx) => (
          <div
            key={rule.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                  공식 0{idx + 1}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-500">
                  {rule.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onStartPracticeWithCategory(rule.category)}
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>이 유형 풀기</span>
                <span>&rarr;</span>
              </button>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-3">
              {rule.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-1 leading-snug">
              {rule.shortRule}
            </p>

            {/* Formula Block with Large Text */}
            <div className="mt-3 p-3.5 bg-slate-900 text-indigo-300 rounded-2xl font-mono text-sm sm:text-base font-bold tracking-wide">
              {rule.formula}
            </div>

            {/* Example sentence */}
            <div className="mt-3 text-sm bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 block mb-1">기출 적용 예시:</span>
              <p className="text-slate-900 font-semibold leading-relaxed">{rule.exampleSentence}</p>
            </div>

            {/* Key tip */}
            <div className="mt-3 flex items-start gap-2.5 text-xs sm:text-sm text-amber-950 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{rule.keyTip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
