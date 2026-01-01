# Tour Component

A feature-rich, accessible tour component for guiding users through your application with step-by-step walkthroughs.

## Features

- ✨ **Spotlight Effect** - Highlights target elements with a dimmed overlay
- 🎯 **Smart Positioning** - Automatically positions tour steps using Floating UI
- ⌨️ **Keyboard Navigation** - Full keyboard support with escape key handling
- 🎨 **Customizable Styling** - Flexible styling with Tailwind CSS classes
- 🔄 **Controlled & Uncontrolled** - Supports both controlled and uncontrolled states
- ♿ **Accessible** - Built with accessibility in mind
- 📱 **Responsive** - Works on all screen sizes

## Installation

The Tour component requires the following dependencies:

```bash
pnpm add @floating-ui/react-dom @radix-ui/react-slot lucide-react
```

## Basic Usage

```tsx
import { Tour } from '@extension/ui';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Start Tour</button>

      {/* Elements to highlight */}
      <div id="step-1">Feature 1</div>
      <div id="step-2">Feature 2</div>

      {/* Tour Implementation */}
      <Tour.Root open={open} onOpenChange={setOpen}>
        <Tour.Portal>
          <Tour.Spotlight />
          <Tour.SpotlightRing className="rounded-lg ring-2 ring-primary" />

          <Tour.Step target="#step-1" side="bottom">
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Welcome!</Tour.Title>
              <Tour.Description>This is the first feature.</Tour.Description>
            </Tour.Header>
            <Tour.Footer>
              <Tour.StepCounter />
              <div className="flex gap-2">
                <Tour.Skip />
                <Tour.Next />
              </div>
            </Tour.Footer>
          </Tour.Step>

          <Tour.Step target="#step-2" side="top">
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Feature 2</Tour.Title>
              <Tour.Description>Here's another feature.</Tour.Description>
            </Tour.Header>
            <Tour.Footer>
              <Tour.StepCounter />
              <div className="flex gap-2">
                <Tour.Prev />
                <Tour.Next />
              </div>
            </Tour.Footer>
          </Tour.Step>
        </Tour.Portal>
      </Tour.Root>
    </>
  );
}
```

## Component Structure

```tsx
<Tour.Root>
  <Tour.Portal>
    <Tour.Spotlight />           {/* Dimmed overlay with cutout */}
    <Tour.SpotlightRing />       {/* Visual ring around target */}
    <Tour.Step>                  {/* Individual tour step */}
      <Tour.Arrow />             {/* Pointing arrow */}
      <Tour.Close />             {/* Close button */}
      <Tour.Header>
        <Tour.Title />           {/* Step title */}
        <Tour.Description />     {/* Step description */}
      </Tour.Header>
      <Tour.Footer>
        <Tour.StepCounter />     {/* "1 / 3" counter */}
        <Tour.Prev />            {/* Previous button */}
        <Tour.Next />            {/* Next/Finish button */}
        <Tour.Skip />            {/* Skip tour button */}
      </Tour.Footer>
    </Tour.Step>
  </Tour.Portal>
</Tour.Root>
```

## API Reference

### Tour.Root

Main container component that manages tour state.

**Props:**
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Open state change handler
- `defaultOpen?: boolean` - Initial open state (uncontrolled)
- `sideOffset?: number` - Default gap between step and target (default: 8)
- `alignOffset?: number` - Default alignment offset (default: 0)
- `onEscapeKeyDown?: (event: KeyboardEvent) => void` - Escape key handler

### Tour.Portal

Portal container for rendering tour content.

**Props:**
- `container?: HTMLElement` - Custom portal container (default: document.body)

### Tour.Spotlight

Dimmed overlay that highlights the target element.

**Props:**
- `className?: string` - Custom CSS classes

### Tour.SpotlightRing

Visual ring/border around the highlighted element.

**Props:**
- `className?: string` - Custom CSS classes for styling

