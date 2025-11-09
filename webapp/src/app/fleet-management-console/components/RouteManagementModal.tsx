'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import Portal from '@/components/ui/Portal';

interface Route {
  id: string;
  name: string;
  description: string;
  distance: number; // in km
  estimatedTime: number; // in minutes
  riskLevel: 'low' | 'medium' | 'high';
  waypoints: { lat: number; lng: number }[];
}

interface RouteFormData {
  name: string;
  description: string;
  distance: string;
  estimatedTime: string;
}

interface RouteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  route?: Route | null;
  mode: 'create' | 'edit';
  onSave: (data: RouteFormData) => Promise<void>;
}

const RouteManagementModal = ({ isOpen, onClose, route, mode, onSave }: RouteManagementModalProps) => {
  const [formData, setFormData] = useState<RouteFormData>({
    name: route?.name || '',
    description: route?.description || '',
    distance: route?.distance.toString() || '',
    estimatedTime: route?.estimatedTime.toString() || ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<RouteFormData>>({});

  React.useEffect(() => {
    if (route && mode === 'edit') {
      setFormData({
        name: route.name,
        description: route.description,
        distance: route.distance.toString(),
        estimatedTime: route.estimatedTime.toString()
      });
    } else {
      setFormData({
        name: '',
        description: '',
        distance: '',
        estimatedTime: ''
      });
    }
  }, [route, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof RouteFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<RouteFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Route name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      newErrors.distance = 'Valid distance is required';
    }
    if (!formData.estimatedTime || parseInt(formData.estimatedTime) <= 0) {
      newErrors.estimatedTime = 'Valid estimated time is required';
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
      console.error('Error saving route:', error);
      alert('Failed to save route. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-glass"
          onClick={onClose}
        />
        
        <div className="relative z-[100000] bg-card border border-border rounded-lg shadow-elevation-3 max-w-xl w-full mx-4">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {mode === 'create' ? 'Add New Route' : 'Edit Route'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'create' ? 'Create a new route for drivers' : 'Update route information'}
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
              Route Name *
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
              placeholder="सूरत रिंग रोड उत्तर (Ring Road North)"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                errors.description ? 'border-error' : 'border-border'
              }`}
              placeholder="Main arterial road connecting SVNIT to northern suburbs..."
            />
            {errors.description && <p className="text-error text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Distance and Time - Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Distance */}
            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-foreground mb-1">
                Distance (km) *
              </label>
              <input
                type="number"
                id="distance"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                  errors.distance ? 'border-error' : 'border-border'
                }`}
                placeholder="12.5"
              />
              {errors.distance && <p className="text-error text-xs mt-1">{errors.distance}</p>}
            </div>

            {/* Estimated Time */}
            <div>
              <label htmlFor="estimatedTime" className="block text-sm font-medium text-foreground mb-1">
                Est. Time (min) *
              </label>
              <input
                type="number"
                id="estimatedTime"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary ${
                  errors.estimatedTime ? 'border-error' : 'border-border'
                }`}
                placeholder="25"
              />
              {errors.estimatedTime && <p className="text-error text-xs mt-1">{errors.estimatedTime}</p>}
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-muted/30 border border-border rounded-md p-3">
            <p className="text-xs text-muted-foreground">
              <Icon name="InformationCircleIcon" size={14} className="inline mr-1" />
              Waypoint coordinates will be automatically generated based on the route name and description.
            </p>
          </div>

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
                  <span>{mode === 'create' ? 'Add Route' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
};

export default RouteManagementModal;
