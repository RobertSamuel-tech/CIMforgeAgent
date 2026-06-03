$old = "C:\Users\Admin\Downloads\cimplicity-ai-app-main\cimplicity-ai-app-main"
$new = "C:\Users\Admin\Downloads\cimplicity-ai-app-main\cimforge"

if (-not (Test-Path $old)) {
    Write-Host "ERROR: Source folder not found: $old"
    pause; exit 1
}
if (Test-Path $new) {
    Write-Host "ERROR: Target already exists: $new"
    pause; exit 1
}

Rename-Item -Path $old -NewName "cimforge" -Force
if (Test-Path $new) {
    Write-Host ""
    Write-Host "SUCCESS! Folder renamed to: cimforge"
    Write-Host ""
    Write-Host "Next step: Open VS Code and select:"
    Write-Host "  File > Open Folder > $new"
} else {
    Write-Host "ERROR: Rename failed. Make sure VS Code is fully closed."
}
pause
