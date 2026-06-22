// ══════════════════════════════════════════════════════════════════
//  [활동 로그 기능] - 기존 GAS 코드 아래에 이 전체를 붙여넣기 하세요
//  붙여넣기 후 → 저장(Ctrl+S) → 배포 → 새 버전으로 배포
// ══════════════════════════════════════════════════════════════════

// ── 기존 doGet 함수 상단에 아래 if 블록들을 추가하세요 ──────────────
// 기존 doGet(e) 함수 안, 맨 위에 삽입:
/*
  // 활동 로그 저장
  if (e.parameter.action === 'log') {
    var result = writeActivityLog(e.parameter);
    var cb = e.parameter.callback;
    var json = JSON.stringify(result);
    if (cb) return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  // 활동 로그 조회
  if (e.parameter.action === 'getLogs') {
    var result = getActivityLogs(parseInt(e.parameter.limit) || 200);
    var cb = e.parameter.callback;
    var json = JSON.stringify(result);
    if (cb) return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }
*/

// ── 아래 함수들은 doGet 함수 밖, 파일 맨 아래에 추가하세요 ──────────

/**
 * 활동 로그를 Google Sheets '활동로그' 시트에 저장
 */
function writeActivityLog(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName('활동로그');

    // 시트가 없으면 자동 생성
    if (!logSheet) {
      logSheet = ss.insertSheet('활동로그');
      logSheet.appendRow(['일시', '사용자', '이메일', '행동', '상세', '타임스탬프']);
      logSheet.setFrozenRows(1);
      // 헤더 스타일
      logSheet.getRange(1, 1, 1, 6).setBackground('#1e293b').setFontColor('white').setFontWeight('bold');
      logSheet.setColumnWidth(1, 160);
      logSheet.setColumnWidth(2, 90);
      logSheet.setColumnWidth(3, 200);
      logSheet.setColumnWidth(4, 110);
      logSheet.setColumnWidth(5, 280);
    }

    var now = new Date();
    var kstOffset = 9 * 60 * 60 * 1000; // KST = UTC+9
    var kstDate = new Date(now.getTime() + kstOffset);
    var dateStr = Utilities.formatDate(kstDate, 'UTC', 'yyyy-MM-dd HH:mm:ss');

    logSheet.appendRow([
      dateStr,
      params.user ? params.user.split('(')[0].trim() : '알 수 없음',
      params.email || '',
      params.activity || '',
      params.details || '',
      params.ts || now.toISOString()
    ]);

    return { ok: true };
  } catch (e) {
    Logger.log('활동 로그 저장 오류: ' + e.message);
    return { ok: false, error: e.message };
  }
}

/**
 * 활동 로그 최근 N건 조회 (최신순)
 */
function getActivityLogs(limit) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName('활동로그');
    if (!logSheet) return { logs: [] };

    var data = logSheet.getDataRange().getValues();
    if (data.length <= 1) return { logs: [] };

    // 헤더 제외, 최신순 정렬
    var rows = data.slice(1).reverse().slice(0, limit || 200);

    var logs = rows.map(function(r) {
      return {
        일시:    r[0] ? String(r[0]) : '',
        사용자:  r[1] ? String(r[1]) : '',
        이메일:  r[2] ? String(r[2]) : '',
        행동:    r[3] ? String(r[3]) : '',
        상세:    r[4] ? String(r[4]) : ''
      };
    });

    return { logs: logs };
  } catch (e) {
    Logger.log('활동 로그 조회 오류: ' + e.message);
    return { logs: [], error: e.message };
  }
}
