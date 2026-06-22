// Windows-side validation of data.js biz array. Writes counts to _bizout.txt.
const fs = require('fs'), path = require('path');
const dir = __dirname;
const out = [];
function push(m){ out.push(m); }
try {
  const txt = fs.readFileSync(path.join(dir,'data.js'),'utf8');
  push('파일 바이트수: ' + Buffer.byteLength(txt,'utf8'));
  const lines = txt.split('\n');
  push('총 줄 수: ' + lines.length);
  function grab(key){
    const ln = lines.find(l => l.trimStart().startsWith(key+':'));
    if(!ln) return null;
    let s = ln.replace(new RegExp('^\\s*'+key+':\\s*'),'').trim();
    if(s.endsWith(',')) s = s.slice(0,-1);
    return s;
  }
  for(const k of ['cs','caller','biz']){
    const s = grab(k);
    if(s===null){ push(k+': (줄 없음)'); continue; }
    push(k+' 줄 길이: '+s.length+' / 끝2글자: '+JSON.stringify(s.slice(-2)));
    try{ const arr=JSON.parse(s); push(k+' 파싱 OK, 건수: '+arr.length);
      if(k==='biz'){
        const byStatus={}; for(const r of arr){const v=(r['인증 상태']||'(빈)').toString().trim();byStatus[v]=(byStatus[v]||0)+1;}
        push('biz 인증상태별: '+JSON.stringify(byStatus));
        const dts=arr.map(r=>(r['요청일시']||'').toString().trim()).filter(Boolean).sort();
        push('biz 요청일시 최소~최대: '+dts[0]+' ~ '+dts[dts.length-1]);
        const byDay={}; for(const d of dts){const day=d.slice(0,10);byDay[day]=(byDay[day]||0)+1;}
        const days=Object.entries(byDay).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);
        push('biz 최근 날짜별: '+JSON.stringify(days));
      }
    }catch(e){ push(k+' 파싱 실패: '+e.message); }
  }
} catch(e){ push('READ ERROR: '+e.message); }
fs.writeFileSync(path.join(dir,'_bizout.txt'), out.join('\n'),'utf8');
