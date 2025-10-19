# SpeakEasy Vintage Color Scheme Guide

## Button Styles Updated ✅

### Primary Actions (Gold)
**Class:** `.ai-button` (default), `.primary-button`
- **Background:** Linear gradient `#C9A05F → #B89050`
- **Text:** `#2D2A26` (Dark Charcoal)
- **Border:** `#A08968` (Muted Gold)
- **Use for:** Main CTAs, default AI actions
- **Example:** "Start Live Session", "View Conversations"

### Summary Button (Slate Blue-Gray)
**Class:** `.ai-button.summary`
- **Background:** Linear gradient `#6B7F8E → #5A6D7A`
- **Text:** `#F5EFE6` (Cream)
- **Border:** `#6B7F8E`
- **Icon:** ✨
- **Use for:** Generate Summary actions

### Feedback Button (Muted Green)
**Class:** `.ai-button.feedback`
- **Background:** Linear gradient `#5C7F4A → #4E6D3E`
- **Text:** `#F5EFE6` (Cream)
- **Border:** `#5C7F4A`
- **Icon:** 💬
- **Use for:** Get Speaking Feedback actions

### News/Articles Button (Golden Amber)
**Class:** `.ai-button.news`
- **Background:** Linear gradient `#D4A05F → #C9954F`
- **Text:** `#2D2A26` (Dark Charcoal)
- **Border:** `#C9954F`
- **Icon:** 📰
- **Use for:** Find Relevant Article actions

## Complete Color Palette

### Brand Colors
```css
--primary: #C9A05F;       /* Warm Gold - primary buttons, highlights */
--secondary: #2D2A26;     /* Dark Charcoal - headers, primary text */
--accent: #6B4E3D;        /* Rich Brown - links, accents */
```

### Neutral Palette
```css
--bg-light: #F5EFE6;      /* Lighter cream - page background */
--bg-primary: #E8DCC8;    /* Cream - cards, panels */
--bg-surface: #D4C4A8;    /* Tan - elevated surfaces */
--border-color: #A08968;  /* Muted gold - borders */
```

### Text Colors
```css
--text-primary: #2D2A26;   /* Dark charcoal - main text */
--text-secondary: #5A5248; /* Gray-brown - secondary text */
--text-disabled: #A08968;  /* Muted - disabled text */
```

### Functional Colors
```css
--success-color: #5C7F4A;  /* Muted green - success, feedback */
--warning-color: #D4A05F;  /* Golden amber - warnings, news */
--error-color: #8B4B3D;    /* Muted red-brown - errors, stop */
--info-color: #6B7F8E;     /* Slate blue-gray - info, summaries */
```

## Button Features

All buttons include:
- ✨ **Shine effect** on hover (subtle light sweep)
- 📐 **2px solid borders** for vintage aesthetic
- 🎨 **Gradient backgrounds** for depth
- 🔝 **Lift animation** on hover (-2px translateY)
- 🎯 **Drop shadows** matching color scheme
- ♿ **Disabled states** with muted colors

## Usage Examples

### HTML
```html
<!-- Default AI Button (Gold) -->
<button className="ai-button">✨ Generate</button>

<!-- Summary Button (Blue-gray) -->
<button className="ai-button summary">✨ Generate Summary</button>

<!-- Feedback Button (Green) -->
<button className="ai-button feedback">💬 Get Feedback</button>

<!-- News Button (Amber) -->
<button className="ai-button news">📰 Find Article</button>
```

### With Loading State
```tsx
<button className="ai-button summary" disabled={loading}>
  {loading ? (
    <>
      <span className="spinner"></span>
      Generating...
    </>
  ) : (
    '✨ Generate Summary'
  )}
</button>
```

## Spinner Colors

The spinner adapts to button text color:
- Gold buttons: Dark charcoal spinner `#2D2A26`
- Colored buttons (summary, feedback): Cream spinner (inherited from text color)

## Design Philosophy

This vintage speakeasy aesthetic evokes:
- 🥃 **1920s prohibition era** - warm, sophisticated colors
- 📜 **Old paper textures** - cream and tan backgrounds
- 🎩 **Classic menswear** - charcoal, brown, gold accents
- 🕯️ **Candlelit ambiance** - soft shadows and gradients
- 🎺 **Jazz age elegance** - refined typography and spacing

Perfect for: Speakeasy bars, vintage cocktail apps, 1920s-themed interfaces, conversation analysis tools with a classic feel.
