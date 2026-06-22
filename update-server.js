// Aligo Update Server - port 7799
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT     = 7799;
const DATA_DIR = __dirname;
const GAS_URL  = 'https://script.google.com/a/macros/alipeople.kr/s/AKfycbzxW4_uDliJgHApFEdch6JHFelnT61oS74MYpU2oYxfFAcslfwv4l9ngYt5ZdDpDUKqvQ/exec';
const TABS = { cs: 'CS상담', caller: '인증-발신번호', biz: '인증-사업자' };

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function sendJSON(res, status, obj) {
  setCORS(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj, null, 2));
}

function fetchUrl(urlStr, n) {
  n = n || 0;
  return new Promise(function(resolve) {
    if (n > 5) { resolve({ _error: 'redirect overflow' }); return; }
    var mod = urlStr.startsWith('https') ? https : http;
    var req = mod.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, function(res) {
      if ([301,302,307,308].indexOf(res.statusCode) >= 0 && res.headers.location)
        return fetchUrl(res.headers.location, n+1).then(resolve);
      var d = '';
      res.on('data', function(c){ d += c; });
      res.on('end', function(){
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve({ _parseError: true, raw: d.slice(0,300) }); }
      });
    });
    req.on('error', function(e){ resolve({ _networkError: e.message }); });
    req.setTimeout(60000, function(){ req.destroy(); resolve({ _timeout: true }); });
  });
}

function loadExistingFunnel() {
  try {
    var t = fs.readFileSync(path.join(DATA_DIR, 'data.js'), 'utf8');
    var m = t.match(/funnel\s*:\s*(\[[\s\S]*?\])\s*,\s*updatedAt/);
    if (m) return JSON.parse(m[1]);
  } catch(e) {}
  return [];
}

function getDateRange(rows) {
  var dates = rows.map(function(r){
    return Object.values(r).find(function(v){ return /^\d{4}-\d{2}-\d{2}/.test(String(v)); }) || '';
  }).filter(Boolean).map(function(d){ return String(d).slice(0,10); }).sort();
  return dates.length ? dates[0] + ' ~ ' + dates[dates.length-1] : '-';
}

function computeKPI(cs, caller, biz, funnel, isoStr) {
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

  var hMap = {};
  cs.forEach(function(r){
    var h=String(r['담당자']||r['처리 담당자']||'N/A');
    hMap[h]=(hMap[h]||0)+1;
  });
  var handlers = Object.entries(hMap).sort(function(a,b){return b[1]-a[1];}).slice(0,6)
    .map(function(e){ return {name:e[0], count:e[1]}; });

  return {
    updatedAt: isoStr,
    cs: { total:total, last30:cs30, completionRate:rate, unhandled:unhandled, avgTime:avgTime },
    auth: { caller:(caller||[]).length, biz:(biz||[]).length, waiting:authWait },
    trend: { labels:wkLabels, values:wkVals, avg:wkAvg },
    typeTop5: typeTop5,
    timeDist: { under2h:t2, under8h:t8, under24h:t24, over24h:ov },
    handlers: handlers,
    funnel: funnel||[]
  };
}

async function runUpdate(onLog) {
  var results = {}, errors = {};
  for (var key of Object.keys(TABS)) {
    var tab = TABS[key];
    onLog('['+tab+'] fetching...');
    var raw = await fetchUrl(GAS_URL+'?sheet='+encodeURIComponent(tab));
    if (!Array.isArray(raw)) {
      var msg = raw._timeout?'timeout':raw._networkError||'parse error';
      onLog('['+tab+'] ERROR: '+msg); errors[key]=msg; results[key]=[]; continue;
    }
    if (raw.length && raw[0] && raw[0]._error) {
      onLog('['+tab+'] GAS ERROR: '+raw[0]._error); errors[key]=raw[0]._error; results[key]=[]; continue;
    }
    results[key]=raw;
    onLog('['+tab+'] OK '+raw.length+' rows  '+getDateRange(raw));
  }

  var existingFunnel = loadExistingFunnel();
  onLog('[funnel] keeping '+existingFunnel.length+' weeks');

  var now=new Date();
  var kstStr=new Date(now.getTime()+9*3600000).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
  var isoStr=now.toISOString();
  var cs=results.cs||[], caller=results.caller||[], biz=results.biz||[];

  var content = '// Aligo data - updated '+kstStr+'\n'
    + 'window._PRELOADED = {\n'
    + '  cs:        '+JSON.stringify(cs)+',\n'
    + '  caller:    '+JSON.stringify(caller)+',\n'
    + '  biz:       '+JSON.stringify(biz)+',\n'
    + '  funnel:    '+JSON.stringify(existingFunnel)+',\n'
    + '  updatedAt: "'+isoStr+'"\n'
    + '};\n';
  fs.writeFileSync(path.join(DATA_DIR,'data.js'), content, 'utf8');
  onLog('data.js saved - '+(cs.length+caller.length+biz.length)+' rows');

  try {
    var kpi = computeKPI(cs, caller, biz, existingFunnel, isoStr);
    fs.writeFileSync(path.join(DATA_DIR,'kpi.json'), JSON.stringify(kpi,null,2), 'utf8');
    onLog('kpi.json saved');
  } catch(e){ onLog('kpi.json error: '+e.message); }

  return { ok:true, updatedAt:kstStr, rows:{cs:cs.length,caller:caller.length,biz:biz.length}, errors:Object.keys(errors).length?errors:null };
}

