set repoHintFile to (POSIX path of (path to home folder)) & ".autobookbuilder_repo"

on pathExists(p)
	try
		do shell script "test -e " & quoted form of p
		return true
	on error
		return false
	end try
end pathExists

on chooseRepoFolder()
	set pickedFolder to choose folder with prompt "Choose your Auto Book Builder repo folder"
	set pickedPath to POSIX path of pickedFolder
	if my pathExists(pickedPath & "scripts/start-autobook.sh") then
		return pickedPath
	end if
	display dialog "That folder does not look like the repo root (missing scripts/start-autobook.sh)." buttons {"Try Again"} default button "Try Again"
	return my chooseRepoFolder()
end chooseRepoFolder

on resolveRepoRoot()
	set appPath to POSIX path of (path to me)
	set appDir to do shell script "dirname " & quoted form of appPath
	set bundledCandidate to do shell script "cd " & quoted form of (appDir & "/../..") & " && pwd"
	if my pathExists(bundledCandidate & "/scripts/start-autobook.sh") then
		return bundledCandidate
	end if
	try
		set savedRepo to do shell script "cat " & quoted form of repoHintFile
		if my pathExists(savedRepo & "/scripts/start-autobook.sh") then
			return savedRepo
		end if
	end try
	set pickedRepo to my chooseRepoFolder()
	do shell script "printf %s " & quoted form of pickedRepo & " > " & quoted form of repoHintFile
	return pickedRepo
end resolveRepoRoot

try
	set repoRoot to my resolveRepoRoot()
	set launchScript to repoRoot & "/scripts/start-autobook.sh"
	do shell script "chmod +x " & quoted form of launchScript
	do shell script "open -a Terminal " & quoted form of launchScript
on error errMsg
	display dialog "Auto Book Builder launcher failed: " & errMsg buttons {"OK"} default button "OK"
end try
