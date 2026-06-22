Dim sh : Set sh = CreateObject("WScript.Shell")
Dim fso : Set fso = CreateObject("Scripting.FileSystemObject")
Dim folder : folder = fso.GetFile(WScript.ScriptFullName).ParentFolder.Path
sh.CurrentDirectory = folder
sh.Run "node update-server.js", 0, False
