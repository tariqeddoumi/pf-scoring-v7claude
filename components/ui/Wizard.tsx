import { ReactNode, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface WizardStep {
  id: string;
  label: string;
  description?: string;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: ReactNode;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  isSubmitting?: boolean;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  children,
  canGoNext = true,
  canGoPrev = true,
  isSubmitting = false,
}: WizardProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canGoNext) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0 && canGoPrev) {
      onStepChange(currentStep - 1);
    }
  };

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Étape {currentStep + 1}/{steps.length}
        </h3>
        <p className="text-slate-400 mb-4">{steps[currentStep]?.label}</p>
        {steps[currentStep]?.description && (
          <p className="text-sm text-slate-500">
            {steps[currentStep].description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="space-y-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepChange(index)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center ${
                index === currentStep
                  ? "bg-cyan-500/20 text-cyan-400 font-semibold"
                  : index < currentStep
                    ? "text-green-400 hover:bg-slate-700"
                    : "text-slate-400 hover:bg-slate-700"
              }`}
            >
              <span className="mr-3">
                {index < currentStep ? "✓" : index + 1}
              </span>
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-between">
        <button
          onClick={handlePrev}
          disabled={isFirstStep || isSubmitting}
          className="inline-flex items-center space-x-2 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
          <span>Précédent</span>
        </button>

        <div className="flex gap-2">
          {isLastStep && (
            <button
              type="reset"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
            >
              <span>Annuler</span>
            </button>
          )}
          <button
            onClick={isLastStep ? undefined : handleNext}
            type={isLastStep ? "submit" : "button"}
            disabled={(!isLastStep && !canGoNext) || isSubmitting}
            className={`inline-flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors font-semibold ${
              isLastStep
                ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-600"
                : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-600"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span>
              {isSubmitting
                ? "Enregistrement..."
                : isLastStep
                  ? "Valider"
                  : "Suivant"}
            </span>
            {!isLastStep && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
