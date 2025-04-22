/**
 * Format a date string to localized format
 * @param dateString - ISO date string
 * @param locale - Locale string (default: 'fr-FR')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, locale = 'fr-FR'): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  /**
   * Format a date with time
   * @param dateString - ISO date string
   * @param timeString - Time string (HH:MM)
   * @param locale - Locale string (default: 'fr-FR')
   * @returns Formatted date and time string
   */
  export const formatDateTime = (
    dateString: string,
    timeString: string,
    locale = 'fr-FR'
  ): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(`${dateString}T${timeString}`);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date and time:', error);
      return `${dateString} ${timeString}`;
    }
  };
  
  /**
   * Calculate the time difference between two dates in days
   * @param startDate - Start date string
   * @param endDate - End date string (default: current date)
   * @returns Number of days between dates
   */
  export const daysBetweenDates = (
    startDate: string,
    endDate?: string
  ): number => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());
    
    // Convert to days
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  /**
   * Truncate a string if it's longer than maxLength
   * @param str - String to truncate
   * @param maxLength - Maximum length (default: 100)
   * @returns Truncated string with ellipsis if necessary
   */
  export const truncateString = (str: string, maxLength = 100): string => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    
    return `${str.slice(0, maxLength)}...`;
  };
  
  /**
   * Get status badge variant based on candidate or interview status
   * @param status - Status string
   * @returns Badge variant name
   */
  export const getStatusVariant = (status: string): string => {
    switch (status) {
      case 'new':
        return 'info';
      case 'toContact':
        return 'warning';
      case 'interview':
        return 'primary';
      case 'hired':
      case 'completed':
        return 'success';
      case 'rejected':
      case 'canceled':
      case 'noShow':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  /**
   * Get contract type label from type code
   * @param contractType - Contract type code
   * @param translations - Translations object or function
   * @returns Localized contract type label
   */
  export const getContractTypeLabel = (
    contractType: string, 
    translations: any
  ): string => {
    const path = `jobs.contracts.${contractType}`;
    
    // Handle both direct translation object and i18next t function
    if (typeof translations === 'function') {
      return translations(path);
    }
    
    // Try to get nested value from an object
    return path.split('.').reduce((o, i) => {
      return o ? o[i] : null;
    }, translations);
  };
  
  /**
   * Get experience level label from level code
   * @param level - Experience level code
   * @param translations - Translations object or function
   * @returns Localized experience level label
   */
  export const getExperienceLevelLabel = (
    level: string,
    translations: any
  ): string => {
    const path = `jobs.experience_levels.${level}`;
    
    // Handle both direct translation object and i18next t function
    if (typeof translations === 'function') {
      return translations(path);
    }
    
    // Try to get nested value from an object
    return path.split('.').reduce((o, i) => {
      return o ? o[i] : null;
    }, translations);
  };
  
  /**
   * Generate initials from a full name
   * @param name - Full name string
   * @returns Initials (max 2 characters)
   */
  export const getInitials = (name: string): string => {
    if (!name) return '';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  /**
   * Check if a date is in the future
   * @param dateString - Date string
   * @param timeString - Optional time string
   * @returns Boolean indicating if date is in the future
   */
  export const isDateInFuture = (
    dateString: string,
    timeString?: string
  ): boolean => {
    if (!dateString) return false;
    
    try {
      const date = timeString 
        ? new Date(`${dateString}T${timeString}`) 
        : new Date(dateString);
      
      return date > new Date();
    } catch (error) {
      console.error('Error checking if date is in future:', error);
      return false;
    }
  };
  
  /**
   * Format file size in human-readable format
   * @param bytes - Size in bytes
   * @param decimals - Number of decimal places
   * @returns Formatted file size string
   */
  export const formatFileSize = (bytes: number, decimals = 1): string => {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };