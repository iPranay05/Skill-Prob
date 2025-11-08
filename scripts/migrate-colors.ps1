# Color Migration PowerShell Script
# Replaces hardcoded colors with semantic Tailwind classes

Write-Host "🎨 Starting Color Migration..." -ForegroundColor Cyan
Write-Host ""

$replacements = @{
    # Primary Purple
    'bg-\[#5e17eb\]' = 'bg-primary'
    'text-\[#5e17eb\]' = 'text-primary'
    'border-\[#5e17eb\]' = 'border-primary'
    'ring-\[#5e17eb\]' = 'ring-primary'
    'bg-\[#4a12c4\]' = 'bg-primary-dark'
    'text-\[#4a12c4\]' = 'text-primary-dark'
    'bg-\[#7c3aed\]' = 'bg-primary-light'
    'text-\[#7c3aed\]' = 'text-primary-light'
    
    # Tailwind purple classes
    'bg-purple-600' = 'bg-primary'
    'text-purple-600' = 'text-primary'
    'border-purple-600' = 'border-primary'
    'bg-purple-700' = 'bg-primary-dark'
    'text-purple-700' = 'text-primary-dark'
    'bg-purple-500' = 'bg-primary-light'
    'text-purple-500' = 'text-primary-light'
    
    # Secondary Green
    'bg-green-600' = 'bg-secondary'
    'text-green-600' = 'text-secondary'
    'bg-green-500' = 'bg-secondary-light'
    'text-green-500' = 'text-secondary-light'
    
    # Error Red
    'bg-red-600' = 'bg-error'
    'text-red-600' = 'text-error'
    'bg-red-500' = 'bg-error'
    'text-red-500' = 'text-error'
    
    # Info Blue
    'bg-blue-600' = 'bg-info'
    'text-blue-600' = 'text-info'
    'bg-blue-500' = 'bg-info'
    'text-blue-500' = 'text-info'
    
    # Accent Orange
    'bg-orange-600' = 'bg-accent'
    'text-orange-600' = 'text-accent'
    'bg-orange-500' = 'bg-accent-light'
    'text-orange-500' = 'text-accent-light'
}

$files = Get-ChildItem -Path "src" -Include *.tsx,*.ts,*.jsx,*.js -Recurse -File

$totalFiles = $files.Count
$modifiedFiles = 0
$currentFile = 0

foreach ($file in $files) {
    $currentFile++
    Write-Progress -Activity "Migrating Colors" -Status "Processing $($file.Name)" -PercentComplete (($currentFile / $totalFiles) * 100)
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Special case for style props
    $content = $content -replace "backgroundColor:\s*['""]#5e17eb['""]", 'className="bg-primary"'
    $content = $content -replace "borderTopColor:\s*['""]#5e17eb['""]", 'className="border-t-primary"'
    $content = $content -replace "style=\{\{\s*borderTopColor:\s*['""]#5e17eb['""]", 'className="border-t-primary"'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Migrated: $($file.FullName)" -ForegroundColor Green
        $modifiedFiles++
    }
}

Write-Host ""
Write-Host "✨ Migration Complete!" -ForegroundColor Cyan
Write-Host "📝 Modified: $modifiedFiles files" -ForegroundColor Green
Write-Host "📋 Unchanged: $($totalFiles - $modifiedFiles) files" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the changes with: git diff" -ForegroundColor White
Write-Host "2. Test your application" -ForegroundColor White
Write-Host "3. Commit the changes" -ForegroundColor White
