// =====================================================
//  알리고 운영 지표 — 일일 자동 갱신 스크립트
//  Windows 작업 스케줄러에서 매일 오전 10시 실행
//  node daily-update.js
// =====================================================
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const DATA_DIR = __dirname;
const GAS_URL  = 'https://script.google.com/a/macros/alipeople.kr/s/AKfycbzxW4_uDliJgHApFEdch6JHFelnT61oS74MYpU2oYxfFAcslfwv4l9ngYt5ZdDpDUKqvQ/exec';
const TABS     = { cs: 'CS상담', caller: '인증-발신번호', biz: '인증-사업자' };
const LOG_FILE = path.join(DATA_DIR, 'auto-update.log');

// ── 로그 기록 ──────────────────────────────────────
function log(msg) {
  var now = new Date();
  var kst = new Date(now.getTime() + 9 * 3600000);
  var ts  = kst.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  var line = '[' + ts + '] ' + msg;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

// ── GAS 데이터 fetch (리다이렉트 자동 추적) ─────────
function fetchUrl(urlStr, n) {
  n = n || 0;
  return new Promise(function(resolve) {
    if (n > 5) { resolve({ _error: 'redirect overflow' }); return; }
    var req = https.get(urlStr, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    }, function(res) {
      if ([301,302,307,308].indexOf(res.statusCode) >= 0 && res.headers.location)
        return fetchUrl(res.headers.location, n+1).then(resolve);
      var d = '';
      res.on('data', function(c){ d += c; });
      res.on('end', function(){
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve({ _parseError: true, raw: d.slice(0,200) }); }
      });
    });
    req.on('error', function(e){ resolve({ _networkError: e.message }); });
    req.setTimeout(60000, function(){ req.destroy(); resolve({ _timeout: true }); });
  });
}

// ── kpi.json 계산 ────────────────────────────────
function computeKPI(cs, caller, biz, isoStr) {
  var now = new Date();
  function ds(v) {
    var m = String(v||'').match(/(\d{4}[-./]\d{2}[-./]\d{2})/);
    return m ? m[1].replace(/[./]/g,'-') : '';
  }
  function cutDate(days) {
    var d = new Date(now); d.setDate(d.getDate()-days);
    return d.toISOString().slice(0,10);
  }
  function weekMon(s) {
    var d = new Date(s), day = d.getDay();
    d.setDate(d.getDate() + (day===0?-6:1-day));
    return d.toISOString().slice(0,10);
  }
  var cut30 = cutDate(30), cut84 = cutDate(84);
  var total = cs.length;
  var cs30  = cs.filter(function(r){ return ds(r['문의 일시']) >= cut30; }).length;
  var doneCount = cs.filter(function(r){
    var s = String(r['답변 상태']||'');
    return s.indexOf('완료')>=0 || s.indexOf('답변')>=0;
  }).length;
  var rate = total>0 ? Math.round(doneCount/total*1000)/10 : 0;
  var unhandled = cs.filter(function(r){
    var s = String(r['답변 상태']||'');
    return s.indexOf('완료')<0 && s.indexOf('답변')<0;
  }).length;
  var times = [];
  cs.forEach(function(r){
    var q=ds(r['문의 일시']), a=ds(r['답변 일시']||r['처리 일시']||'');
    if(q&&a&&a>q){ var h=(new Date(a)-new Date(q))/3600000; if(h>=0&&h<720) times.push(h); }
  });
  var avgTime = times.length ? Math.round(times.reduce(function(a,b){return a+b;},0)/times.length*10)/10 : 0;
  var authWait = (caller||[]).filter(function(r){ return String(r['인증 상태']||'').indexOf('대기')>=0; }).length
               + (biz||[]).filter(function(r){ return String(r['인증 상태']||'').indexOf('대기')>=0; }).length;
  var weekMap = {};
  cs.forEach(function(r){
    var d=ds(r['문의 일시']);
    if(d>=cut84){ var wk=weekMon(d); weekMap[wk]=(weekMap[wk]||0)+1; }
  });
  var wkLabels = Object.keys(weekMap).sort().slice(-12);
  var wkVals   = wkLabels.map(function(w){ return weekMap[w]; });
  var wkAvg    = wkVals.length ? Math.round(wkVals.reduce(function(a,b){return a+b;},0)/wkVals.length) : 0;
  var typeMap = {};
  cs.forEach(function(r){
    var t=String(r['문의 유형']||r['유형']||r['카테고리']||'etc');
    typeMap[t]=(typeMap[t]||0)+1;
  });
  var typeTop5 = Object.entries(typeMap).sort(function(a,b){return b[1]-a[1];}).slice(0,5)
    .map(function(e){ return {label:e[0], count:e[1]}; });
  var t2=0,t8=0,t24=0,ov=0;
  times.forEach(function(t){ if(t<=2)t2++; else if(t<=8)t8++; else if(t<=24)t24++; else ov++; });
  return {
    updatedAt: isoStr,
    cs: { total:total, last30:cs30, completionRate:rate, unhandled:unhandled, avgTime:avgTime },
    auth: { caller:(caller||[]).length, biz:(biz||[]).length, waiting:authWait },
    trend: { labels:wkLabels, values:wkVals, avg:wkAvg },
    typeTop5: typeTop5,
    timeDist: { under2h:t2, under8h:t8, under24h:t24, over24h:ov }
  };
}

