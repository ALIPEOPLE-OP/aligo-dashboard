Dim sh  : Set sh  = CreateObject("WScript.Shell")
Dim fso : Set fso = CreateObject("Scripting.FileSystemObject")
Dim folder : folder = fso.GetFile(WScript.ScriptFullName).ParentFolder.Path
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & folder & "\서버_감시자.ps1""", 0, True
