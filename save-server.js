// Minimal crash-proof saver for Aligo data.js  (port 7799)
const http = require('http'), fs = require('fs'), path = require('path');
const DIR = __dirname, PORT = 7799;
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network','true');
}
http.createServer((req,res)=>{
  try { cors(res); } catch(e){}
  if(req.method==='OPTIONS'){ res.writeHead(204); res.end(); return; }
  if(req.url==='/status'){ res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true,port:PORT})); return; }
  if(req.url==='/save' && req.method==='POST'){
    let b=''; req.on('data',c=>b+=c);
    req.on('end',()=>{
      try{
        const p=JSON.parse(b);
        const now=new Date();
        const kst=new Date(now.getTime()+9*3600000).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
        const c='// Aligo data - updated '+kst+'\nwindow._PRELOADED = {\n'
          +'  cs:        '+JSON.stringify(p.cs||[])+',\n'
          +'  caller:    '+JSON.stringify(p.caller||[])+',\n'
          +'  biz:       '+JSON.stringify(p.biz||[])+',\n'
          +'  funnel:    '+JSON.stringify(p.funnel||[])+',\n'
          +'  updatedAt: "'+now.toISOString()+'"\n};\n';
        fs.writeFileSync(path.join(DIR,'data.js'), c, 'utf8');
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true, rows:{cs:(p.cs||[]).length,caller:(p.caller||[]).length,biz:(p.biz||[]).length}, updatedAt:kst}));
      }catch(e){
        try{ res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:false,error:String(e)})); }catch(_){}
      }
    });
    return;
  }
  res.writeHead(404,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:false}));
}).listen(PORT,'127.0.0.1',()=>console.log('save-server running on http://localhost:'+PORT));