// ── 메인 갱신 함수 ────────────────────────────────
async function runUpdate() {
  log('════════════════════════════════════');
  log('  자동 갱신 시작 (Windows 작업 스케줄러)');
  log('════════════════════════════════════');

  var results = {}, hasError = false;

  for (var key of Object.keys(TABS)) {
    var tab = TABS[key];
    var raw = await fetchUrl(GAS_URL + '?sheet=' + encodeURIComponent(tab));

    if (!Array.isArray(raw)) {
      var msg = raw._timeout ? 'timeout' : raw._networkError || 'parse error';
      log('[' + tab + '] ❌ ' + msg);
      hasError = true;
      results[key] = [];
      continue;
    }
    if (raw.length && raw[0] && raw[0]._error) {
      log('[' + tab + '] ❌ GAS 오류: ' + raw[0]._error);
      hasError = true;
      results[key] = [];
      continue;
    }
    results[key] = raw;
    log('[' + tab + '] ✅ ' + raw.length + '행');
  }

  // 하나라도 실패하면 기존 data.js 유지
  if (hasError && (!results.cs.length || !results.caller.length || !results.biz.length)) {
    log('⚠️ 일부 시트 로드 실패 — 기존 data.js 유지');
    log('════════════════════════════════════');
    return;
  }

  var cs = results.cs, caller = results.caller, biz = results.biz;
  var now    = new Date();
  var kstStr = new Date(now.getTime() + 9*3600000).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'});
  var isoStr = now.toISOString();

  // data.js 헤더
  var header = [
    '// ═══════════════════════════════════════════════════════',
    '//  알리고 운영 지표 — 사전 로드 데이터',
    '//  마지막 업데이트: ' + kstStr + ' (KST)',
    '//  CS: ' + cs.length + '행  발신번호: ' + caller.length + '행  사업자: ' + biz.length + '행  채팅: 0행',
    '//  이 파일은 daily-update.js 가 자동 생성합니다',
    '// ═══════════════════════════════════════════════════════'
  ].join('\n');

  var content = header + '\n'
    + 'window._PRELOADED = {\n'
    + '  cs:        ' + JSON.stringify(cs)     + ',\n'
    + '  caller:    ' + JSON.stringify(caller) + ',\n'
    + '  biz:       ' + JSON.stringify(biz)    + ',\n'
    + '  chat:      [],\n'
    + '  updatedAt: "' + isoStr + '"\n'
    + '};\n';

  fs.writeFileSync(path.join(DATA_DIR, 'data.js'), content, 'utf8');
  log('✅ data.js 갱신 완료 (CS:' + cs.length + '  발신번호:' + caller.length + '  사업자:' + biz.length + ')');

  // kpi.json 갱신
  try {
    var kpi = computeKPI(cs, caller, biz, isoStr);
    fs.writeFileSync(path.join(DATA_DIR, 'kpi.json'), JSON.stringify(kpi, null, 2), 'utf8');
    log('✅ kpi.json 갱신 완료');
  } catch(e) {
    log('⚠️ kpi.json 오류: ' + e.message);
  }

  log('════════════════════════════════════');
}

runUpdate().catch(function(e) {
  log('❌ 치명적 오류: ' + e.message);
  process.exit(1);
});
