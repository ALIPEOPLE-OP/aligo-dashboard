' Launch save-server.js hidden (no console window) from this folder
Dim sh : Set sh = CreateObject("WScript.Shell")
Dim fso : Set fso = CreateObject("Scripting.FileSystemObject")
sh.CurrentDirectory = fso.GetFile(WScript.ScriptFullName).ParentFolder.Path
sh.Run "node save-server.js", 0, False
