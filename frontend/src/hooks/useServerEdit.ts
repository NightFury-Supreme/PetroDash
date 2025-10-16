import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface ResourceLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
}

interface Server {
  _id: string;
  name: string;
  status: string;
  limits: ResourceLimits;
  panelServerId: string;
  createdAt: string;
  updatedAt: string;
  unreachable?: boolean;
  error?: string;
  suspended?: boolean;
}

interface UserLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
}

interface FormData extends ResourceLimits {
  name: string;
}

interface Violations {
  [key: string]: string;
}

interface UseServerEditReturn {
  // State
  loading: boolean;
  server: Server | null;
  userLimits: UserLimits | null;
  usage: ResourceLimits;
  form: FormData;
  violations: Violations;
  error: string | null;
  saving: boolean;
  deleting: boolean;
  showDeleteModal: boolean;
  showSuccessModal: boolean;
  showErrorModal: boolean;
  successMessage: string;
  errorMessage: string;
  
  // Computed values
  remaining: ResourceLimits;
  exceeds: Record<keyof ResourceLimits, boolean>;
  isFormValid: boolean;
  
  // Actions
  setForm: (form: FormData) => void;
  setShowDeleteModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowErrorModal: (show: boolean) => void;
  handleSave: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export function useServerEdit(serverId: string): UseServerEditReturn {
  const router = useRouter();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState<Server | null>(null);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [usage, setUsage] = useState<ResourceLimits>({ 
    diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 
  });
  const [form, setForm] = useState<FormData>({ 
    name: '', diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 
  });
  const [violations, setViolations] = useState<Violations>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.replace('/login');
          return;
        }

        setLoading(true);
        setError(null);

        const [meResponse, usageResponse, serverResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, { 
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers/usage`, { 
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers/${serverId}`, { 
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!meResponse.ok) throw new Error('Failed to load user data');
        if (!usageResponse.ok) throw new Error('Failed to load usage data');
        if (!serverResponse.ok) {
          const errorData = await serverResponse.json();
          throw new Error(errorData?.error || 'Server not found');
        }

        const [me, usageData, serverData] = await Promise.all([
          meResponse.json(),
          usageResponse.json(),
          serverResponse.json()
        ]);

        setUserLimits(me?.resources || null);
        setUsage(usageData || {});
        setServer(serverData);

        
        const newForm = {
          name: serverData?.name || '',
          diskMb: Number(serverData?.limits?.diskMb || 0),
          memoryMb: Number(serverData?.limits?.memoryMb || 0),
          cpuPercent: Number(serverData?.limits?.cpuPercent || 0),
          backups: Number(serverData?.limits?.backups || 0),
          databases: Number(serverData?.limits?.databases || 0),
          allocations: Number(serverData?.limits?.allocations || 0),
        };
        

        setForm(newForm);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load server data');
        console.error('Error loading server data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (serverId) {
      loadData();
    }
  }, [serverId, router]);

  // Calculate remaining resources
  const remaining = useMemo(() => {
    if (!userLimits || !server) return { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 };
    
    // Calculate what's used by other servers (excluding current server)
    const otherServersUsage = {
      diskMb: Math.max(0, Number(usage.diskMb || 0) - Number(server.limits?.diskMb || 0)),
      memoryMb: Math.max(0, Number(usage.memoryMb || 0) - Number(server.limits?.memoryMb || 0)),
      cpuPercent: Math.max(0, Number(usage.cpuPercent || 0) - Number(server.limits?.cpuPercent || 0)),
      backups: Math.max(0, Number(usage.backups || 0) - Number(server.limits?.backups || 0)),
      databases: Math.max(0, Number(usage.databases || 0) - Number(server.limits?.databases || 0)),
      allocations: Math.max(0, Number(usage.allocations || 0) - Number(server.limits?.allocations || 0)),
    };
    
    const calculated = {
      diskMb: Math.max(0, Number(userLimits.diskMb || 0) - otherServersUsage.diskMb),
      memoryMb: Math.max(0, Number(userLimits.memoryMb || 0) - otherServersUsage.memoryMb),
      cpuPercent: Math.max(0, Number(userLimits.cpuPercent || 0) - otherServersUsage.cpuPercent),
      backups: Math.max(0, Number(userLimits.backups || 0) - otherServersUsage.backups),
      databases: Math.max(0, Number(userLimits.databases || 0) - otherServersUsage.databases),
      allocations: Math.max(0, Number(userLimits.allocations || 0) - otherServersUsage.allocations),
    };
    

    
    return calculated;
  }, [userLimits, usage, server]);

