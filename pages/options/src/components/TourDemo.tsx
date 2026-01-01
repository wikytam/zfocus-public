import { Button, Tour } from '@extension/ui';
import { useState } from 'react';

/**
 * Basic Tour Demo - Uncontrolled
 * Shows a simple tour with multiple steps
 */
export const TourDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Tour</h3>
        <Button onClick={() => setOpen(true)}>Start Tour</Button>
      </div>

      {/* Demo elements for tour to target */}
      <div className="grid grid-cols-2 gap-4">
        <div id="tour-step-1" className="rounded-lg border p-4">
          <h4 className="font-medium">Feature 1</h4>
          <p className="text-muted-foreground text-sm">This is the first feature</p>
        </div>

        <div id="tour-step-2" className="rounded-lg border p-4">
          <h4 className="font-medium">Feature 2</h4>
          <p className="text-muted-foreground text-sm">This is the second feature</p>
        </div>

        <div id="tour-step-3" className="rounded-lg border p-4">
          <h4 className="font-medium">Feature 3</h4>
          <p className="text-muted-foreground text-sm">This is the third feature</p>
        </div>

        <div id="tour-step-4" className="rounded-lg border p-4">
          <h4 className="font-medium">Feature 4</h4>
          <p className="text-muted-foreground text-sm">This is the fourth feature</p>
        </div>
      </div>

      {/* Tour Implementation */}
      <Tour.Root open={open} onOpenChange={setOpen}>
        <Tour.Portal>
          <Tour.Spotlight />
          <Tour.SpotlightRing className="ring-primary ring-offset-background rounded-lg ring-2 ring-offset-2" />

          {/* Step 1 */}
          <Tour.Step target="#tour-step-1" side="bottom">
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Welcome to the Tour!</Tour.Title>
              <Tour.Description>
                This tour will guide you through the main features of this application. Let&apos;s start with Feature 1.
              </Tour.Description>
            </Tour.Header>
            <Tour.Footer>
              <Tour.StepCounter />
              <div className="flex gap-2">
                <Tour.Skip />
                <Tour.Next />
              </div>
            </Tour.Footer>
          </Tour.Step>

          {/* Step 2 */}
          <Tour.Step target="#tour-step-2" side="bottom">
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Feature 2</Tour.Title>
              <Tour.Description>
                Here&apos;s another important feature. You can navigate back and forth between steps.
              </Tour.Description>
            </Tour.Header>
            <Tour.Footer>
              <Tour.StepCounter />
              <div className="flex gap-2">
                <Tour.Prev />
                <Tour.Skip />
                <Tour.Next />
              </div>
            </Tour.Footer>
          </Tour.Step>

          {/* Step 3 */}
          <Tour.Step target="#tour-step-3" side="top">
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Feature 3</Tour.Title>
              <Tour.Description>
                This step appears on top of the element. The tour automatically adjusts positioning.
              </Tour.Description>
            </Tour.Header>
            <Tour.Footer>
              <Tour.StepCounter />
              <div className="flex gap-2">
                <Tour.Prev />
                <Tour.Skip />
                <Tour.Next />
              </div>
            </Tour.Footer>
          </Tour.Step>

          {/* Step 4 */}
          <Tour.Step target="#tour-step-4" side="top">
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Final Step</Tour.Title>
              <Tour.Description>
                That&apos;s it! You&apos;ve completed the tour. Click Finish to close.
              </Tour.Description>
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
    </div>
  );
};

/**
 * Controlled Tour Demo
 * Shows how to control the tour state externally
 */
export const TourControlledDemo = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleStart = () => {
    setOpen(true);
    setCurrentStep(0);
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Controlled Tour</h3>
        <div className="flex items-center gap-4">
          <Button onClick={handleStart}>Start Controlled Tour</Button>
          {open && <div className="text-muted-foreground text-sm">Current Step: {currentStep + 1}</div>}
        </div>
      </div>

      {/* Demo elements */}
      <div className="space-y-4">
        <div id="controlled-step-1" className="rounded-lg border border-blue-500 p-4">
          <h4 className="font-medium">Step 1 Element</h4>
          <p className="text-muted-foreground text-sm">This element has a blue border</p>
        </div>

        <div id="controlled-step-2" className="rounded-lg border border-green-500 p-4">
          <h4 className="font-medium">Step 2 Element</h4>
          <p className="text-muted-foreground text-sm">This element has a green border</p>
        </div>

        <div id="controlled-step-3" className="rounded-lg border border-purple-500 p-4">
          <h4 className="font-medium">Step 3 Element</h4>
          <p className="text-muted-foreground text-sm">This element has a purple border</p>
        </div>
      </div>

      {/* External Controls */}
      {open && (
        <div className="bg-card flex items-center gap-2 rounded-lg border p-4">
          <span className="text-sm font-medium">External Controls:</span>
          <Button size="sm" variant="outline" onClick={() => handleStepChange(0)} disabled={currentStep === 0}>
            Jump to Step 1
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStepChange(1)} disabled={currentStep === 1}>
            Jump to Step 2
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStepChange(2)} disabled={currentStep === 2}>
            Jump to Step 3
          </Button>
        </div>
      )}

      {/* Controlled Tour Implementation */}
      <Tour.Root open={open} onOpenChange={setOpen}>
        <Tour.Portal>
          <Tour.Spotlight />
          <Tour.SpotlightRing className="border-primary shadow-primary/50 rounded-lg border-2 shadow-lg" />

          <Tour.Step target="#controlled-step-1" side="right" sideOffset={16}>
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Controlled Tour - Step 1</Tour.Title>
              <Tour.Description>
                This tour is controlled externally. Notice how you can jump to any step using the buttons below.
              </Tour.Description>
            </Tour.Header>
            <Tour.Footer>
              <Tour.StepCounter />
              <div className="flex gap-2">
                <Tour.Skip />
                <Tour.Next />
              </div>
            </Tour.Footer>
          </Tour.Step>

          <Tour.Step target="#controlled-step-2" side="right" sideOffset={24}>
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Custom Offset</Tour.Title>
              <Tour.Description>
                This step has a larger gap (24px) from the target element, while the previous step had 16px.
              </Tour.Description>
            </Tour.Header>
            <Tour.Footer>
              <Tour.StepCounter />
              <div className="flex gap-2">
                <Tour.Prev />
                <Tour.Skip />
                <Tour.Next />
              </div>
            </Tour.Footer>
          </Tour.Step>

          <Tour.Step target="#controlled-step-3" side="left">
            <Tour.Arrow />
            <Tour.Close />
            <Tour.Header>
              <Tour.Title>Completion</Tour.Title>
              <Tour.Description>
                You&apos;ve reached the end! The tour state is synchronized with external controls.
              </Tour.Description>
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
    </div>
  );
};

/**
 * Combined Demo Component
 */
export const TourDemos = () => (
  <div className="space-y-12 p-8">
    <div>
      <h2 className="mb-6 text-2xl font-bold">Tour Component Demos</h2>
      <p className="text-muted-foreground">
        Interactive examples demonstrating the Tour component&apos;s features and capabilities.
      </p>
    </div>

    <div className="space-y-12">
      <TourDemo />
      <div className="border-t" />
      <TourControlledDemo />
    </div>
  </div>
);
