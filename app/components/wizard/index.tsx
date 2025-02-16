'use client';

import { useState, ReactNode } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  component: ReactNode;
  isComplete?: boolean;
  onNext?: () => Promise<boolean>;
}

interface WizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export default function Wizard({ steps, onComplete, currentStep = 0, onStepChange }: WizardProps) {
  const [activeStep, setActiveStep] = useState(currentStep);

  const handleNext = async () => {
    const currentStepData = steps[activeStep];
    
    // If there's an onNext handler, call it and wait for the result
    if (currentStepData.onNext) {
      const canProceed = await currentStepData.onNext();
      if (!canProceed) return;
    }

    if (activeStep < steps.length - 1) {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      const prevStep = activeStep - 1;
      setActiveStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol role="list" className="flex items-center">
          {steps.map((step, index) => (
            <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                {index !== steps.length - 1 && (
                  <div className={`h-0.5 w-full ${index < activeStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  index < activeStep
                    ? 'bg-blue-600'
                    : index === activeStep
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                } ${index <= activeStep ? 'text-white' : 'text-gray-500'}`}
              >
                {step.isComplete ? (
                  <span className="text-sm">{index + 1}</span>
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <div className="absolute -bottom-6 start-0 w-max text-sm">
                {step.title}
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Content */}
      <div className="mt-12">
        {steps[activeStep].component}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={activeStep === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {activeStep === steps.length - 1 ? (
            'Complete'
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
} 