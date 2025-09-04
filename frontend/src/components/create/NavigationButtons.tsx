"use client";

import { Step } from './types';

interface NavigationButtonsProps {
  currentStep: Step;
  canProceedToNext: (step: Step) => boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  submitting: boolean;
  isFormValid: boolean;
  remainingServerSlots: number;
}

export function NavigationButtons({ 
  currentStep, 
  canProceedToNext, 
  onNext, 
  onPrevious, 
  onSubmit, 
  submitting, 
  isFormValid, 
  remainingServerSlots 
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      {currentStep === 'resources' ? (
        <button
          type="submit"
          disabled={submitting || !isFormValid || remainingServerSlots <= 0}
          className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onSubmit}
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Creating Server...
            </>
          ) : (
            'Create Server'
          )}
        </button>
      ) : (
        <>
          <button 
            type="button" 
            className="bg-[#303030] hover:bg-[#404040] text-white px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onPrevious}
            disabled={currentStep === 'name'}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </button>
          
          <button
            type="button"
            disabled={!canProceedToNext(currentStep)}
            className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onNext}
          >
            Next
            <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </>
      )}
    </div>
  );
}
