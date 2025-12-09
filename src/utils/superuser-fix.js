/**
 * Utility functions to handle superuser state persistence and verification
 */

/**
 * Check if the current user is a superuser based on email and localStorage
 * @param {string} email - The user's email address
 * @returns {boolean} - Whether the user is a superuser
 */
export const checkSuperUserStatus = (email) => {
  if (!email) {
    console.log('checkSuperUserStatus: No email provided');
    // If no email, fall back to localStorage
    return localStorage.getItem('glm-is-superuser') === 'true';
  }

  // List of superuser emails
  const superUserEmails = [
    'ojidelawrence@gmail.com',
    'popsabey1@gmail.com',
    'dev.samadeyemi@gmail.com'
    // Add other superuser emails as needed
  ];

  // Normalize email for comparison
  const normalizedEmail = email.toLowerCase().trim();
  console.log('checkSuperUserStatus: Checking email:', normalizedEmail);

  // Check if email is in the superuser list
  const isSuperUserByEmail = superUserEmails.some(e =>
    e.toLowerCase().trim() === normalizedEmail
  );

  // Check if superuser status is stored in localStorage
  const storedSuperUserStatus = localStorage.getItem('glm-is-superuser') === 'true';

  console.log('checkSuperUserStatus results:', {
    email: normalizedEmail,
    isSuperUserByEmail,
    storedSuperUserStatus,
    result: isSuperUserByEmail || storedSuperUserStatus
  });

  // If user is a superuser by email, ensure it's stored in localStorage
  if (isSuperUserByEmail) {
    localStorage.setItem('glm-is-superuser', 'true');
    console.log('checkSuperUserStatus: Set superuser status in localStorage to true');
  }

  return isSuperUserByEmail || storedSuperUserStatus;
};

/**
 * Set the superuser status in localStorage
 * @param {boolean} status - The superuser status to set
 */
export const setSuperUserStatus = (status) => {
  console.log('setSuperUserStatus called with:', status);
  if (status) {
    localStorage.setItem('glm-is-superuser', 'true');
    console.log('Superuser status set to true in localStorage');
  } else {
    localStorage.removeItem('glm-is-superuser');
    console.log('Superuser status removed from localStorage');
  }
};

/**
 * Clear the superuser status from localStorage
 */
export const clearSuperUserStatus = () => {
  console.log('clearSuperUserStatus called');
  localStorage.removeItem('glm-is-superuser');
  console.log('Superuser status cleared from localStorage');
};

/**
 * Get the superuser status from localStorage
 * @returns {boolean} - Whether the user is a superuser according to localStorage
 */
export const getSuperUserStatus = () => {
  const status = localStorage.getItem('glm-is-superuser') === 'true';
  console.log('getSuperUserStatus returning:', status);
  return status;
};
