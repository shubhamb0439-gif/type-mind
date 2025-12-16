# WPM Calculation Implementation

## Standard Typing Formula (Now Implemented)

### Definitions
- **elapsedMinutes** = elapsedMillis / 60000
- **totalKeystrokes** = correctKeystrokes + incorrectKeystrokes
- **charactersPerWord** = 5 (industry standard)
- **unfixedErrors** = count of wrong characters that remain incorrect in the final submission
  - Does NOT count mistakes the user backspaced and corrected

### Gross WPM
```
grossWpm = (totalKeystrokes / charactersPerWord) / elapsedMinutes
```

### Net WPM (displayed as "Speed")
```
netWpm = grossWpm - (unfixedErrors / elapsedMinutes)
netWpm = max(netWpm, 0)
```

### Accuracy
```
accuracyPct = (correctKeystrokes / totalKeystrokes) * 100
```

If totalKeystrokes == 0, display 0% and 0 wpm.

## Test Cases

### Case A: Baseline (100% accuracy)
- Type 300 keystrokes over 1:00, 0 unfixed errors
- Gross WPM = (300/5)/1 = 60
- Net WPM = 60 - (0/1) = **60 wpm**
- Accuracy = **100%**

### Case B: With Errors
- 300 keystrokes over 1:00, 5 unfixed errors
- Gross WPM = (300/5)/1 = 60
- Net WPM = 60 - (5/1) = **55 wpm**
- Accuracy reflects correct/total

### Case C: All Corrections (backspaced)
- Make mistakes but backspace all of them
- unfixedErrors = 0
- Net WPM = Gross WPM (no penalty)

## Implementation Details

### Keystroke Tracking
- **correctKeystrokes**: Incremented when user types correct character at correct position
- **incorrectKeystrokes**: Incremented when user types wrong character
- On **backspace**: Decrements the appropriate counter based on what was deleted
- **unfixedErrors**: Recalculated on every keystroke - counts characters that don't match expected

### Timer Behavior
- Starts when user types first character (`handleStart()`)
- Updates every second
- Stops when lesson completes (`calculateResults()`)
- Displayed as MM:SS format

### Real-time Updates
- WPM and Accuracy update live as user types
- Uses the same timer for consistency
- All metrics computed from single source of truth

## UI Changes
- **Removed**: All finger/hand overlay graphics (LiveKeyboard component)
- **Added**: Clean stats display showing Accuracy, Duration, Speed (WPM)
- **Maintained**: Keyboard key highlighting, typing area, progress bar
- **Format**:
  - WPM: Whole number (e.g., 62 wpm)
  - Duration: MM:SS (e.g., 1:09)
  - Accuracy: Whole percent (e.g., 97%)
