-- Resolve AutoBookBuilder.command sitting next to this launcher, wherever the project is cloned.
tell application "System Events"
	set launcherFolder to POSIX path of (container of (path to me))
end tell
set launcherPath to launcherFolder & "/AutoBookBuilder.command"

try
	do shell script "chmod +x " & quoted form of launcherPath
	do shell script "open -a Terminal " & quoted form of launcherPath
on error errMsg
	display dialog "Auto Book Builder launcher failed: " & errMsg buttons {"OK"} default button "OK"
end try
