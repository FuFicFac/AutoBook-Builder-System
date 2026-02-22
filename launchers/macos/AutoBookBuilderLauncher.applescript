set launcherPath to "/Volumes/New Home/Crucial Backup /Codex/Gassian-Blender-MCP/NarrativeSystemDeploymentBlueprint/launchers/macos/AutoBookBuilder.command"

try
	do shell script "chmod +x " & quoted form of launcherPath
	do shell script "open -a Terminal " & quoted form of launcherPath
on error errMsg
	display dialog "Auto Book Builder launcher failed: " & errMsg buttons {"OK"} default button "OK"
end try
