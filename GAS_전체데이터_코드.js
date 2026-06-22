// ═══════════════════════════════════════════════════════════════
//  알리고 운영 지표 GAS — 전체 데이터 반환 버전
//  [사용법] Google Apps Script 편집기에 이 내용을 붙여넣고
//           배포 → 새 배포 → 웹앱 → "모든 사용자" → 배포
//
//  ★ 핵심: getRange(1,1,lastRow,lastCol)으로 필터뷰를 완전 무시하고
//           시트의 실제 마지막 행까지 전부 읽습니다.
// ═══════════════════════════════════════════════════════════════

function doGet(e) {
  const sheetName = e.parameter.sheet || '';
  const callback  = e.parameter.callback || '';
  const mode      = e.parameter.mode || '';

  try {
    if (!sheetName) {
      return makeResponse([{ _error: 'sheet 파라미터가 없습니다.' }], callback);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(sheetName);

    if (!sh) {
      return makeResponse([{ _error: '시트를 찾을 수 없습니다: ' + sheetName }], callback);
    }

    // ★ getLastRow / getLastColumn — 필터뷰와 무관하게 실제 데이터 끝까지 읽음
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();

    if (lastRow < 2) {
      return makeResponse([], callback);  // 헤더만 있거나 빈 시트
    }

    // 헤더 + 전체 데이터를 한 번에 읽기
    const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
    const rawHeaders = values[0];

    // 빈 헤더 열 제외
    const cols = rawHeaders
      .map((h, i) => ({ name: String(h).trim(), idx: i }))
      .filter(c => c.name !== '');

    const data = [];
    for (let r = 1; r < values.length; r++) {
      const row = values[r];

      // 완전히 빈 행은 건너뜀
      const isEmpty = cols.every(c => {
        const v = row[c.idx];
        return v === '' || v === null || v === undefined;
      });
      if (isEmpty) continue;

      const obj = {};
      cols.forEach(c => {
        const v = row[c.idx];
        if (v instanceof Date) {
          // 구글 시트 epoch(1899-12-30) 기준 1일 미만 → 시간/기간 값
          // 예: resolutionTime, 답변시간 등 duration 컬럼 → 초(seconds) 정수로 변환
          const EPOCH = new Date(Date.UTC(1899, 11, 30));
          const diffMs = v.getTime() - EPOCH.getTime();
          if (diffMs >= 0 && diffMs < 86400000) {
            // 1일 미만 = duration/time 값 → 초 단위로 변환
            obj[c.name] = Math.round(diffMs / 1000);
          } else {
            // 일반 날짜 또는 날짜+시간 → 시간 정보 포함해서 변환
            const formatted = Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
            // 시간이 00:00:00이면 날짜만 (순수 날짜 컬럼)
            obj[c.name] = formatted.endsWith('00:00:00')
              ? formatted.slice(0, 10)
              : formatted;
          }
        } else {
          obj[c.name] = v;
        }
      });
      data.push(obj);
    }

    if (mode === 'iframe') {
      return iframeResponse(data, sheetName);
    }
    return makeResponse(data, callback);

  } catch (err) {
    return makeResponse([{ _error: err.toString() }], callback);
  }
}

// iframe + postMessage 방식 응답
function iframeResponse(data, sheet) {
  const escaped = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');
  const html = `<!DOCTYPE html><html><body><script>
    (function(){
      var d=${escaped};
      window.parent.postMessage({_gasSheet:${JSON.stringify(sheet)},data:d},'*');
    })();
  <\/script></body></html>`;
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// JSON 또는 JSONP 응답
function makeResponse(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