**Example Styles:**
```tsx
{/* Border style */}
<Tour.SpotlightRing className="rounded-lg border-2 border-primary" />

{/* Ring with offset */}
<Tour.SpotlightRing className="rounded-xl ring-2 ring-blue-500 ring-offset-2" />

{/* Glowing effect */}
<Tour.SpotlightRing className="rounded-lg shadow-lg shadow-primary/50" />

{/* Animated pulse */}
<Tour.SpotlightRing className="rounded-lg border-2 border-primary animate-pulse" />
```

### Tour.Step

Individual step in the tour.

**Props:**
- `target: string` - CSS selector for the target element
- `side?: Placement` - Positioning side: "top" | "right" | "bottom" | "left" (default: "bottom")
- `sideOffset?: number` - Override global sideOffset for this step
- `alignOffset?: number` - Override global alignOffset for this step
- `className?: string` - Custom CSS classes

### Tour.Arrow

Pointing arrow indicator.

**Props:**
- `className?: string` - Custom CSS classes
- `width?: number` - Arrow width (default: 10)
- `height?: number` - Arrow height (default: 5)

### Tour.Close

Close button to exit the tour.

**Props:**
- `asChild?: boolean` - Render as child component (using Radix Slot)
- Standard button HTML attributes

### Tour.Header, Tour.Title, Tour.Description, Tour.Footer

Layout components with standard HTML div/heading/paragraph props.

### Tour.StepCounter

Displays current step progress (e.g., "1 / 3").

**Props:**
- Standard span HTML attributes

### Tour.Prev

Navigate to previous step.

**Props:**
- `asChild?: boolean` - Render as child component
- Standard button HTML attributes
- Automatically disabled on first step

### Tour.Next

Navigate to next step or finish tour.

**Props:**
- `asChild?: boolean` - Render as child component
- Standard button HTML attributes
- Shows "Next" on intermediate steps, "Finish" on last step

### Tour.Skip

Skip the entire tour.

**Props:**
- `asChild?: boolean` - Render as child component
- Standard button HTML attributes

## Advanced Examples

### Controlled Tour

```tsx
function ControlledTour() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <Tour.Root open={open} onOpenChange={setOpen}>
      {/* Steps... */}
    </Tour.Root>
  );
}
```

### Global Offset Control

```tsx
<Tour.Root
  sideOffset={16}      // Global: 16px gap for all steps
  alignOffset={0}
>
  <Tour.Portal>
    {/* Uses global sideOffset={16} */}
    <Tour.Step target="#step-1" side="bottom">
      {/* ... */}
    </Tour.Step>
    
    {/* Override with custom sideOffset={32} */}
    <Tour.Step target="#step-2" side="top" sideOffset={32}>
      {/* ... */}
    </Tour.Step>
  </Tour.Portal>
</Tour.Root>
```

### Custom Escape Handler

```tsx
<Tour.Root
  open={open}
  onOpenChange={setOpen}
  onEscapeKeyDown={(event) => {
    // Custom logic before closing
    console.log('Escape pressed');
    // Prevent default close behavior if needed
    // event.preventDefault();
  }}
>
  {/* Steps... */}
</Tour.Root>
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close tour (can be prevented with `onEscapeKeyDown`) |
| `Tab` | Move focus to next focusable element |
| `Shift + Tab` | Move focus to previous focusable element |
| `Enter / Space` | Activate focused button |

## Styling

The component uses Tailwind CSS classes and can be customized via className props:

```tsx
<Tour.Step 
  className="bg-slate-900 text-white border-slate-700"
  target="#element"
>
  {/* Custom styled content */}
</Tour.Step>
```

## Accessibility

- Focus is automatically managed during the tour
- All interactive elements are keyboard accessible
- Proper ARIA attributes are applied
- Screen reader friendly

## Credits

Built with:
- [Floating UI](https://floating-ui.com/) - For positioning
- [Radix UI](https://www.radix-ui.com/) - For accessible primitives
- [Lucide React](https://lucide.dev/) - For icons
- Inspired by Radix UI Dialog and Dismissable Layer patterns

## Demo

Check out the demo in the Options page under the "Tour Demo" tab to see live examples of basic and controlled tours.

