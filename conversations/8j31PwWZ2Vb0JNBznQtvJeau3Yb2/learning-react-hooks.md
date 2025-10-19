---
title: Learning React Hooks
date: 2025-10-18T04:58:06.796Z
summary: A conversation about understanding and using React Hooks effectively
feedback: Great technical discussion with practical examples
---

# Dialogue

## User
Can you explain React Hooks to me? I'm a bit confused about useState and useEffect.

## Assistant
Of course! React Hooks are functions that let you use React features in functional components.

### useState
`useState` lets you add state to functional components:

```javascript
const [count, setCount] = useState(0);
```

- `count` is the current state value
- `setCount` is the function to update it
- `0` is the initial value

### useEffect
`useEffect` lets you perform side effects:

```javascript
useEffect(() => {
  // This runs after render
  document.title = `Count: ${count}`;
}, [count]); // Only re-run when count changes
```

## User
What about cleanup in useEffect?

## Assistant
Great question! useEffect can return a cleanup function:

```javascript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Tick');
  }, 1000);

  // Cleanup function
  return () => {
    clearInterval(timer);
  };
}, []);
```

The cleanup function runs:
1. Before the effect runs again
2. When the component unmounts

This prevents memory leaks!

## User
This is really helpful. What are some common mistakes?

## Assistant
Common mistakes with Hooks:

1. **Calling Hooks conditionally**
   ❌ Don't do this:
   ```javascript
   if (condition) {
     useState(0); // Wrong!
   }
   ```

2. **Missing dependencies**
   ❌ Don't do this:
   ```javascript
   useEffect(() => {
     console.log(count);
   }, []); // count is missing from deps!
   ```

3. **Not cleaning up subscriptions**
   Always return cleanup functions for:
   - Timers
   - Event listeners
   - WebSocket connections

✅ Always follow the Rules of Hooks!
