# Fix the final broken className patterns
Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Fix pattern where there's a space before bg-primary"> (missing opening quote)
    $content = $content -replace '"\s+bg-primary">', ' bg-primary">'
    $content = $content -replace '"\s+border-t-primary">', ' border-t-primary">'
    
    Set-Content -Path $_.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($_.FullName)"
}
Write-Host "Done!"
