import React, { useState } from 'react';
import { WrongNoteItem, Question } from '../types/toeic';
import { Storage } from '../utils/storage';
import { 
  BookOpen, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Filter,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WrongNotesViewProps {
  wrongNotes: WrongNoteItem[];
  onRefreshNotes: () => void;
  onStartRetest: (questions: Question[]) => void;
}

export const WrongNotesView: React.FC<WrongNotesViewProps> = ({
  wrongNotes,
  onRefreshNotes,
  onStartRetest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered'>('unmastered');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoInput, setMemoInput] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Categories present in wrong notes
  const categories = ['all', ...Array.from(new Set(wrongNotes.map(n => n.question.category)))];

  // Filtering
  const filteredNotes = wrongNotes.filter((note) => {
    // Status filter
    if (filterStatus === 'unmastered' && note.isMastered) return false;
    if (filterStatus === 'mastered' && !note.isMastered) return false;

    // Category filter
    if (selectedCategory !== 'all' && note.question.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQuestion = note.question.question.toLowerCase().includes(q);
      const matchTranslation = note.question.koreanTranslation.toLowerCase().includes(q);
      const matchMemo = (note.userMemo || '').toLowerCase().includes(q);
      const matchCoreRule = note.question.explanation.coreRule.toLowerCase().includes(q);
      if (!matchQuestion && !matchTranslation && !matchMemo && !matchCoreRule) return false;
    }

    return true;
  });

  const unmasteredCount = wrongNotes.filter(n => !n.isMastered).length;
  const masteredCount = wrongNotes.filter(n => n.isMastered).length;

  const handleToggleMastered = (id: string) => {
    Storage.toggleWrongNoteMastered(id);
    onRefreshNotes();
  };

  const handleDelete = (id: string) => {
    if (confirm('이 오답 노트를 삭제하시겠습니까?')) {
      Storage.deleteWrongNote(id);
      onRefreshNotes();
    }
  };

  const handleStartEditingMemo = (note: WrongNoteItem) => {
    setEditingMemoId(note.id);
    setMemoInput(note.userMemo || '');
  };

  const handleSaveMemo = (id: string) => {
    Storage.updateWrongNoteMemo(id, memoInput);
    setEditingMemoId(null);
    onRefreshNotes();
  };

  const handleCopyNotesText = () => {
    if (filteredNotes.length === 0) return;
    const text = filteredNotes.map((n, i) => {
      return `[오답 ${i + 1}] ${n.question.question}\n정답: (${n.question.correctAnswer}) ${n.question.options[n.question.correctAnswer]}\n3초 공식: ${n.question.explanation.coreRule}\n해석: ${n.question.koreanTranslation}\n내 메모: ${n.userMemo || '없음'}\n---------------------------`;
    }).join('\n\n');

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleStartReviewAll = () => {
    const questionsToReview = filteredNotes.map(n => n.question);
    if (questionsToReview.length > 0) {
      onStartRetest(questionsToReview);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            스마트 오답 노트
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          10초 풀이 중 틀리거나 시간 초과된 문제가 자동으로 기록됩니다.
        </p>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-bold block">전체 누적</span>
            <span className="text-lg font-black text-slate-800 tabular-nums">
              {wrongNotes.length}개
            </span>
          </div>
          <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100">
            <span className="text-[11px] text-rose-700 font-bold block">복습 필요</span>
            <span className="text-lg font-black text-rose-600 tabular-nums">
              {unmasteredCount}개
            </span>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <span className="text-[11px] text-emerald-800 font-bold block">마스터</span>
            <span className="text-lg font-black text-emerald-600 tabular-nums">
              {masteredCount}개
            </span>
          </div>
        </div>

        {unmasteredCount > 0 && (
          <button
            type="button"
            onClick={handleStartReviewAll}
            className="w-full mt-4 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-sm sm:text-base rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>오답만 10초 재시험 ({filteredNotes.length}문항)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-2.5">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setFilterStatus('unmastered')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center ${
              filterStatus === 'unmastered'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            복습 필요 ({unmasteredCount})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({wrongNotes.length})
          </button>
          <button
            onClick={() => setFilterStatus('mastered')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center ${
              filterStatus === 'mastered'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            마스터 ({masteredCount})
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="문제, 단어, 공식 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-3 text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
          />
        </div>
      </div>

      {/* Wrong Notes Cards List */}
      <div className="space-y-3.5">
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {filterStatus === 'unmastered'
                ? '복습할 오답 문제가 없습니다!'
                : '조건에 일치하는 문항이 없습니다.'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              10초 스피드런 문제를 풀다가 틀리거나 시간 초과된 문항이 이곳에 자동으로 정리됩니다.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isTimeout = note.userAnswer === 'TIMEOUT';
            const isExpanded = expandedId === note.id;

            return (
              <div
                key={note.id}
                className={`bg-white rounded-3xl border transition-all ${
                  note.isMastered
                    ? 'border-emerald-200 bg-emerald-50/15'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-indigo-600">{note.question.category}</span>
                      <span className="text-slate-300">·</span>
                      <span className={isTimeout ? 'text-amber-600' : 'text-rose-600'}>
                        {isTimeout ? '시간 초과' : `선택: (${note.userAnswer})`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleMastered(note.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          note.isMastered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{note.isMastered ? '마스터됨' : '마스터 체크'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Sentence with Large Font */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {note.question.question}
                  </h3>

                  {/* 4 Choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3.5 text-xs sm:text-sm font-medium">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const isCorrect = key === note.question.correctAnswer;
                      const isUserChoice = key === note.userAnswer;

                      let itemStyle = 'bg-slate-50 border-slate-200 text-slate-800';
                      if (isCorrect) {
                        itemStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                      } else if (isUserChoice) {
                        itemStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                      }

                      return (
                        <div
                          key={key}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${itemStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold">({key})</span>
                            <span className="font-semibold">{note.question.options[key]}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">
                              정답
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 3-Second Rule Strip */}
                  <div className="mt-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-indigo-900 block">3초 풀이 공식</span>
                      <span className="text-xs sm:text-sm font-bold text-indigo-950">{note.question.explanation.coreRule}</span>
                    </div>
                  </div>

                  {/* Toggle Explanation Accordion */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : note.id)}
                    className="w-full mt-3 flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 pt-2 border-t border-slate-100 cursor-pointer"
                  >
                    <span>상세 해석 & 해설 {isExpanded ? '접기' : '더보기'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-500 block">한국어 해석</span>
                        <p className="text-slate-900 font-medium leading-relaxed mt-0.5">{note.question.koreanTranslation}</p>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-500 block">문법 설명</span>
                        <p className="text-slate-700 leading-relaxed mt-0.5">{note.question.explanation.detailed}</p>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-500 block mb-1">어휘</span>
                        <div className="space-y-1">
                          {note.question.explanation.vocabulary.map((v, i) => (
                            <div key={i} className="bg-slate-50 px-2 py-1 rounded border border-slate-200 flex items-center justify-between text-xs">
                              <strong className="text-slate-900">{v.word}</strong>
                              <span className="text-slate-500">{v.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single Question Retest Button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onStartRetest([note.question])}
                      className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer text-center"
                    >
                      이 문제 10초 단독 다시 풀기 &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
