# Fix duplicate className attributes
Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName | Out-String
    
    # Fix pattern: className="..." className="bg-primary"
    # Merge them into one className
    $content = $content -replace '(className="[^"]*")\s+className="bg-primary"', '$1 bg-primary"'
    $content = $content -replace '(className="[^"]*")\s+className="border-t-primary"', '$1 border-t-primary"'
    
    # Fix the reverse pattern too
    $content = $content -replace 'className="bg-primary"\s+(className="[^"]*")', 'className="bg-primary $1'
    $content = $content -replace 'className="border-t-primary"\s+(className="[^"]*")', 'className="border-t-primary $1'
    
    Set-Content -Path $_.FullName -Value $content
    Write-Host "Fixed: $($_.FullName)"
}
Write-Host "Done!"
