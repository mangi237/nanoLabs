// utils/errorHandler.ts
import { Alert } from 'react-native';

export type ErrorType = 'network' | 'auth' | 'validation' | 'database' | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  originalError?: any;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: any): AppError {
    let appError: AppError = {
      type: 'unknown',
      message: 'An unexpected error occurred',
      originalError: error
    };

    // Firebase Auth Errors
    if (error.code?.startsWith('auth/')) {
      appError.type = 'auth';
      appError.message = this.getAuthErrorMessage(error.code);
      appError.code = error.code;
    }
    // Firebase Firestore Errors
    else if (error.code?.startsWith('firestore/')) {
      appError.type = 'database';
      appError.message = this.getFirestoreErrorMessage(error.code);
      appError.code = error.code;
    }
    // Network Errors
    else if (error.message?.includes('network') || error.message?.includes('internet')) {
      appError.type = 'network';
      appError.message = 'Please check your internet connection';
    }
    // Validation Errors
    else if (error.type === 'validation') {
      appError.type = 'validation';
      appError.message = error.message;
    }
    // Default
    else {
      appError.message = error.message || 'An unexpected error occurred';
    }

    // Log error
    this.logError(appError);

    // Show user-friendly alert
    this.showAlert(appError);

    return appError;
  }

  private getAuthErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
    };
    return messages[code] || 'Authentication error';
  }

  private getFirestoreErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'firestore/permission-denied': 'You don\'t have permission to perform this action',
      'firestore/not-found': 'Data not found',
      'firestore/already-exists': 'Data already exists',
      'firestore/invalid-argument': 'Invalid data provided',
    };
    return messages[code] || 'Database error';
  }

  private logError(error: AppError): void {
    this.errorLogs.push({
      ...error,
      timestamp: new Date().toISOString()
    } as any);
    console.error('❌ Error:', error);
  }

  private showAlert(error: AppError): void {
    Alert.alert(
      this.getAlertTitle(error.type),
      error.message,
      [{ text: 'OK' }]
    );
  }

  private getAlertTitle(type: ErrorType): string {
    const titles: Record<ErrorType, string> = {
      network: 'Connection Error',
      auth: 'Authentication Error',
      validation: 'Validation Error',
      database: 'Database Error',
      unknown: 'Error'
    };
    return titles[type] || 'Error';
  }

  getErrorLogs(): AppError[] {
    return this.errorLogs;
  }

  clearErrorLogs(): void {
    this.errorLogs = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();
export default errorHandler;