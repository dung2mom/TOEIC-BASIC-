import React, { useState, useEffect } from 'react';
import { GoogleSheetConfig, GoogleSheetSyncPayload, UserProfile } from '../types/toeic';
import { GoogleSheetService, SyncHistoryItem } from '../utils/googleSheetSync';
import { 
  FileSpreadsheet, 
  X, 
  Copy, 
  Check, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const APPS_SCRIPT_CODE = `/**
 * 토익 Part 5 10초 스피드런 - 구글 시트 자동 저장 스크립트 (5개 열)
 * 
 * [열(Column) 구성]
 * 1. nickname : 사용자 닉네임
 * 2. timestamp : 저장 일시
 * 3. study_time_sec : 학습 시간 (초)
 * 4. correct_count : 문항 정답 수
 * 5. wrong_count : 문항 오답 수
 * 
 * [배포 방법]
 * 1. 구글 스프레드시트 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 코드를 붙여넣기
 * 3. 오른쪽 위 파란색 [배포] -> [새 배포] -> 유형 [웹 앱] 선택
 * 4. '액세스 권한이 있는 사용자'를 반드시 '모든 사용자(Anyone)'로 선택 후 [배포]
 * 5. 생성된 '웹 앱 URL'을 토익 앱에 입력
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var headers = [
      "nickname",
      "timestamp",
      "study_time_sec",
      "correct_count",
      "wrong_count"
    ];
    
    // 첫 실행 시 헤더 자동 작성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4F46E5");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    var nickname = data.nickname || "토익꿈나무";
    var timestamp = data.timestamp || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var studyTimeSec = Number(data.study_time_sec !== undefined ? data.study_time_sec : 0);
    var correctCount = Number(data.correct_count !== undefined ? data.correct_count : 0);
    var wrongCount = Number(data.wrong_count !== undefined ? data.wrong_count : 0);
    
    sheet.appendRow([
      nickname,
      timestamp,
      studyTimeSec,
      correctCount,
      wrongCount
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.nickname || e.parameter.study_time_sec !== undefined || e.parameter.correct_count !== undefined)) {
    return doPost(e);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ready" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [config, setConfig] = useState<GoogleSheetConfig>(() => GoogleSheetService.getConfig());
  const [urlInput, setUrlInput] = useState<string>(config.webAppUrl || '');
  const [autoSyncInput, setAutoSyncInput] = useState<boolean>(config.autoSync);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'script' | 'history'>('setup');
  const [history, setHistory] = useState<SyncHistoryItem[]>(() => GoogleSheetService.getHistory());

  useEffect(() => {
    if (isOpen) {
      const cfg = GoogleSheetService.getConfig();
      setConfig(cfg);
      setUrlInput(cfg.webAppUrl || '');
      setAutoSyncInput(cfg.autoSync);
      setHistory(GoogleSheetService.getHistory());
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveConfig = () => {
    const trimmed = urlInput.trim();
    const updated: GoogleSheetConfig = {
      ...config,
      webAppUrl: trimmed,
      autoSync: autoSyncInput,
    };
    GoogleSheetService.saveConfig(updated);
    setConfig(updated);
    setFeedback({
      type: 'success',
      message: '구글 시트 연동 설정이 저장되었습니다.',
    });
  };

  const handleTestSync = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setFeedback({
        type: 'error',
        message: '먼저 구글 앱스 스크립트 웹 앱 URL을 입력해 주세요.',
      });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    const payload: GoogleSheetSyncPayload = {
      nickname: profile.nickname || '토익꿈나무',
      timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      study_time_sec: profile.totalStudyTimeSec > 0 ? profile.totalStudyTimeSec : 45,
      correct_count: profile.correctCount > 0 ? profile.correctCount : 8,
      wrong_count: profile.wrongCount > 0 ? profile.wrongCount : 2,
    };

    const result = await GoogleSheetService.sync(payload, trimmed);
    setIsSending(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: '구글 시트로 테스트 데이터 5개 열(nickname, timestamp, study_time_sec, correct_count, wrong_count) 전송 성공!',
      });
      setHistory(GoogleSheetService.getHistory());
      setConfig(GoogleSheetService.getConfig());
    } else {
      setFeedback({
        type: 'error',
        message: result.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                구글 시트 연동 & 앱스 스크립트 (5개 열)
              </h2>
              <p className="text-xs text-slate-500">
                nickname, timestamp, study_time_sec, correct_count, wrong_count 자동 기록
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'setup'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            연동 설정 및 전송
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'script'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>앱스 스크립트 코드 복사</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            전송 기록 로그 ({history.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm space-y-5">
          {activeTab === 'setup' && (
            <div className="space-y-5">
              {/* Current Data Preview Strip */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  구글 시트 5개 열 매핑 미리보기:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">1. nickname</span>
                    <strong className="text-slate-800 truncate block">{profile.nickname || '토익꿈나무'}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">3. study_time_sec</span>
                    <strong className="text-indigo-600 tabular-nums">
                      {profile.totalStudyTimeSec}초
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">4. correct_count</span>
                    <strong className="text-emerald-600 tabular-nums">
                      {profile.correctCount}개 정답
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">5. wrong_count</span>
                    <strong className="text-rose-600 tabular-nums">
                      {profile.wrongCount}개 오답
                    </strong>
                  </div>
                </div>
              </div>

              {/* Web App URL Input Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    구글 앱스 스크립트 웹 앱 URL (Web App URL)
                  </label>
                  {urlInput ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      연동 활성화됨
                    </span>
                  ) : null}
                </div>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                />
                <p className="text-[11px] text-slate-500">
                  구글 시트의 [확장 프로그램] &rarr; [Apps Script]에서 웹 앱으로 배포한 URL을 붙여넣으세요.
                </p>

                {/* Auto sync switch */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={autoSyncInput}
                    onChange={(e) => setAutoSyncInput(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="autoSync" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    10문제 1세트 풀이 완료 시 구글 시트에 자동으로 저장하기
                  </label>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('script')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>5개 열 앱스 스크립트 코드 복사하기</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    설정 저장
                  </button>
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={handleTestSync}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isSending ? '시트 전송 중...' : '구글 시트 테스트 전송'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-4">
              {/* Instructions Steps */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">
                  구글 스프레드시트 배포 4단계:
                </span>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>
                    구글 드라이브에서 <strong>새 구글 스프레드시트</strong>를 만듭니다.
                  </li>
                  <li>
                    상단 메뉴에서 <strong>[확장 프로그램] &rarr; [Apps Script]</strong>를 클릭합니다.
                  </li>
                  <li>
                    기존 기본 코드를 지우고, 아래의 <strong>[스크립트 전체 복사]</strong> 버튼을 눌러 붙여넣습니다.
                  </li>
                  <li>
                    오른쪽 상단 파란색 <strong>[배포] &rarr; [새 배포]</strong> 클릭 후:
                    <ul className="list-disc pl-4 mt-1 text-slate-600 space-y-0.5">
                      <li>유형: <strong>웹 앱 (Web App)</strong> 선택</li>
                      <li>액세스 권한: <strong>모든 사용자 (Anyone)</strong> 선택 &larr; <span className="text-rose-600 font-bold">필수!</span></li>
                      <li>[배포] 클릭 후 발급되는 <strong>웹 앱 URL</strong>을 복사하여 연동 설정에 입력</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {/* Exact 5 Column Mapping Notice */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                <strong className="text-indigo-900 font-bold">구글 시트 자동 저장 열 (5개 Columns):</strong>
                <div className="font-mono text-[11px] mt-1 text-indigo-800 bg-white p-2 rounded border border-indigo-200/60 overflow-x-auto whitespace-nowrap">
                  nickname , timestamp , study_time_sec , correct_count , wrong_count
                </div>
              </div>

              {/* Code block with copy button */}
              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-600">Google Apps Script (Code.gs)</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? '복사 완료!' : '스크립트 전체 복사'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">
                  <code>{APPS_SCRIPT_CODE}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-600 block">
                구글 시트 전송 기록 ({history.length}건)
              </span>

              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  아직 전송된 기록이 없습니다. 10문제 1세트를 풀면 이곳에 기록이 남습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white text-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-bold text-slate-800">{item.payload.nickname}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 font-medium">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-2">
                          <span>학습시간: <strong>{item.payload.study_time_sec}초</strong></span>
                          <span>정답: <strong className="text-emerald-600">{item.payload.correct_count}개</strong></span>
                          <span>오답: <strong className="text-rose-600">{item.payload.wrong_count}개</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.success ? '전송 완료' : '전송 실패'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>열 순서: nickname, timestamp, study_time_sec, correct_count, wrong_count</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
