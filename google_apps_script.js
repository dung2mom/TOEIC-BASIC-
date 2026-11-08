/**
 * TOEIC Practice - 구글 스프레드시트 자동 연동 스크립트 (Code.gs)
 * 
 * [연동 대상 시트 열 구성 (총 6개 열)]:
 * 1. student name                 : 학습자(학생) 이름
 * 2. total study time             : 총 누적 학습 시간 (초)
 * 3. questions solved             : 총 풀이 문항 수
 * 4. correct answers              : 맞힌 정답 수
 * 5. 10 question sets completed   : 완료한 10문제 세트 수
 * 6. Accuracy(%)                  : 전체 정답률 (%)
 * 
 * [배포 방법]
 * 1. 첨부하신 구글 스프레드시트 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 스크립트를 전체 복사하여 붙여넣기 (Ctrl+S 저장)
 * 3. 우측 상단 파란색 [배포] -> [새 배포] 클릭
 * 4. 유형: [웹 앱] 선택
 * 5. 다음 사용자 권한으로 실행: '나(내 계정)'
 * 6. 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' 선택  <-- 필수!
 * 7. [배포] 버튼을 누른 뒤 발급되는 웹 앱 URL을 복사하여 이용
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // 1. 요청 파라미터 파싱
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
    
    // 데이터 추출 (새 6개 열 및 기존 필드 호환)
    var studentName = data.student_name || data['student name'] || data.nickname || "학생";
    var totalStudyTime = Number(data.total_study_time !== undefined ? data.total_study_time : (data.study_time_sec !== undefined ? data.study_time_sec : 0));
    var questionsSolved = Number(data.questions_solved !== undefined ? data.questions_solved : (data.questions_attempted !== undefined ? data.questions_attempted : 10));
    var correctAnswers = Number(data.correct_answers !== undefined ? data.correct_answers : (data.correct_count !== undefined ? data.correct_count : 0));
    var setsCompleted = Number(data.sets_completed !== undefined ? data.sets_completed : (data.sets_of_10_completed !== undefined ? data.sets_of_10_completed : 1));
    var accuracy = Number(data.accuracy !== undefined ? data.accuracy : Math.round((correctAnswers / (questionsSolved || 1)) * 100));
    
    // 2. 시트 헤더 확인
    var lastRow = sheet.getLastRow();
    var new6Headers = [
      "student name",
      "total study time",
      "questions solved",
      "correct answers",
      "10 question sets completed",
      "Accuracy(%)"
    ];
    
    if (lastRow === 0) {
      // 빈 시트인 경우 요청된 6개 헤더 자동 생성
      sheet.appendRow(new6Headers);
      var headerRange = sheet.getRange(1, 1, 1, new6Headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4F46E5");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
      lastRow = 1;
    }
    
    // 첫 행의 헤더 목록 읽기
    var firstRowHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var firstRowStr = firstRowHeaders.map(function(h) { return String(h).trim().toLowerCase(); });
    
    // 헤더에 'student' 또는 'accuracy'가 포함되어 있으면 6개 열 매핑
    var hasStudentHeader = firstRowStr.some(function(h) { return h.indexOf('student') !== -1; });
    
    if (hasStudentHeader || sheet.getLastColumn() === 6) {
      sheet.appendRow([
        studentName,
        totalStudyTime,
        questionsSolved,
        correctAnswers,
        setsCompleted,
        accuracy + "%"
      ]);
    } else {
      // 기존 5개 열 시트 호환 (nickname, timestamp, study_time_sec, correct_count, wrong_count)
      var wrongAnswers = Math.max(0, questionsSolved - correctAnswers);
      var timestamp = data.timestamp || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
      sheet.appendRow([
        studentName,
        timestamp,
        totalStudyTime,
        correctAnswers,
        wrongAnswers
      ]);
    }
    
    var response = {
      result: "success",
      message: "학습 기록이 구글 시트에 성공적으로 연동 저장되었습니다.",
      data: {
        student_name: studentName,
        total_study_time: totalStudyTime,
        questions_solved: questionsSolved,
        correct_answers: correctAnswers,
        sets_completed: setsCompleted,
        accuracy: accuracy + "%"
      }
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        result: "error",
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  // 브라우저 실시간 전송 (GET 쿼리 파라미터 방식) 지원
  if (e && e.parameter && (e.parameter.student_name || e.parameter.nickname || e.parameter.questions_solved !== undefined)) {
    return doPost(e);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "ready",
      message: "TOEIC Practice 구글 시트 연동 웹앱이 활성화되어 있습니다.",
      columns: [
        "student name",
        "total study time",
        "questions solved",
        "correct answers",
        "10 question sets completed",
        "Accuracy(%)"
      ]
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
