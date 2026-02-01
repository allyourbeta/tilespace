# TileSpace Deep Clean Checklist

## CRITICAL: Read This First

This is a **cleanup task**. No behavior changes. Test `npm run build` after every change. Commit frequently.

---

## 1. Fix Known Issues

### 1.1 Fix old project name in index.html
```bash
grep -r "TileLandia" . --include="*.html" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md"
```
Replace all instances of "TileLandia" with "TileSpace".

**Commit:** `fix: replace old project name TileLandia with TileSpace`

---

## 2. Find and Remove Stale Strings

### 2.1 Search for old/test names
```bash
grep -ri "tilelandia\|test.*tile\|dummy\|placeholder\|lorem\|foo\|bar\|asdf\|todo.*remove\|fixme.*remove" src/ --include="*.ts" --include="*.tsx"
```
Review each match. Remove or update as appropriate.

### 2.2 Search for hardcoded test data
```bash
grep -ri "example\.com\|test@\|fake\|mock" src/ --include="*.ts" --include="*.tsx" | grep -v "test/" | grep -v "\.test\."
```
Test data should only be in test files, not production code.

**Commit:** `clean: remove stale test strings and placeholders`

---

## 3. Find TODO/FIXME Comments

### 3.1 List all TODO/FIXME comments
```bash
grep -rn "TODO\|FIXME\|XXX\|HACK\|BUG" src/ --include="*.ts" --include="*.tsx"
```

For each one, decide:
- Is it still relevant? Keep it.
- Is it done? Remove it.
- Is it obsolete? Remove it.

**Commit:** `clean: remove obsolete TODO comments`

---

## 4. Find Commented-Out Code

### 4.1 Search for commented code blocks
Look for patterns like:
```bash
grep -rn "^[[:space:]]*//.*import\|^[[:space:]]*//.*const\|^[[:space:]]*//.*function\|^[[:space:]]*//.*return\|^[[:space:]]*//.*export" src/ --include="*.ts" --include="*.tsx"
```

Also look for block comments that might be dead code:
```bash
grep -rn "/\*" src/ --include="*.ts" --include="*.tsx" | head -20
```

Review and remove commented-out code. If it's needed later, that's what git history is for.

**Commit:** `clean: remove commented-out code`

---

## 5. Find Console Statements

### 5.1 List all console.log/warn/error
```bash
grep -rn "console\.\(log\|warn\|error\|debug\|info\)" src/ --include="*.ts" --include="*.tsx" | grep -v "test/"
```

Decide for each:
- Is it useful for production debugging? Keep it (but consider using a proper logger).
- Is it leftover from development? Remove it.

**Commit:** `clean: remove development console.log statements`

---

## 6. Check for Unused Dependencies

### 6.1 Run depcheck
```bash
npx depcheck
```

This will show:
- Unused dependencies (in package.json but not imported)
- Missing dependencies (imported but not in package.json)

For unused deps, verify they're truly unused, then:
```bash
npm uninstall <package-name>
```

**Commit:** `clean: remove unused dependencies`

---

## 7. Check for Unused Exports

### 7.1 Find exports that might be unused
For each file in `src/utils/`, `src/lib/`, `src/types/`:
```bash
# Example: check if a function is used anywhere
grep -r "functionName" src/ --include="*.ts" --include="*.tsx" | grep -v "export"
```

This is tedious but catches dead utility functions.

**Commit:** `clean: remove unused exports`

---

## 8. Check for Orphaned Files

### 8.1 Find files not imported anywhere
```bash
# List all .ts/.tsx files
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  basename=$(basename "$file" | sed 's/\.[^.]*$//')
  # Skip index files and test files
  if [[ "$basename" != "index" && ! "$file" =~ \.test\. ]]; then
    count=$(grep -r "$basename" src/ --include="*.ts" --include="*.tsx" | grep -v "^$file:" | wc -l)
    if [ "$count" -eq 0 ]; then
      echo "Possibly orphaned: $file"
    fi
  fi
done
```

Review each "possibly orphaned" file before deleting.

**Commit:** `clean: remove orphaned files`

---

## 9. Clean Up package.json

### 9.1 Check scripts
```bash
cat package.json | grep -A 20 '"scripts"'
```
Remove any unused or obsolete scripts.

### 9.2 Check for outdated info
- Is the project name correct?
- Is the description accurate?
- Is the version meaningful?

**Commit:** `clean: update package.json metadata`

---

## 10. Check for Duplicate Code Patterns

### 10.1 Look for repeated error handling
```bash
grep -rn "catch.*console\.error" src/ --include="*.ts" --include="*.tsx" | head -20
```
If the same pattern appears many times, consider a utility function.

### 10.2 Look for repeated null checks
```bash
grep -rn "if.*null\|if.*undefined\|\?\?" src/ --include="*.ts" --include="*.tsx" | wc -l
```
Not necessarily bad, but worth reviewing.

**Note:** Don't refactor these now — just note them for future improvement.

---

## 11. Verify No Dead CSS

### 11.1 Check for unused Tailwind classes (manual)
Skim through components and look for classes that seem obsolete or duplicated.

This is hard to automate with Tailwind. Just a visual pass.

---

## 12. Final Verification

After all cleanup:

```bash
npm run build
npm run dev
```

Test manually:
- [ ] Login works
- [ ] Pages load
- [ ] Navigation works (swipe, arrows, dots)
- [ ] Tiles work (create, edit, delete)
- [ ] Links work (create, edit, delete)
- [ ] Overview mode works
- [ ] Page title appears on hover and page switch

**Final commit:** `clean: complete deep clean`

---

## Summary of Expected Commits

1. `fix: replace old project name TileLandia with TileSpace`
2. `clean: remove stale test strings and placeholders`
3. `clean: remove obsolete TODO comments`
4. `clean: remove commented-out code`
5. `clean: remove development console.log statements`
6. `clean: remove unused dependencies`
7. `clean: remove unused exports`
8. `clean: remove orphaned files`
9. `clean: update package.json metadata`
10. `clean: complete deep clean`

---

## If Something Breaks

1. Stop immediately
2. `git diff` to see what changed
3. `git checkout -- .` to revert uncommitted changes
4. Or `git revert <commit>` to undo a commit
