// components/ui/ToggleSwitch.tsx
import React from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onToggle, disabled = false }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) onToggle();
  };

  return (
    <label className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} onClick={handleClick}>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={enabled} readOnly />
        <div className={`block w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'} ${!disabled && 'hover:opacity-80'}`}></div>
        <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-4' : ''} shadow-sm`}></div>
      </div>
      <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
};

export default ToggleSwitch;