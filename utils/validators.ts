export const validators = {
    isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    isValidPhone: (phone: string) => /^\+?[\d\s-]{7,15}$/.test(phone),
    isNotEmpty: (val: string) => val.trim().length > 0
  };
  
  export default validators;
  