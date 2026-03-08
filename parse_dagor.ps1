# Define the target directory
$targetDir = "C:\workspace\DagorEngine"

# Add folder names or partial paths to ignore (e.g., "testData", "diagnostics")
$ignoreDirs = @("prog\1stPartyLibs\quirrel\quirrel\testData\diagnostics")

if (-not (Test-Path $targetDir)) {
    Write-Host "Directory $targetDir not found." -ForegroundColor Red
    exit
}

$ignorePattern = ($ignoreDirs | ForEach-Object { [regex]::Escape($_) }) -join "|"

# Get files and sort them by FullName for a stable, predictable order
$nutFiles = Get-ChildItem -Path $targetDir -Filter *.nut -Recurse |
    Where-Object { $_.FullName -notmatch $ignorePattern } |
    Sort-Object FullName

$foundError = $false

foreach ($file in $nutFiles) {
    # Run tree-sitter parse (no --quiet to get the tree)
    $result = tree-sitter parse "$($file.FullName)" 2>&1
    $treeLines = $result | Out-String -Stream

    # Locate the error line in the tree-sitter output
    $errorTreeIdx = -1
    for ($i = 0; $i -lt $treeLines.Count; $i++) {
        if ($treeLines[$i] -match "ERROR") {
            $errorTreeIdx = $i
            break
        }
    }

    if ($errorTreeIdx -ge 0) {
        $foundError = $true
        Write-Host "`n[!] Syntax Error in: $($file.FullName)" -ForegroundColor Red

        # --- Source Code Context ---
        if ($treeLines[$errorTreeIdx] -match "[\(\[](\d+),\s*(\d+)[\)\]]") {
            $lineIdx = [int]$Matches[1]
            $fileContent = Get-Content $file.FullName

            $srcStart = [Math]::Max(0, $lineIdx - 5)
            $srcEnd = [Math]::Min($fileContent.Count - 1, $lineIdx + 5)

            Write-Host "`n--- Source Code Context (Line $($lineIdx + 1)) ---" -ForegroundColor DarkCyan
            for ($i = $srcStart; $i -le $srcEnd; $i++) {
                $prefix = if ($i -eq $lineIdx) { "$($i + 1) > " } else { "$($i + 1) | " }
                $color = if ($i -eq $lineIdx) { "Red" } else { "Gray" }
                Write-Host ($prefix + $fileContent[$i]) -ForegroundColor $color
            }
        }

        # --- Tree-Sitter Tree Context ---
        Write-Host "`n--- Tree-Sitter Output Context (+/- 5 lines) ---" -ForegroundColor DarkYellow
        $treeStart = [Math]::Max(0, $errorTreeIdx - 5)
        $treeEnd = [Math]::Min($treeLines.Count - 1, $errorTreeIdx + 5)

        for ($i = $treeStart; $i -le $treeEnd; $i++) {
            if ($i -eq $errorTreeIdx) {
                Write-Host ">>> $($treeLines[$i].TrimEnd())" -ForegroundColor Red
            } else {
                Write-Host "    $($treeLines[$i].TrimEnd())" -ForegroundColor Gray
            }
        }

        Write-Host ("`n" + "-" * 60)
        break # Early exit to focus on this specific file
    }
}

if (-not $foundError) {
    Write-Host "Success: All $($nutFiles.Count) checked .nut files parsed correctly." -ForegroundColor Green
}
