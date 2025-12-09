const handleSignUp = async () => {
  try {
    // Add loading state
    setIsLoading(true);

    // Check network connectivity first
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    }

    const { data, error } = await supabase.auth.signUp({
      // your signup data
    });

    if (error) {
      throw error;
    }

    // Handle successful signup
  } catch (error) {
    console.error('Signup error:', error);
    setError(error.message || 'Failed to create account. Please try again.');
  } finally {
    setIsLoading(false);
  }
};