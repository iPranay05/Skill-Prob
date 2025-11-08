# Fix broken className attributes where closing quote is missing
Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName | Out-String
    
    # Fix pattern: className="..." bg-primary"> to className="... bg-primary">
    $content = $content -replace '(className="[^"]*")\s+bg-primary">', '$1 bg-primary">'
    $content = $content -replace '(className="[^"]*")\s+border-t-primary">', '$1 border-t-primary">'
    
    Set-Content -Path $_.FullName -Value $content
    Write-Host "Fixed: $($_.FullName)"
}
Write-Host "Done!"
