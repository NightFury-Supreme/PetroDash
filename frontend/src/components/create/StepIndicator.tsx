"use client";

import { StepInfo, Step } from './types';

interface StepIndicatorProps {
  steps: StepInfo[];
  currentStep: Step;
  onStepClick: (step: Step) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const canClick = index <= steps.findIndex(s => s.id === currentStep);
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => canClick && onStepClick(step.id)}
                  disabled={!canClick}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all mb-2 ${
                    isActive 
                      ? 'bg-white border-white text-black' 
                      : isCompleted 
                      ? 'bg-white border-white text-black' 
                      : 'bg-[#303030] border-[#303030] text-[#AAAAAA]'
                  } ${canClick ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                >
                  {isCompleted ? (
                    <i className="fas fa-check text-xs"></i>
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                  )}
                </button>
                <span className={`text-xs font-medium ${
                  isActive || isCompleted ? 'text-white' : 'text-[#AAAAAA]'
                }`}>
                  {step.title}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-20 h-0.5 mx-4 ${
                  isCompleted ? 'bg-white' : 'bg-[#303030]' 
                }`} style={{ marginTop: '-4px' }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
