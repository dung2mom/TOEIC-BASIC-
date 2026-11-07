import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, AnswerRecord } from '../types/toeic';
import { soundManager } from '../utils/sound';
import { Storage } from '../utils/storage';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FastForward,
  X
} from 'lucide-react';

interface QuizViewProps {
  questions: Question[];
  onFinish: (records: AnswerRecord[]) => void;
  onExit: () => void;
  modeTitle: string;
}

const TOTAL_TIME_SEC = 10.0;

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  onFinish,
  onExit,
  modeTitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME_SEC);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Use refs to avoid stale closure issues and circular triggers
  const isAnsweredRef = useRef<boolean>(false);
  const answersRef = useRef<AnswerRecord[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickedSecond = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentQ = questions[currentIndex];

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleNextQuestion = useCallback(() => {
    stopTimer();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onFinish([...answersRef.current]);
    }
  }, [currentIndex, questions.length, onFinish]);

  const handleTimeout = useCallback(() => {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;
    stopTimer();

    setTimeLeft(0);
    setIsAnswered(true);
    setIsTimeout(true);
    soundManager.playTimeout();

    Storage.addWrongNote(currentQ, 'TIMEOUT');

    const record: AnswerRecord = {
      questionId: currentQ.id,
      userAnswer: 'TIMEOUT',
      isCorrect: false,
      timeSpentSec: 10.0,
      question: currentQ,
    };

    answersRef.current.push(record);
  }, [currentQ]);

  const handleSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (isAnsweredRef.current) return;
    isAnsweredRef.current = true;
    stopTimer();

    const timeSpent = Math.min(10.0, Math.max(0.1, Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1))));
    const isCorrect = option === currentQ.correctAnswer;

    setSelectedOption(option);
    setIsAnswered(true);
    setIsTimeout(false);

    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
      Storage.addWrongNote(currentQ, option);
    }

    const record: AnswerRecord = {
      questionId: currentQ.id,
      userAnswer: option,
      isCorrect,
      timeSpentSec: timeSpent,
      question: currentQ,
    };

    answersRef.current.push(record);
  };

  const handleSkipQuestion = () => {
    if (isAnsweredRef.current) return;
    handleTimeout();
  };

  // Countdown timer effect
  useEffect(() => {
    isAnsweredRef.current = false;
    setTimeLeft(TOTAL_TIME_SEC);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsTimeout(false);
    setShowExplanation(false);
    lastTickedSecond.current = null;
    startTimeRef.current = Date.now();

    stopTimer();

    const intervalMs = 50;
    timerRef.current = setInterval(() => {
      if (isAnsweredRef.current) {
        stopTimer();
        return;
      }

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TOTAL_TIME_SEC - elapsed);

      setTimeLeft(remaining);

      const floorSec = Math.ceil(remaining);
      if (floorSec <= 3 && floorSec > 0 && lastTickedSecond.current !== floorSec) {
        lastTickedSecond.current = floorSec;
        soundManager.playTick();
      }

      if (remaining <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, intervalMs);

    return () => {
      stopTimer();
    };
  }, [currentIndex, handleTimeout]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!isAnsweredRef.current) {
        if (e.key === '1' || e.key.toUpperCase() === 'A') handleSelect('A');
        if (e.key === '2' || e.key.toUpperCase() === 'B') handleSelect('B');
        if (e.key === '3' || e.key.toUpperCase() === 'C') handleSelect('C');
        if (e.key === '4' || e.key.toUpperCase() === 'D') handleSelect('D');
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextQuestion]);

  if (!currentQ) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-700 text-lg font-bold mb-4">문제를 불러올 수 없습니다.</p>
        <button
          onClick={onExit}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl text-base font-bold shadow-md cursor-pointer"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / TOTAL_TIME_SEC) * 100));

  const getTimerColor = () => {
    if (timeLeft <= 2.5) return 'bg-rose-500';
    if (timeLeft <= 4.5) return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  const getTimerBadgeStyle = () => {
    if (timeLeft <= 2.5) return 'text-rose-600 bg-rose-50 border-rose-300 animate-pulse';
    if (timeLeft <= 4.5) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-indigo-700 bg-indigo-50 border-indigo-200';
  };

  return (
    <div className="max-w-lg mx-auto px-3.5 sm:px-6 py-3 sm:py-6">
      {/* Mobile Top Navigation & Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
            {currentIndex + 1}
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 block truncate">
              {currentQ.category}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {modeTitle} ({currentIndex + 1} / {questions.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isAnswered && (
            <button
              type="button"
              onClick={handleSkipQuestion}
              className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FastForward className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">건너뛰기</span>
            </button>
          )}

          <button
            onClick={onExit}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="시험 종료"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 10-Second Countdown Meter - Mobile Optimized */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs sm:text-sm">
            <Clock className={`w-4 h-4 ${timeLeft <= 3 && !isAnswered ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`} />
            <span>제한시간 10초</span>
          </div>

          <div className={`px-3 py-1 rounded-full text-base sm:text-lg font-black tabular-nums border transition-colors ${getTimerBadgeStyle()}`}>
            {isTimeout ? '⏰ 10초 시간 초과' : `${timeLeft.toFixed(1)}초`}
          </div>
        </div>

        {/* Thick visible progress bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${getTimerColor()}`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Question Card with Large Student-Friendly Typography */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        {/* Question Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs sm:text-sm text-slate-500">
          <span className="font-bold text-indigo-600">
            문항 0{currentIndex + 1}
          </span>
          <span className="text-slate-400">
            정답을 10초 이내에 터치하세요
          </span>
        </div>

        {/* English Sentence with Highlighted Blank - Large Clear Fonts */}
        <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed tracking-wide my-3 sm:my-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
          {currentQ.question.split('_____').map((part, idx, arr) => (
            <React.Fragment key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <span className="inline-block min-w-[90px] mx-1.5 text-center font-black px-3 py-1 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs">
                  {isAnswered
                    ? (selectedOption || (isTimeout ? '시간초과' : '_____'))
                    : '_____'}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 4 Large Touch-Optimized Multiple Choice Buttons */}
        <div className="mt-5 space-y-2.5 sm:space-y-3">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const text = currentQ.options[key];
            const isSelected = selectedOption === key;
            const isCorrectAnswer = key === currentQ.correctAnswer;

            let buttonStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 active:bg-slate-100';
            let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStyle = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-extrabold shadow-xs';
                badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
              } else if (isSelected && !isCorrectAnswer) {
                buttonStyle = 'bg-rose-50 border-2 border-rose-400 text-rose-950 font-bold';
                badgeStyle = 'bg-rose-600 text-white border-rose-600';
              } else {
                buttonStyle = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400';
                badgeStyle = 'bg-slate-100 text-slate-400 border-slate-200';
              }
            }

            return (
              <button
                key={key}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelect(key)}
                className={`w-full text-left flex items-center justify-between p-4 sm:p-4.5 rounded-2xl border-2 transition-all duration-150 cursor-pointer min-h-[58px] ${buttonStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center text-base sm:text-lg font-black shrink-0 transition-colors ${badgeStyle}`}>
                    {key}
                  </span>
                  <span className="text-lg sm:text-xl font-bold tracking-tight">
                    {text}
                  </span>
                </div>

                {isAnswered && (
                  <div className="shrink-0 ml-2">
                    {isCorrectAnswer && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    )}
                    {isSelected && !isCorrectAnswer && (
                      <XCircle className="w-6 h-6 text-rose-600" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Next Button Area */}
        {isAnswered && (
          <div className="mt-6 pt-5 border-t border-slate-200">
            {/* Status Alert Banner */}
            <div className={`p-4 rounded-2xl flex items-start gap-3 ${
              isTimeout
                ? 'bg-amber-50 border-2 border-amber-300 text-amber-950'
                : selectedOption === currentQ.correctAnswer
                ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-2 border-rose-300 text-rose-950'
            }`}>
              <div className="mt-0.5 shrink-0">
                {isTimeout ? (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                ) : selectedOption === currentQ.correctAnswer ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {isTimeout
                      ? '10초 시간 초과! (오답)'
                      : selectedOption === currentQ.correctAnswer
                      ? '정답입니다! 🎉'
                      : '아쉽게 틀렸습니다.'}
                  </h3>
                  <div className="text-sm font-bold">
                    정답: <span className="text-indigo-800 font-black">{currentQ.correctAnswer}번 ({currentQ.options[currentQ.correctAnswer]})</span>
                  </div>
                </div>

                {(!selectedOption || selectedOption !== currentQ.correctAnswer) && (
                  <p className="text-xs sm:text-sm mt-1.5 text-slate-700 flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      이 문제는 <strong>오답 노트에 자동 저장</strong>되었습니다.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick 3-Second Core Rule with Large Text */}
            <div className="mt-3.5 p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm sm:text-base font-extrabold text-indigo-900 block mb-0.5">3초 풀이 핵심 공식</span>
                <span className="text-base sm:text-lg font-bold text-indigo-950 leading-snug">{currentQ.explanation.coreRule}</span>
              </div>
            </div>

            {/* Detailed Explanation Accordion */}
            <div className="mt-3.5">
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex items-center justify-between text-sm sm:text-base font-bold text-slate-700 hover:text-indigo-600 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <span>해석 & 문법 설명 {showExplanation ? '접기 ▲' : '열어보기 ▼'}</span>
                {showExplanation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showExplanation && (
                <div className="mt-3 p-4 sm:p-5 bg-slate-50 rounded-2xl space-y-4 text-slate-800 border border-slate-200/80">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      한국어 해석
                    </h4>
                    <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                      {currentQ.koreanTranslation}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                      상세 문법 설명
                    </h4>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                      {currentQ.explanation.detailed}
                    </p>
                    {currentQ.explanation.distractors && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                        {currentQ.explanation.distractors}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      핵심 토익 어휘
                    </h4>
                    <div className="space-y-1.5">
                      {currentQ.explanation.vocabulary.map((vocab, vIdx) => (
                        <div key={vIdx} className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-sm sm:text-base">
                          <span className="font-bold text-slate-900">{vocab.word}</span>
                          <span className="text-slate-600 font-medium">{vocab.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Prominent Full-Width Next Question Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                <span>{currentIndex + 1 < questions.length ? '다음 문제로 넘어가기' : '최종 시험 결과 확인하기'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
