

## Plan: Add confetti animation on application success popup

**What**: When the mentor application success dialog appears, trigger a confetti burst animation.

**How**: Use the `canvas-confetti` library (lightweight, no-dependency confetti effect). Fire confetti when `showSuccess` becomes `true`.

### Steps

1. **Install `canvas-confetti`** package
2. **Update `MentorApplicationForm.tsx`**:
   - Import `confetti` from `canvas-confetti`
   - Add a `useEffect` that fires confetti when `showSuccess` transitions to `true`
   - Use a burst from center with colorful defaults

### Technical detail

```tsx
useEffect(() => {
  if (showSuccess) {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
  }
}, [showSuccess]);
```

Single file change + one dependency.

