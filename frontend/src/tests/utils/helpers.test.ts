import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  daysBetweenDates,
  truncateString,
  getStatusVariant,
  getContractTypeLabel,
  getExperienceLevelLabel,
  getInitials,
  isDateInFuture,
  formatFileSize,
} from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly with default locale', () => {
      const date = '2023-05-15';
      const formattedDate = formatDate(date);
      expect(formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4}/); // DD/MM/YYYY for fr-FR locale
    });

    it('formats date correctly with custom locale', () => {
      const date = '2023-05-15';
      const formattedDate = formatDate(date, 'en-US');
      expect(formattedDate).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // M/D/YYYY for en-US locale
    });

    it('returns empty string for empty input', () => {
      expect(formatDate('')).toBe('');
    });

    it('handles invalid date gracefully', () => {
      const invalidDate = 'not-a-date';
      expect(() => formatDate(invalidDate)).not.toThrow();
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time correctly with default locale', () => {
      const date = '2023-05-15';
      const time = '14:30';
      const formattedDateTime = formatDateTime(date, time);
      expect(formattedDateTime).toContain('14:30');
    });

    it('formats date and time correctly with custom locale', () => {
      const date = '2023-05-15';
      const time = '14:30';
      const formattedDateTime = formatDateTime(date, time, 'en-US');
      expect(formattedDateTime).toContain('2:30');  // Use 12-hour format for en-US
    });

    it('returns empty string for empty date input', () => {
      expect(formatDateTime('', '14:30')).toBe('');
    });

    it('handles invalid date gracefully', () => {
      const invalidDate = 'not-a-date';
      const time = '14:30';
      expect(() => formatDateTime(invalidDate, time)).not.toThrow();
    });
  });

  describe('daysBetweenDates', () => {
    it('calculates days between two dates correctly', () => {
      const startDate = '2023-05-01';
      const endDate = '2023-05-10';
      expect(daysBetweenDates(startDate, endDate)).toBe(9);
    });

    it('uses current date as end date when not provided', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      const days = daysBetweenDates(startDate.toISOString());
      expect(days).toBe(5);
    });

    it('returns positive days even when end date is before start date', () => {
      const startDate = '2023-05-10';
      const endDate = '2023-05-01';
      expect(daysBetweenDates(startDate, endDate)).toBe(9);
    });
  });

  describe('truncateString', () => {
    it('does not modify strings shorter than max length', () => {
      const str = 'Short string';
      expect(truncateString(str, 20)).toBe(str);
    });

    it('truncates strings longer than max length and adds ellipsis', () => {
      const str = 'This is a very long string that needs to be truncated';
      expect(truncateString(str, 20)).toBe('This is a very long...');
    });

    it('uses default max length of 100 when not specified', () => {
      const str = 'a'.repeat(101);
      const truncated = truncateString(str);
      expect(truncated.length).toBe(103); // 100 chars + '...'
    });

    it('returns empty string for empty input', () => {
      expect(truncateString('')).toBe('');
    });
  });

  describe('getStatusVariant', () => {
    it('returns "info" for "new" status', () => {
      expect(getStatusVariant('new')).toBe('info');
    });

    it('returns "warning" for "toContact" status', () => {
      expect(getStatusVariant('toContact')).toBe('warning');
    });

    it('returns "primary" for "interview" status', () => {
      expect(getStatusVariant('interview')).toBe('primary');
    });

    it('returns "success" for "hired" and "completed" status', () => {
      expect(getStatusVariant('hired')).toBe('success');
      expect(getStatusVariant('completed')).toBe('success');
    });

    it('returns "danger" for "rejected", "canceled", "noShow" status', () => {
      expect(getStatusVariant('rejected')).toBe('danger');
      expect(getStatusVariant('canceled')).toBe('danger');
      expect(getStatusVariant('noShow')).toBe('danger');
    });

    it('returns "default" for unknown status', () => {
      expect(getStatusVariant('unknown')).toBe('default');
    });
  });

  describe('getContractTypeLabel', () => {
    it('returns correct translation for contract type', () => {
      const translations = {
        jobs: {
          contracts: {
            cdi: 'Permanent',
            cdd: 'Fixed-term',
            internship: 'Internship',
          },
        },
      };

      expect(getContractTypeLabel('cdi', translations)).toBe('Permanent');
      expect(getContractTypeLabel('cdd', translations)).toBe('Fixed-term');
      expect(getContractTypeLabel('internship', translations)).toBe('Internship');
    });

    it('works with translation function', () => {
      const tFunction = (key: string) => {
        const translations: { [key: string]: string } = {
          'jobs.contracts.cdi': 'Permanent',
          'jobs.contracts.cdd': 'Fixed-term',
        };
        return translations[key] || key;
      };

      expect(getContractTypeLabel('cdi', tFunction)).toBe('Permanent');
      expect(getContractTypeLabel('cdd', tFunction)).toBe('Fixed-term');
    });
  });

  describe('getExperienceLevelLabel', () => {
    it('returns correct translation for experience level', () => {
      const translations = {
        jobs: {
          experience_levels: {
            junior: 'Junior',
            intermediate: 'Intermediate',
            senior: 'Senior',
          },
        },
      };

      expect(getExperienceLevelLabel('junior', translations)).toBe('Junior');
      expect(getExperienceLevelLabel('intermediate', translations)).toBe('Intermediate');
      expect(getExperienceLevelLabel('senior', translations)).toBe('Senior');
    });

    it('works with translation function', () => {
      const tFunction = (key: string) => {
        const translations: { [key: string]: string } = {
          'jobs.experience_levels.junior': 'Junior',
          'jobs.experience_levels.senior': 'Senior',
        };
        return translations[key] || key;
      };

      expect(getExperienceLevelLabel('junior', tFunction)).toBe('Junior');
      expect(getExperienceLevelLabel('senior', tFunction)).toBe('Senior');
    });
  });

  describe('getInitials', () => {
    it('gets first two initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Marie-Claude Dupont')).toBe('MD');
    });

    it('gets only one initial if name has only one part', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('gets maximum two initials even for long names', () => {
      expect(getInitials('John Doe Smith Johnson')).toBe('JD');
    });

    it('returns empty string for empty input', () => {
      expect(getInitials('')).toBe('');
    });

    it('converts initials to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });

  describe('isDateInFuture', () => {
    it('returns true for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isDateInFuture(futureDate.toISOString())).toBe(true);
    });

    it('returns false for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isDateInFuture(pastDate.toISOString())).toBe(false);
    });

    it('considers both date and time when provided', () => {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      
      // Time in the future (assuming test doesn't run exactly at 23:59)
      const futureTime = '23:59';
      expect(isDateInFuture(dateString, futureTime)).toBe(true);
      
      // Time in the past (assuming test doesn't run exactly at 00:01)
      const pastTime = '00:01';
      expect(isDateInFuture(dateString, pastTime)).toBe(false);
    });

    it('returns false for empty input', () => {
      expect(isDateInFuture('')).toBe(false);
    });

    it('handles invalid date gracefully', () => {
      expect(() => isDateInFuture('not-a-date')).not.toThrow();
      expect(isDateInFuture('not-a-date')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(100)).toBe('100 Bytes');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    });

    it('formats with custom decimal places', () => {
      expect(formatFileSize(1536, 2)).toBe('1.50 KB');
    });

    it('returns "0 Bytes" for 0', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
  });
});