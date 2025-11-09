'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Driver {
  id: string;
  name: string;
  vehicleId: string;
  lat: number;
  lng: number;
  attentionScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastAlert: string;
  speed: number;
  route: string;
  sparklineData: number[];
}

interface DriverFormData {
  name: string;
  vehicleId: string;
  route: string;
  email: string;
  phone: string;
}

interface DriverManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver | null;
  mode: 'create' | 'edit';
  onSave: (data: DriverFormData) => Promise<void>;
}

const DriverManagementModal = ({ isOpen, onClose, driver, mode, onSave }: DriverManagementModalProps) => {
  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    vehicleId: '',
    route: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<DriverFormData>>({});

  const routes = [
    'सूरत रिंग रोड उत्तर (Ring Road North)',
    'डुमस रोड (Dumas Beach Road)',
    'वीआर मॉल मार्ग (VR Mall Route)',
    'सिटी लाइट मार्ग (City Light Corridor)',
    'अठवा गेट चक्र (Athwa Gate Circle)'
  ];

  useEffect(() => {
    if (driver && mode === 'edit') {
      setFormData({
        name: driver.name,
        vehicleId: driver.vehicleId,
        route: driver.route,
        email: '', // Would come from profile data
        phone: ''  // Would come from profile data
      });
    } else {
      setFormData({
        name: '',
        vehicleId: '',
        route: routes[0],
        email: '',
        phone: ''
      });
    }
  }, [driver, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof DriverFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<DriverFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.vehicleId.trim()) {
      newErrors.vehicleId = 'Vehicle ID is required';
    }
    if (!formData.route) {
      newErrors.route = 'Route is required';
    }
    if (mode === 'create') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone is required';
      } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving driver:', error);
      alert('Failed to save driver. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-glass"
        onClick={onClose}
      />
      
      <div className="relative bg-card border border-border rounded-lg shadow-elevation-3 max-w-xl w-full mx-4">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {mode === 'create' ? 'Add New Driver' : 'Edit Driver'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'create' ? 'Register a new driver to the fleet' : 'Update driver information'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-micro"
          >
            <Icon name="XMarkIcon" size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Driver Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                errors.name ? 'border-error' : 'border-border'
              }`}
              placeholder="Enter driver name"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Vehicle ID */}
          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-foreground mb-1">
              Vehicle ID *
            </label>
            <input
              type="text"
              id="vehicleId"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                errors.vehicleId ? 'border-error' : 'border-border'
              }`}
              placeholder="VW-2024-001"
            />
            {errors.vehicleId && <p className="text-error text-xs mt-1">{errors.vehicleId}</p>}
          </div>

          {/* Route */}
          <div>
            <label htmlFor="route" className="block text-sm font-medium text-foreground mb-1">
              Assigned Route *
            </label>
            <select
              id="route"
              name="route"
              value={formData.route}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-background border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                errors.route ? 'border-error' : 'border-border'
              }`}
            >
              {routes.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
            {errors.route && <p className="text-error text-xs mt-1">{errors.route}</p>}
          </div>

          {mode === 'create' && (
            <>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                    errors.email ? 'border-error' : 'border-border'
                  }`}
                  placeholder="driver@example.com"
                />
                {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                    errors.phone ? 'border-error' : 'border-border'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <p className="text-error text-xs mt-1">{errors.phone}</p>}
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end space-x-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-micro"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-micro flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icon name="CheckIcon" size={16} />
                  <span>{mode === 'create' ? 'Add Driver' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverManagementModal;
