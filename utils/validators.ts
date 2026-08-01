
// utils/validators.ts - COMPLETE VALIDATION SYSTEM

export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    email?: boolean;
    phone?: boolean;
    accessCode?: boolean;
    custom?: (value: any) => boolean;
    message?: string;
  }
  
  export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
  }
  
  class Validator {
    private rules: Record<string, ValidationRule[]> = {};
  
    // Register validation rules for a form
    registerRules(formName: string, rules: Record<string, ValidationRule[]>) {
      this.rules[formName] = rules;
    }
  
    // Validate a single field
    validateField(value: any, rules: ValidationRule[]): string | null {
      for (const rule of rules) {
        // Required
        if (rule.required && !this.isRequired(value)) {
          return rule.message || 'This field is required';
        }
  
        // Min Length
        if (rule.minLength && value && value.length < rule.minLength) {
          return rule.message || `Minimum ${rule.minLength} characters required`;
        }
  
        // Max Length
        if (rule.maxLength && value && value.length > rule.maxLength) {
          return rule.message || `Maximum ${rule.maxLength} characters allowed`;
        }
  
        // Min value
        if (rule.min !== undefined && value !== '' && Number(value) < rule.min) {
          return rule.message || `Value must be at least ${rule.min}`;
        }
  
        // Max value
        if (rule.max !== undefined && value !== '' && Number(value) > rule.max) {
          return rule.message || `Value must be at most ${rule.max}`;
        }
  
        // Pattern
        if (rule.pattern && value && !rule.pattern.test(value)) {
          return rule.message || 'Invalid format';
        }
  
        // Email
        if (rule.email && value && !this.isValidEmail(value)) {
          return rule.message || 'Invalid email address';
        }
  
        // Phone
        if (rule.phone && value && !this.isValidPhone(value)) {
          return rule.message || 'Invalid phone number';
        }
  
        // Access Code
        if (rule.accessCode && value && !this.isValidAccessCode(value)) {
          return rule.message || 'Access code must be 6 alphanumeric characters';
        }
  
        // Custom
        if (rule.custom && value && !rule.custom(value)) {
          return rule.message || 'Invalid value';
        }
      }
      return null;
    }
  
    // Validate entire form
    validateForm(formName: string, data: Record<string, any>): ValidationResult {
      const errors: Record<string, string> = {};
      const formRules = this.rules[formName];
  
      if (!formRules) {
        return { valid: true, errors: {} };
      }
  
      for (const [field, rules] of Object.entries(formRules)) {
        const error = this.validateField(data[field], rules);
        if (error) {
          errors[field] = error;
        }
      }
  
      return {
        valid: Object.keys(errors).length === 0,
        errors
      };
    }
  
    // Individual validators
    isRequired(value: any): boolean {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }
  
    isValidEmail(email: string): boolean {
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return regex.test(email);
    }
  
    isValidPhone(phone: string): boolean {
      // Cameroon format: 6XXXXXXX or 9XXXXXXX or 2376XXXXXXXX
      const regex = /^(\+237|0)?[6-9][0-9]{8}$/;
      return regex.test(phone.replace(/\s/g, ''));
    }
  
    isValidAccessCode(code: string): boolean {
      return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
    }
  
    isValidName(name: string): boolean {
      return name.trim().length >= 2 && name.trim().length <= 100;
    }
  
    isValidAge(age: number): boolean {
      return age >= 0 && age <= 150;
    }
  
    isValidPrice(price: number): boolean {
      return price >= 0 && price <= 1000000;
    }
  
    isValidDate(date: string): boolean {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime());
    }
  
    isValidPassword(password: string): boolean {
      return password.length >= 6;
    }
  
    // Form-specific validation rules
    getPatientRegistrationRules() {
      return {
        name: [
          { required: true, message: 'Full name is required' },
          { minLength: 2, message: 'Name must be at least 2 characters' },
          { maxLength: 100, message: 'Name is too long' }
        ],
        age: [
          { required: true, message: 'Age is required' },
          { min: 0, message: 'Age must be positive' },
          { max: 150, message: 'Please enter a valid age' }
        ],
        phone: [
          { required: true, message: 'Phone number is required' },
          { phone: true, message: 'Please enter a valid phone number' }
        ],
        email: [
          { email: true, message: 'Please enter a valid email address' }
        ],
        accessCode: [
          { required: true, message: 'Access code is required' },
          { accessCode: true, message: 'Access code must be 6 alphanumeric characters' }
        ]
      };
    }
  
    getStaffRegistrationRules() {
      return {
        name: [
          { required: true, message: 'Staff name is required' },
          { minLength: 2, message: 'Name must be at least 2 characters' }
        ],
        email: [
          { required: true, message: 'Email is required' },
          { email: true, message: 'Please enter a valid email address' }
        ],
        phone: [
          { phone: true, message: 'Please enter a valid phone number' }
        ],
        roles: [
          { required: true, message: 'Please select at least one role' }
        ]
      };
    }
  
    getLabRegistrationRules() {
      return {
        name: [
          { required: true, message: 'Lab name is required' },
          { minLength: 2, message: 'Lab name must be at least 2 characters' }
        ],
        location: [
          { required: true, message: 'Location is required' }
        ],
        adminName: [
          { required: true, message: 'Admin name is required' }
        ],
        adminEmail: [
          { required: true, message: 'Admin email is required' },
          { email: true, message: 'Please enter a valid email address' }
        ]
      };
    }
  }
  
  export const validator = new Validator();
  export default validator;