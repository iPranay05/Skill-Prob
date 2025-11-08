# Fix className inside style prop errors
Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName | Out-String
    $content = $content -replace 'style=\{\s*className="bg-primary"\s*\}', 'className="bg-primary"'
    $content = $content -replace 'style=\{\s*\{\s*className="bg-primary"\s*\}\s*\}', 'className="bg-primary"'
    $content = $content -replace 'style=\{\s*\{\s*className="border-t-primary"\s*\}\s*\}', 'className="border-t-primary"'
    Set-Content -Path $_.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($_.FullName)"
}
Write-Host "Done!"
