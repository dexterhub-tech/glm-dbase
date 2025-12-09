// Fix for AuthContext.tsx
// 1. Make sure the email comparison is case-insensitive
// 2. Add more debug logging
// 3. Ensure the superuser status is correctly set

// In the fetchProfile function, replace the superuser check with:

// Check for super admin (ojidelawrence@gmail.com)
// Make sure to convert to lowercase for case-insensitive comparison
const userEmail = data.email?.toLowerCase() || '';
const superAdminEmail = 'ojidelawrence@gmail.com'.toLowerCase();

console.log('Checking superuser status for email:', userEmail);
console.log('Comparing with superadmin email:', superAdminEmail);

const isSuperAdmin = userEmail === superAdminEmail;

if (isSuperAdmin) {
  console.log('User is a superadmin based on email match!');
} else {
  console.log('User is NOT a superadmin based on email comparison');
}
