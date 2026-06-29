@echo off
cd /d "%~dp0"
node -e "global.window={};try{require('./data.js');var d=window._PRELOADED;var fs=require('fs');fs.writeFileSync('verify.txt','OK cs='+d.cs.length+' caller='+d.caller.length+' biz='+d.biz.length+' updatedAt='+d.updatedAt+' bytes='+fs.statSync('data.js').size);}catch(e){require('fs').writeFileSync('verify.txt','FAIL '+e.message);}"
