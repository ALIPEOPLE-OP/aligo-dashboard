' 작업 스케줄러(옛 감시자)가 5분마다 실행함. 서버가 꺼져 있으면 다시 켬(화면에 창 안 뜸).
' 서버가 살아있으면 node가 포트 충돌로 즉시 종료 -> 기존 서버 유지. (오류 팝업 방지용으로도 동작)
Dim sh : Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "C:\Users\AligoCX\Documents\Claude\Projects\운영 지표 자동화"
sh.Run "node save-server.js", 0, False