  // Check for resource violations
  const exceeds = useMemo(() => {
    // Don't check until data is loaded
    if (loading || !server || !userLimits) {
      return {
        diskMb: false,
        memoryMb: false,
        cpuPercent: false,
        backups: false,
        databases: false,
        allocations: false,
      };
    }
    
    return {
      diskMb: Number(form.diskMb) > remaining.diskMb,
      memoryMb: Number(form.memoryMb) > remaining.memoryMb,
      cpuPercent: Number(form.cpuPercent) > remaining.cpuPercent,
      backups: Number(form.backups) > remaining.backups,
      databases: Number(form.databases) > remaining.databases,
      allocations: Number(form.allocations) > remaining.allocations,
    };
  }, [loading, server, userLimits, form, remaining]);

  // Client-side minimum requirements (same as /create)
  const minLimits: ResourceLimits = {
    diskMb: 100,
    memoryMb: 128,
    cpuPercent: 10,
    backups: 0,
    databases: 0,
    allocations: 1,
  };

  // Compute client-side min violations
  const clientMinViolations: Violations = useMemo(() => {
    const v: Violations = {};
    if (Number(form.diskMb) < minLimits.diskMb) v.diskMb = `Minimum disk is ${minLimits.diskMb} MB`;
    if (Number(form.memoryMb) < minLimits.memoryMb) v.memoryMb = `Minimum memory is ${minLimits.memoryMb} MB`;
    if (Number(form.cpuPercent) < minLimits.cpuPercent) v.cpuPercent = `Minimum CPU is ${minLimits.cpuPercent}%`;
    if (Number(form.backups) < minLimits.backups) v.backups = `Minimum backups is ${minLimits.backups}`;
    if (Number(form.databases) < minLimits.databases) v.databases = `Minimum databases is ${minLimits.databases}`;
    if (Number(form.allocations) < minLimits.allocations) v.allocations = `Minimum allocations is ${minLimits.allocations}`;
    return v;
  }, [form]);

  // Merge server-returned violations with client-side min violations
  const mergedViolations: Violations = useMemo(() => ({
    ...violations,
    ...clientMinViolations,
  }), [violations, clientMinViolations]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    // Don't validate until data is loaded
    if (loading || !server || !userLimits) {
      return false;
    }
    
    const nameValid = Boolean(form.name.trim());
    const noExceeds = !Object.values(exceeds).some(Boolean);
    const noViolations = Object.keys(mergedViolations).length === 0;
    

    
    return nameValid && noExceeds && noViolations;
  }, [loading, server, userLimits, form.name, exceeds, mergedViolations, remaining]);

  // Handle form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saving) {
      return;
    }
    
    if (!isFormValid) {
      setError('Please fix the validation errors before saving');
      return;
    }

    setError(null);
    setViolations({});
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');

      const requestBody = {
        name: form.name.trim(),
        limits: {
          diskMb: Number(form.diskMb),
          memoryMb: Number(form.memoryMb),
          cpuPercent: Number(form.cpuPercent),
          backups: Number(form.backups),
          databases: Number(form.databases),
          allocations: Number(form.allocations)
        }
      };



      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers/${serverId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data?.violations) {
          setViolations(data.violations);
          throw new Error('Resource limits exceeded. Please check the validation errors below.');
        }
        throw new Error(data?.error || 'Update failed');
      }

      // Update the server data with the response first
      if (data.server) {
        setServer(data.server);
        
        // Also update the form data to match the server response
        setForm({
          name: data.server.name || form.name,
          diskMb: Number(data.server.limits?.diskMb || 0),
          memoryMb: Number(data.server.limits?.memoryMb || 0),
          cpuPercent: Number(data.server.limits?.cpuPercent || 0),
          backups: Number(data.server.limits?.backups || 0),
          databases: Number(data.server.limits?.databases || 0),
          allocations: Number(data.server.limits?.allocations || 0),
        });
      }
      
      // Clear any previous errors
      setError(null);
      setViolations({});
      
      // Show success modal
      const successMsg = `Server "${form.name}" has been updated successfully!`;
      setSuccessMessage(successMsg);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update server';
      setError(errorMsg);
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      console.error('Error updating server:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle server deletion
  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/servers/${serverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || 'Delete failed');
      }

      setShowDeleteModal(false);
      setSuccessMessage(`Server "${server?.name}" has been deleted successfully!`);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete server';
      setError(errorMsg);
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      console.error('Error deleting server:', err);
    } finally {
      setDeleting(false);
    }
  };

  return {
    // State
    loading,
    server,
    userLimits,
    usage,
    form,
    violations: mergedViolations,
    error,
    saving,
    deleting,
    showDeleteModal,
    showSuccessModal,
    showErrorModal,
    successMessage,
    errorMessage,
    
    // Computed values
    remaining,
    exceeds,
    isFormValid,
    
    // Actions
    setForm,
    setShowDeleteModal,
    setShowSuccessModal,
    setShowErrorModal,
    handleSave,
    handleDelete,
  };
}