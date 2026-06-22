// ═══════════════════════════════════════════════════════════════
//  알리고 운영 지표 GAS — Push 방식 자동 업데이트
//
//  [설치 방법]
//  1. Google Apps Script 편집기 열기 (기존 GAS 프로젝트)
//  2. 이 파일의 내용을 기존 코드 맨 아래에 붙여넣기
//  3. 아래 DRIVE_FOLDER_ID 값 설정 (설정 방법은 주석 참고)
//  4. 상단 메뉴 → 실행 → setDailyTrigger 실행 (최초 1회만)
//  5. 완료! 매일 오전 8시에 자동으로 data.js가 갱신됩니다
// ═══════════════════════════════════════════════════════════════

// ★★★ 필수 설정: Google Drive 폴더 ID ★★★
//
// [폴더 ID 찾는 방법]
// 1. Google Drive(drive.google.com) 열기
// 2. 대시보드 data.js 파일이 있는 폴더 열기
//    (없으면 새 폴더 "운영지표_자동화" 만들기)
// 3. 주소창 URL 확인:
//    https://drive.google.com/drive/folders/★이부분★
// 4. ★이부분★을 아래 따옴표 안에 붙여넣기
//
const DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID_HERE';  // ← 여기 수정

// ═══════════════════════════════════════════════════════════════
//  메인 함수: 4개 시트 읽기 → data.js 생성 → Drive에 저장
// ═══════════════════════════════════════════════════════════════
function generateAndSaveDataJs() {
  const TABS = {
    cs:     'CS상담',
    caller: '인증-발신번호',
    biz:    '인증-사업자',
    chat:   '채팅상담'
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = {};
  const rowCounts = {};

  // 4개 시트 데이터 읽기
  for (const [key, sheetName] of Object.entries(TABS)) {
    try {
      const sh = ss.getSheetByName(sheetName);
      if (!sh) {
        console.log(`⚠️ 시트 없음: ${sheetName}`);
        results[key] = [];
        rowCounts[key] = 0;
        continue;
      }

      const lastRow = sh.getLastRow();
      const lastCol = sh.getLastColumn();

      if (lastRow < 2) {
        results[key] = [];
        rowCounts[key] = 0;
        continue;
      }

      const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
      const rawHeaders = values[0];

      const cols = rawHeaders
        .map((h, i) => ({ name: String(h).trim(), idx: i }))
        .filter(c => c.name !== '');

      const data = [];
      for (let r = 1; r < values.length; r++) {
        const row = values[r];
        const isEmpty = cols.every(c => {
          const v = row[c.idx];
          return v === '' || v === null || v === undefined;
        });
        if (isEmpty) continue;

        const obj = {};
        cols.forEach(c => {
          const v = row[c.idx];
          if (v instanceof Date) {
            const EPOCH = new Date(Date.UTC(1899, 11, 30));
            const diffMs = v.getTime() - EPOCH.getTime();
            if (diffMs >= 0 && diffMs < 86400000) {
              obj[c.name] = Math.round(diffMs / 1000);
            } else {
              const formatted = Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
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

      results[key] = data;
      rowCounts[key] = data.length;
      console.log(`✅ ${sheetName}: ${data.length}행`);

    } catch (err) {
      console.log(`❌ ${sheetName} 오류: ${err.toString()}`);
      results[key] = [];
      rowCounts[key] = 0;
    }
  }

  // 전체 데이터가 0행이면 저장 중단
  const total = Object.values(rowCounts).reduce((s, v) => s + v, 0);
  if (total === 0) {
    console.log('⚠️ 데이터를 가져오지 못했습니다 — 파일 저장 건너뜀');
    return;
  }

  // 기존 data.js에서 funnel 데이터 보존
  let existingFunnel = [];
  try {
    if (DRIVE_FOLDER_ID !== 'YOUR_FOLDER_ID_HERE') {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const files = folder.getFilesByName('data.js');
      if (files.hasNext()) {
        const existingContent = files.next().getBlob().getDataAsString();
        const m = existingContent.match(/funnel:\s*(\[[\s\S]*?\]),?\s*\n\s*updatedAt/);
        if (m) existingFunnel = JSON.parse(m[1]);
      }
    }
  } catch(e) { /* funnel 보존 실패 시 빈 배열 유지 */ }

  // data.js 내용 생성
  const now = new Date();
  const kstStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  const isoStr = now.toISOString();

  const content =
`// ═══════════════════════════════════════════════════════
//  알리고 운영 지표 — 사전 로드 데이터
//  이 파일은 GAS 자동 트리거가 업데이트합니다
//  마지막 업데이트: ${kstStr} (KST)
//  CS: ${rowCounts.cs}행  발신번호: ${rowCounts.caller}행  사업자: ${rowCounts.biz}행  채팅: ${rowCounts.chat}행
// ═══════════════════════════════════════════════════════
window._PRELOADED = {
  cs:        ${JSON.stringify(results.cs)},
  caller:    ${JSON.stringify(results.caller)},
  biz:       ${JSON.stringify(results.biz)},
  chat:      ${JSON.stringify(results.chat)},
  funnel:    ${JSON.stringify(existingFunnel)},
  updatedAt: "${isoStr}"
};
`;

  // Google Drive에 저장
  try {
    if (DRIVE_FOLDER_ID === 'YOUR_FOLDER_ID_HERE') {
      console.log('❌ DRIVE_FOLDER_ID를 설정해주세요!');
      console.log('   drive.google.com에서 폴더 열고 URL의 folders/ 뒤 ID를 복사하세요.');
      return;
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const files = folder.getFilesByName('data.js');

    if (files.hasNext()) {
      // 기존 파일 덮어쓰기
      const file = files.next();
      file.setContent(content);
      console.log(`✅ data.js 갱신 완료 [${kstStr}]`);
    } else {
      // 새 파일 생성
      folder.createFile('data.js', content, MimeType.PLAIN_TEXT);
      console.log(`✅ data.js 새로 생성 완료 [${kstStr}]`);
    }

    console.log(`CS: ${rowCounts.cs}행 | 발신번호: ${rowCounts.caller}행 | 사업자: ${rowCounts.biz}행 | 채팅: ${rowCounts.chat}행`);

  } catch (err) {
    console.log(`❌ Drive 저장 실패: ${err.toString()}`);
    console.log('   DRIVE_FOLDER_ID가 정확한지, 해당 폴더에 접근 권한이 있는지 확인하세요.');
  }
}

// ═══════════════════════════════════════════════════════════════
//  트리거 등록 함수 — 최초 1회만 실행하면 됩니다
// ═══════════════════════════════════════════════════════════════
function setDailyTrigger() {
  // 기존 동일 트리거 제거 (중복 방지)
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'generateAndSaveDataJs')
    .forEach(t => ScriptApp.deleteTrigger(t));

  // 매일 오전 8시 (한국 시간) 자동 실행 등록
  ScriptApp.newTrigger('generateAndSaveDataJs')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone('Asia/Seoul')
    .create();

  console.log('✅ 트리거 등록 완료 — 매일 오전 8시(KST) 자동 실행');
  console.log('   확인: GAS 편집기 → 왼쪽 메뉴 → 시계 아이콘(트리거)');
}

// ═══════════════════════════════════════════════════════════════
//  트리거 삭제 함수 — 자동 실행 중단이 필요할 때
// ═══════════════════════════════════════════════════════════════
function removeDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'generateAndSaveDataJs');

  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  console.log(`트리거 ${triggers.length}개 삭제 완료`);
}
