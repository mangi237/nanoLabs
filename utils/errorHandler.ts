export const errorHandler = {
    handleError: (error: any, customMessage?: string) => {
      console.error('Application Error:', error);
      const msg = customMessage || error?.message || 'An unexpected error occurred. Please try again.';
      return msg;
    }
  };
  
  export default errorHandler;
  