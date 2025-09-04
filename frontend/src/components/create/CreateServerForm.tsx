"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '../Modal';
import { usePing } from '../../hooks/usePing';
import { 
  Step, 
  StepInfo, 
  Egg, 
  Location, 
  FormData, 
  Violations, 
  ResourceLimits 
} from './types';
import { StepIndicator } from './StepIndicator';
import { NameStep } from './NameStep';
import { EggStep } from './EggStep';
import { LocationStep } from './LocationStep';
import { ResourcesStep } from './ResourcesStep';
import { NavigationButtons } from './NavigationButtons';
import { CreateServerSkeleton } from '../Skeleton';

const steps: StepInfo[] = [
  { id: 'name', title: 'Details', description: 'Enter server details' },
  { id: 'egg', title: 'Software', description: 'Select your server software' },
  { id: 'location', title: 'Location', description: 'Choose server location' },
  { id: 'resources', title: 'Resources', description: 'Configure server resources' }
];

interface CreateServerFormProps {
  eggs: Egg[];
  locations: Location[];
  remaining: ResourceLimits;
}

export function CreateServerForm({ eggs, locations, remaining }: CreateServerFormProps) {
  const router = useRouter();
  const modal = useModal();
  
  // State
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [form, setForm] = useState<FormData>({
    name: '',
    eggId: '',
    locationId: '',
    diskMb: '1024',
    memoryMb: '512',
    cpuPercent: '50',
    backups: '0',
    databases: '0',
    allocations: '1'
  });
  const [violations, setViolations] = useState<Violations>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ping hook for real-time ping updates
  const locationsWithPing = usePing(locations);

  // Calculate if form exceeds limits
  const exceeds = {
    diskMb: Number(form.diskMb) > remaining.diskMb,
    memoryMb: Number(form.memoryMb) > remaining.memoryMb,
    cpuPercent: Number(form.cpuPercent) > remaining.cpuPercent,
    backups: Number(form.backups) > remaining.backups,
    databases: Number(form.databases) > remaining.databases,
    allocations: Number(form.allocations) > remaining.allocations
  };

  // Form validation
  const isFormValid = Boolean(
    form.name.trim() && 
    form.eggId && 
    form.locationId &&
    Number(form.diskMb) >= 100 && 
    Number(form.memoryMb) >= 128 && 
    Number(form.cpuPercent) >= 10 && 
    Number(form.allocations) >= 1 &&
    !exceeds.diskMb &&
    !exceeds.memoryMb &&
    !exceeds.cpuPercent &&
    !exceeds.backups &&
    !exceeds.databases &&
    !exceeds.allocations &&
    remaining.serverSlots > 0
  );

  // Step validation
  const canProceedToNext = (step: Step): boolean => {
    switch (step) {
      case 'name':
        return form.name.trim().length > 0;
      case 'egg':
        return form.name.trim().length > 0 && form.eggId.length > 0;
      case 'location':
        if (!(form.name.trim().length > 0 && form.eggId.length > 0 && form.locationId.length > 0)) return false;
        const selected = locationsWithPing.find(l => l._id === form.locationId);
        if (!selected) return false;
        const isFull = Number(selected.serverCount || 0) >= Number(selected.serverLimit || 0);
        const locked = Array.isArray((selected as any).allowedPlans) && (selected as any).allowedPlans.length > 0 && !(selected as any).isPlanAllowed;
        return !isFull && !locked;
      case 'resources':
        return isFormValid;
      default:
        return false;
    }
  };

  // Navigation functions
  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const goToStep = (step: Step) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const targetIndex = steps.findIndex(s => s.id === step);
    
    // Only allow going to completed steps
    if (targetIndex <= currentIndex) {
      setCurrentStep(step);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear violations when user starts typing
    if (violations[field]) {
      setViolations(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid) {
      await modal.error({
        title: 'Invalid Form',
        body: 'Please check your form inputs and ensure you have sufficient resources available.'
      });
      return;
    }

    setSubmitting(true);
    setError(null);
    setViolations({});

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: form.name.trim(),
          eggId: form.eggId,
          locationId: form.locationId,
          limits: {
            diskMb: Number(form.diskMb),
            memoryMb: Number(form.memoryMb),
            cpuPercent: Number(form.cpuPercent),
            backups: Number(form.backups || 0),
            databases: Number(form.databases || 0),
            allocations: Number(form.allocations),
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data?.violations) {
          setViolations(data.violations);
        }
        throw new Error(data?.error || 'Failed to create server');
      }

      await modal.success({
        title: 'Server Created Successfully',
        body: `Your server "${form.name}" has been created and is now being deployed. You'll be redirected to the dashboard.`
      });

      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Failed to create server');
      console.error('Server creation error:', err);
      
      await modal.error({
        title: 'Creation Failed',
        body: err.message || 'Failed to create server. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'name':
        return (
          <NameStep 
            form={form} 
            violations={violations} 
            onInputChange={handleInputChange} 
          />
        );
      case 'egg':
        return (
          <EggStep 
            eggs={eggs} 
            form={form} 
            violations={violations} 
            onInputChange={handleInputChange} 
          />
        );
      case 'location':
        return (
          <LocationStep 
            locations={locationsWithPing} 
            form={form} 
            violations={violations} 
            onInputChange={handleInputChange} 
          />
        );
      case 'resources':
        return (
          <ResourcesStep 
            form={form} 
            violations={violations} 
            remaining={remaining} 
            exceeds={exceeds} 
            onInputChange={handleInputChange} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <StepIndicator 
        steps={steps} 
        currentStep={currentStep} 
        onStepClick={goToStep} 
      />

      {/* Current Step Content */}
      <div className="space-y-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <NavigationButtons 
        currentStep={currentStep}
        canProceedToNext={canProceedToNext}
        onNext={nextStep}
        onPrevious={prevStep}
        onSubmit={handleSubmit}
        submitting={submitting}
        isFormValid={isFormValid}
        remainingServerSlots={remaining.serverSlots}
      />
    </div>
  );
}
