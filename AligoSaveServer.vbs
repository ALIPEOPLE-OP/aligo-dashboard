' Aligo save-server : 로그인 시 실행 + 5분마다 자동 복구 (관리자 권한 불필요, 화면에 창 안 뜸)
' - 서버가 살아있으면: node가 포트(7799) 충돌로 즉시 종료 -> 기존 서버 그대로 유지
' - 서버가 죽어있으면: 새로 켜짐 -> 최대 5분 안에 자동 복구
Dim sh : Set sh = CreateObject("WScript.Shell")
Do
  sh.CurrentDirectory = "C:\Users\AligoCX\Documents\Claude\Projects\운영 지표 자동화"
  sh.Run "node save-server.js", 0, False
  WScript.Sleep 300000
Loop
