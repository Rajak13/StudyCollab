# Canvas Memory Management Fix

## Problem
The canvas component was experiencing a stack overflow error due to infinite recursion in the memory management system. The error was caused by:

1. **Circular Dependency**: The `cleanupAll` method was calling cleanup callbacks, which in turn called `cleanupAll` again, creating an infinite loop.
2. **React Update Loop**: The component was causing infinite re-renders due to improper dependency management in useEffect hooks.
3. **Memory Leaks**: Canvas resources weren't being properly cleaned up, leading to memory accumulation.

## Root Causes

### 1. Memory Manager Recursion
```typescript
// BEFORE (problematic)
cleanupAll(): void {
  this.cleanupCallbacks.forEach(callback => callback()) // Could call cleanupAll again
  this.trackedStages.forEach(stage => this.cleanupStage(stage)) // Modifies tracked sets during iteration
}
```

### 2. React Effect Dependencies
```typescript
// BEFORE (problematic)
useEffect(() => {
  const cleanup = () => cleanupAll()
  addCleanupCallback(cleanup) // Adds callback that calls cleanupAll
  return cleanup // Also calls cleanupAll on unmount
}, [addCleanupCallback, cleanupAll]) // Dependencies cause re-runs
```

### 3. Store State Updates
```typescript
// BEFORE (problematic)
addElement: (element) => {
  const existing = state.elements.find(el => el.id === element.id)
  if (existing) {
    return { elements: state.elements.map(...) } // Always returns new state
  }
}
```

## Solutions Implemented

### 1. Fixed Memory Manager Recursion
- Added `isCleaningUp` flag to prevent recursive calls
- Created separate direct cleanup methods that don't modify tracking sets
- Clear tracking sets before cleanup to prevent modification during iteration

```typescript
// AFTER (fixed)
cleanupAll(): void {
  if (this.isCleaningUp) return // Prevent recursion
  
  this.isCleaningUp = true
  
  try {
    // Clear callbacks first to prevent recursion
    const callbacks = Array.from(this.cleanupCallbacks)
    this.cleanupCallbacks.clear()
    
    callbacks.forEach(callback => {
      try { callback() } catch (error) { /* handle */ }
    })
    
    // Use direct cleanup methods
    const stages = Array.from(this.trackedStages)
    this.trackedStages.clear()
    stages.forEach(stage => this.cleanupStageDirect(stage))
  } finally {
    this.isCleaningUp = false
  }
}
```

### 2. Fixed React Effect Dependencies
- Removed problematic dependencies from useEffect hooks
- Simplified cleanup to direct calls without callback registration

```typescript
// AFTER (fixed)
useEffect(() => {
  if (stageRef.current && layerRef.current) {
    const currentStage = stageRef.current
    const currentLayer = layerRef.current
    
    setStage(currentStage)
    setLayer(currentLayer)
    trackStage(currentStage)
    trackLayer(currentLayer)
  }
}, []) // Empty dependencies to prevent re-runs

useEffect(() => {
  return () => {
    cleanupAll() // Direct cleanup on unmount
  }
}, [cleanupAll])
```

### 3. Fixed Store State Updates
- Prevent unnecessary state updates when element already exists
- Return existing state instead of creating new objects

```typescript
// AFTER (fixed)
addElement: (element) => {
  const existingIndex = state.elements.findIndex(el => el.id === element.id)
  if (existingIndex >= 0) {
    console.warn(`Element with id ${element.id} already exists, skipping addition`)
    return state // Return existing state, don't update
  }
  return { elements: [...state.elements, element] }
}
```

### 4. Added Safety Checks
- Check if Konva objects are already destroyed before cleanup
- Wrap cleanup operations in try-catch blocks
- Add debug logging for cleanup errors

```typescript
private cleanupNodeDirect(node: Konva.Node): void {
  if (!node || node.isDestroyed?.()) return
  
  try {
    // Cleanup logic
  } catch (error) {
    console.debug('Node cleanup error (ignored):', error)
  }
}
```

## Testing

### Test Page
Created `/test-canvas-fix` page to verify fixes:
- Multiple canvas tabs for testing tab switching
- Rapid tab switching to test for memory leaks
- Console logging for debugging
- Clear canvas functionality

### Verification Steps
1. Navigate to `/test-canvas-fix`
2. Switch between tabs rapidly
3. Check browser console for errors
4. Monitor memory usage in DevTools
5. Verify no stack overflow errors occur

## Files Modified

1. **`src/lib/canvas/memory-manager.ts`**
   - Added recursion prevention
   - Created direct cleanup methods
   - Added safety checks and error handling

2. **`src/components/study-board/fixed-collaborative-canvas.tsx`**
   - Fixed useEffect dependencies
   - Simplified cleanup logic
   - Prevented coordinate system recreation

3. **`src/components/study-board/simple-fixed-canvas.tsx`**
   - Applied same fixes as fixed-collaborative-canvas

4. **`src/lib/stores/study-board-store.ts`**
   - Prevented unnecessary state updates
   - Added duplicate element detection

5. **`src/app/test-canvas-fix/page.tsx`** (new)
   - Test page for verifying fixes

## Prevention Measures

1. **Memory Manager Pattern**: Use singleton pattern with proper cleanup tracking
2. **React Effect Management**: Minimize dependencies and avoid circular callbacks
3. **State Update Optimization**: Check for actual changes before updating state
4. **Error Boundaries**: Wrap canvas components in error boundaries
5. **Testing**: Regular testing with rapid component mounting/unmounting

## Performance Impact

- **Positive**: Eliminated memory leaks and infinite loops
- **Positive**: Reduced unnecessary re-renders
- **Positive**: Improved canvas cleanup efficiency
- **Minimal**: Added small overhead for safety checks