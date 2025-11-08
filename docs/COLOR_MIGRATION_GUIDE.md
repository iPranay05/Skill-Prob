# 🎨 Color Migration Guide

## Quick Start

Run this command in PowerShell from your project root:

```powershell
.\scripts\migrate-colors.ps1
```

This will automatically replace all hardcoded colors with semantic color classes across your entire codebase.

## What Gets Replaced

### Primary Purple (#5e17eb)
- `bg-[#5e17eb]` → `bg-primary`
- `text-[#5e17eb]` → `text-primary`
- `bg-purple-600` → `bg-primary`
- `text-purple-600` → `text-primary`

### Secondary Green
- `bg-green-600` → `bg-secondary`
- `text-green-600` → `text-secondary`

### Error Red
- `bg-red-600` → `bg-error`
- `text-red-600` → `text-error`

### Info Blue
- `bg-blue-600` → `bg-info`
- `text-blue-600` → `text-info`

### Accent Orange
- `bg-orange-600` → `bg-accent`
- `text-orange-600` → `text-accent`

## After Migration

1. **Review changes**:
   ```bash
   git diff
   ```

2. **Test your application**:
   ```bash
   npm run dev
   ```

3. **Check for any missed colors**:
   ```powershell
   # Search for remaining hardcoded colors
   Get-ChildItem -Path src -Include *.tsx,*.ts -Recurse | Select-String -Pattern "#[0-9a-fA-F]{6}"
   ```

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "Migrate to semantic color system"
   ```

## Manual Review Needed

Some colors might need manual review:
- Custom gradients
- SVG fill colors
- Chart/graph colors
- Third-party component styles

## Benefits

✅ **Consistency**: All components use the same colors  
✅ **Maintainability**: Change colors in one place  
✅ **Dark Mode**: Automatic dark mode support  
✅ **Accessibility**: Better semantic naming  
✅ **Theming**: Easy to create different themes

## Troubleshooting

### Script doesn't run
Make sure you're in the project root directory and have execution permissions:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Some colors not replaced
Check the `scripts/migrate-colors.ps1` file and add any missing patterns.

### Need to revert
```bash
git checkout -- src/
```

## Questions?

Refer to `docs/COLOR_SYSTEM.md` for the complete color system documentation.
