import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "./PasswordField";
import { useAuthentication } from "@/hooks/useAuthentication";
import { AuthAlert } from "./AuthAlert";
import { Loader2, Mail, Shield } from "lucide-react";
import axios from 'axios';
import { useAuth } from "@/contexts/AuthContext";
import { setAccessToken } from "@/utils/authApi";
import { Lock, Eye, EyeOff, Clock } from 'lucide-react'

export const LoginForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const returnTo = searchParams.get('returnTo');
  const isAdminLogin = returnTo === '/admin';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    isLoading,
    errorMessage,
    setErrorMessage,
    loginLocked,
    lockoutEndTime,
    clearErrors,
  } = useAuthentication();

  useEffect(() => {
    if (user && returnTo) {
      navigate(returnTo, { replace: true });
    }
  }, [user, returnTo, navigate]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      clearErrors();
      setErrorMessage("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      clearErrors();
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (!password) {
      clearErrors();
      setErrorMessage("Please enter your password");
      return;
    }

    try {
      const resp = await axios.post('https://church-management-api-p709.onrender.com/api/auth/login', { email, password });
      const token = resp.data?.data?.accessToken;
      const role = resp.data?.data?.user?.role;
      if (!token) throw new Error('No token returned');
      setAccessToken(token);
      const adminRole = ['admin', 'superadmin'];
      if (adminRole.includes(role)) {
        navigate('/admin-access');
      } else {
        navigate(returnTo || '/');
      }
    } catch (error) {
      clearErrors();
      setErrorMessage('Invalid email or password');
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      clearErrors();
      setErrorMessage("Please enter your email address first");
      return;
    }
    if (!validateEmail(email)) {
      clearErrors();
      setErrorMessage("Please enter a valid email address");
      return;
    }
    setErrorMessage("Password reset is not available. Contact support.");
  };

  return (
   <div className="min-h-screen mt-10 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    {/* Card */}
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-white pt-6 text-gray-900">
        <div className="text-center space-y-3">
          {isAdminLogin && (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Admin Access Required</span>
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-sans">
              {isAdminLogin ? "Admin Login" : "Welcome Back"}
            </h1>
            <p className="text-gray-600 text-sm">
              {isAdminLogin 
                ? "Sign in to access the admin dashboard" 
                : "Sign in to your account to continue"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 space-y-6">
        {/* Alert Messages */}
        <AuthAlert isSignUp={false} errorMessage={errorMessage} />

        {loginLocked && lockoutEndTime && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-3 w-3 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-amber-800 text-sm font-medium">
                  Account Temporarily Locked
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  Too many failed attempts. Try again at {lockoutEndTime.toLocaleTimeString()}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    clearErrors();
                    setEmail(e.target.value.toLowerCase());
                  }}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 outline-none transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    clearErrors();
                    setPassword(e.target.value);
                  }}
                  required
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 outline-none transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-sm text-[#ff0000] hover:text-red-700 font-medium transition-colors"
            >
              Forgot your password?
            </button>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#ff0000] to-red-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={() => navigate('/auth/signup')}
              className="text-[#ff0000] hover:text-red-700 font-semibold transition-colors"
            >
              Sign up now
            </button>
          </p>
        </div>
      </div>
    </div>

    {/* Additional Branding */}
    {/* <div className="text-center mt-8">
      <p className="text-gray-500 text-sm">
        Secure login powered by{" "}
        <span className="font-semibold text-gray-700">Your Brand</span>
      </p>
    </div> */}
  </div>
</div>
  );
};

export default LoginForm;


