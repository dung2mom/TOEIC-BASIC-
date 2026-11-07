import { GoogleSheetConfig, GoogleSheetSyncPayload } from '../types/toeic';

const CONFIG_KEY = 'toeic_google_sheet_config';
const SYNC_LOGS_KEY = 'toeic_sync_history';

export const CURRENT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxxeos6SG93X5e5kCrez1xKVX8NUVsL5CAIq_D31HNF957vpHyxO89DiZCiryrDAhILIA/exec';

export interface SyncHistoryItem {
  id: string;
  timestamp: string;
  payload: GoogleSheetSyncPayload;
  success: boolean;
  message: string;
}

// In-memory deduplication tracker to prevent accidental duplicate submission of the exact same test
let lastSyncSignature = '';
let lastSyncTimestamp = 0;

export const GoogleSheetService = {
  getEnvUrl(): string {
    const envUrl = (
      (import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL as string | undefined) ||
      (import.meta.env.VITE_GOOGLE_SCRIPT_URL as string | undefined) ||
      CURRENT_WEB_APP_URL
    );
    return (envUrl || CURRENT_WEB_APP_URL).trim();
  },

  getConfig(): GoogleSheetConfig {
    const activeUrl = this.getEnvUrl();
    try {
      const data = localStorage.getItem(CONFIG_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // If stored URL differs from activeUrl, update to current verified URL
        const isDifferent = parsed.webAppUrl !== activeUrl;
        const effectiveUrl = (!parsed.webAppUrl || isDifferent) ? activeUrl : parsed.webAppUrl;
        
        return {
          webAppUrl: effectiveUrl,
          autoSync: true,
          lastSyncTime: parsed.lastSyncTime,
          lastSyncStatus: parsed.lastSyncStatus,
          lastSyncError: parsed.lastSyncError,
        };
      }
    } catch {
      // fallback
    }
    return {
      webAppUrl: activeUrl,
      autoSync: true,
    };
  },

  saveConfig(config: GoogleSheetConfig): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save Google Sheet config', e);
    }
  },

  getHistory(): SyncHistoryItem[] {
    try {
      const data = localStorage.getItem(SYNC_LOGS_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [];
  },

  addHistory(item: SyncHistoryItem): void {
    try {
      const list = this.getHistory();
      list.unshift(item);
      localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(list.slice(0, 30)));
    } catch (e) {
      console.error('Failed to log sync history', e);
    }
  },

  /**
   * Sends the 5 metrics payload to the user's deployed Google Apps Script Web App.
   * Columns: nickname, timestamp, study_time_sec, correct_count, wrong_count
   */
  async sync(payload: GoogleSheetSyncPayload, customUrl?: string): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    const targetUrl = (customUrl || config.webAppUrl || this.getEnvUrl() || CURRENT_WEB_APP_URL).trim();

    if (!targetUrl) {
      return {
        success: false,
        message: '구글 앱스 스크립트 웹 앱 URL이 설정되지 않았습니다.',
      };
    }

    // Deduplication check: prevent submitting the exact same test record twice within 3 seconds
    const signature = `${payload.nickname}_${payload.study_time_sec}_${payload.correct_count}_${payload.wrong_count}`;
    const now = Date.now();
    if (signature === lastSyncSignature && (now - lastSyncTimestamp < 3000)) {
      return {
        success: true,
        message: '이미 구글 시트에 1회 정상 기록되었습니다.',
      };
    }
    lastSyncSignature = signature;
    lastSyncTimestamp = now;

    try {
      const urlObj = new URL(targetUrl);
      const studentName = payload.student_name || payload.nickname || '학습자';
      const totalTime = payload.total_study_time ?? payload.study_time_sec ?? 0;
      const solved = payload.questions_solved ?? payload.questions_attempted ?? 10;
      const correct = payload.correct_answers ?? payload.correct_count ?? 0;
      const sets = payload.sets_completed ?? payload.sets_of_10_completed ?? 1;
      const acc = payload.accuracy ?? Math.round((correct / (solved || 1)) * 100);

      // The 6 exact columns from attached spreadsheet
      urlObj.searchParams.set('student_name', studentName);
      urlObj.searchParams.set('total_study_time', totalTime.toString());
      urlObj.searchParams.set('questions_solved', solved.toString());
      urlObj.searchParams.set('correct_answers', correct.toString());
      urlObj.searchParams.set('sets_completed', sets.toString());
      urlObj.searchParams.set('accuracy', acc.toString());

      // Backwards-compatible aliases
      urlObj.searchParams.set('nickname', studentName);
      urlObj.searchParams.set('timestamp', payload.timestamp || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
      urlObj.searchParams.set('study_time_sec', (payload.study_time_sec || totalTime).toString());
      urlObj.searchParams.set('correct_count', (payload.correct_count || correct).toString());
      urlObj.searchParams.set('wrong_count', (payload.wrong_count || Math.max(0, solved - correct)).toString());

      // Send single GET request with keepalive: true so browser guarantees transmission
      await fetch(urlObj.toString(), {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        keepalive: true,
      });

      const historyItem: SyncHistoryItem = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        payload,
        success: true,
        message: '학습 데이터가 구글 시트에 성공적으로 기록되었습니다.',
      };
      this.addHistory(historyItem);

      const updatedConfig: GoogleSheetConfig = {
        ...config,
        webAppUrl: targetUrl,
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'success',
      };
      this.saveConfig(updatedConfig);

      return {
        success: true,
        message: '구글 시트에 1개 행이 정상적으로 기록되었습니다.',
      };
    } catch (err) {
      const errMsg = String(err || '전송 실패');
      const historyItem: SyncHistoryItem = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        payload,
        success: false,
        message: errMsg,
      };
      this.addHistory(historyItem);

      return {
        success: false,
        message: `전송 실패: ${errMsg}`,
      };
    }
  },
};