var server = http.createServer(async function(req, res) {
  if (req.method==='OPTIONS') { setCORS(res); res.writeHead(204); res.end(); return; }
  if (req.url==='/status') { sendJSON(res,200,{ok:true,port:PORT,time:new Date().toISOString()}); return; }
  if (req.url==='/kpi') {
    try { sendJSON(res,200,JSON.parse(fs.readFileSync(path.join(DATA_DIR,'kpi.json'),'utf8'))); }
    catch(e) { sendJSON(res,404,{ok:false,error:'kpi.json not found - run /update first'}); }
    return;
  }
  if (req.url==='/update') {
    console.log('['+new Date().toLocaleString('ko-KR')+'] update');
    var logs=[];
    try {
      var result = await runUpdate(function(m){ logs.push(m); console.log('  '+m); });
      sendJSON(res,200,Object.assign({},result,{logs:logs}));
    } catch(e) { sendJSON(res,500,{ok:false,error:e.message,logs:logs}); }
    return;
  }
  // 정적 파일 서빙 (index.html, data.js, kpi.json 등)
  var STATIC = ['/', '/index.html', '/data.js', '/kpi.json'];
  var MIME = { '.html':'text/html;charset=utf-8', '.js':'application/javascript;charset=utf-8',
               '.json':'application/json;charset=utf-8', '.css':'text/css', '.png':'image/png' };
  var urlPath = req.url.split('?')[0];
  if (req.method==='GET' && (STATIC.indexOf(urlPath)>=0 || /\.(html|js|json|css|png|ico)$/.test(urlPath))) {
    var fname = (urlPath==='/' || urlPath==='/index.html') ? 'index.html' : urlPath.replace(/^\//,'');
    try {
      var fpath = path.join(DATA_DIR, fname);
      var ext = path.extname(fname) || '.html';
      var mime = MIME[ext] || 'application/octet-stream';
      setCORS(res);
      res.writeHead(200, {'Content-Type': mime});
      res.end(fs.readFileSync(fpath));
    } catch(e) { sendJSON(res,404,{ok:false,error:'File not found: '+fname}); }
    return;
  }
  if (req.url==='/save' && req.method==='POST') {
    var body='';
    req.on('data',function(c){body+=c;});
    req.on('end',function(){
      try {
        var p=JSON.parse(body);
        var now=new Date(), kst=new Date(now.getTime()+9*3600000).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
        var c='// Aligo data - updated '+kst+'\nwindow._PRELOADED = {\n'
          +'  cs:'+JSON.stringify(p.cs||[])+',\n  caller:'+JSON.stringify(p.caller||[])
          +',\n  biz:'+JSON.stringify(p.biz||[])+',\n  funnel:'+JSON.stringify(p.funnel||[])
          +',\n  updatedAt:"'+now.toISOString()+'"\n};\n';
        fs.writeFileSync(path.join(DATA_DIR,'data.js'),c,'utf8');
        sendJSON(res,200,{ok:true,updatedAt:kst});
      } catch(e){ sendJSON(res,500,{ok:false,error:e.message}); }
    });
    return;
  }
  sendJSON(res,404,{ok:false,error:'Not found'});
});

server.listen(PORT,'127.0.0.1',function(){
  console.log('\n  Aligo Update Server running at http://localhost:'+PORT+'\n');
});
server.on('error',function(e){
  if(e.code==='EADDRINUSE') console.error('Port '+PORT+' already in use.');
  else console.error('Server error:',e.message);
  process.exit(1);
});
