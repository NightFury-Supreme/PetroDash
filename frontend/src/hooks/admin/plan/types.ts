export interface PlanFormData {
  name: string;
  description: string;
  strikeThroughPrice: number;
  pricePerMonth: number;
  pricePerYear: number;
  visibility: 'public' | 'unlisted';
  availableAt: string;
  availableUntil: string;
  stock: number;
  limitPerCustomer: number;
  category: string;
  redirectionLink: string;
  billingOptions: {
    renewable: boolean;
    nonRenewable: boolean;
    lifetime: boolean;
  };
  availableBillingCycles: string[];
  productContent: {
    recurrentResources: {
      cpuPercent: number;
      memoryMb: number;
      diskMb: number;
      swapMb: number;
      blockIoProportion: number;
      cpuPinning: string;
    };
    additionalAllocations: number;
    databases: number;
    backups: number;
    coins: number;
    serverLimit: number;
  };
  staffNotes: string;
  popular: boolean;
  sortOrder: number;
}

export interface UsePlanFormReturn {
  loading: boolean;
  saving: boolean;
  error: string | null;
  formData: PlanFormData;
  eggs: Array<{ _id: string; name: string; description: string }>;
  locations: Array<{ _id: string; name: string; description: string }>;
  setFormData: (data: Partial<PlanFormData>) => void;
  handleInputChange: (field: string, value: string | number | boolean | string[]) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
  resetForm: () => void;
  isFormValid: boolean;
  validationErrors: Record<string, string>;
}

export const initialFormData: PlanFormData = {
  name: '',
  description: '',
  strikeThroughPrice: 0,
  pricePerMonth: 0,
  pricePerYear: 0,
  visibility: 'public',
  availableAt: '',
  availableUntil: '',
  stock: 0,
  limitPerCustomer: 1,
  category: '',
  redirectionLink: '',
  billingOptions: {
    renewable: true,
    nonRenewable: false,
    lifetime: false,
  },
  availableBillingCycles: ['monthly'],
  productContent: {
    recurrentResources: {
      cpuPercent: 100,
      memoryMb: 1024,
      diskMb: 10240,
      swapMb: 0,
      blockIoProportion: 100,
      cpuPinning: '',
    },
    additionalAllocations: 0,
    databases: 1,
    backups: 1,
    coins: 0,
    serverLimit: 1,
  },
  staffNotes: '',
  popular: false,
  sortOrder: 0,
};
