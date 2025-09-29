import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle } from 'lucide-react';
import { ValidationRule, validateField } from '../lib/validation';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  validation?: ValidationRule;
  onValidation?: (isValid: boolean, errors: string[]) => void;
  icon?: React.ReactNode;
}

export function ValidatedInput({
  label,
  validation,
  onValidation,
  icon,
  className = '',
  ...props
}: ValidatedInputProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const validateValue = (value: any) => {
    if (!validation) return { isValid: true, errors: [] };
    return validateField(value, validation);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = validateValue(e.target.value);
    setErrors(result.errors);
    onValidation?.(result.isValid, result.errors);
    props.onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    const result = validateValue(e.target.value);
    setErrors(result.errors);
    onValidation?.(result.isValid, result.errors);
    props.onBlur?.(e);
  };

  useEffect(() => {
    if (props.value !== undefined) {
      const result = validateValue(props.value);
      setErrors(result.errors);
      onValidation?.(result.isValid, result.errors);
    }
  }, [props.value]);

  const hasErrors = touched && errors.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label}</Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <Input
          {...props}
          className={`${icon ? 'pl-10' : ''} ${hasErrors ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {hasErrors && (
          <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
        )}
      </div>
      {hasErrors && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}