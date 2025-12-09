import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAlert } from "./AuthAlert";
import { Phone, MapPin, Mail, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthentication } from "@/hooks/useAuthentication";
import { isValidPhoneNumber, getPhoneValidationMessage } from "@/utils/phoneValidation";
import axios from "axios";


export const SignupForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // const [address, setAddress] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { isLoading, errorMessage, setErrorMessage, clearErrors, validateAndSetPassword } = useAuthentication();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validate = (): string | null => {
    if (!fullName || fullName.trim().length < 2) return "Please enter your full name (at least 2 characters)";
    if (!email) return "Please enter your email address";
    if (!validateEmail(email)) return "Please enter a valid email address";
    if (!password) return "Please enter a password";
    validateAndSetPassword(password);
    if (password !== confirmPassword) return "Passwords do not match";
    if (!isValidPhoneNumber(phone)) return getPhoneValidationMessage();
    if (!acceptTerms) return "You must accept the terms and conditions";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     try {
        const resp = await axios.post('https://church-management-api-p709.onrender.com/api/auth/register', {
          fullName: fullName,
          email: email,
          password: password,
          phone: phone
        })
   
        if(resp.data?.data?.accessToken) {
          navigate('/auth/login');
        }
      } catch (error) {
        clearErrors();
        setErrorMessage('Error signing up. Please try again.');
      }
    const err = validate();
    if (err) {
      clearErrors();
      setErrorMessage(err);
      return;
    }
    setErrorMessage("Signup is disabled. Please contact an administrator.");
  };

  return (
    <div className="min-h-screen mt-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-white pt-6 text-gray-900">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold font-sans">Create an account</h1>
              <p className="text-gray-600 text-sm">Enter your details to sign up</p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-6">
            <AuthAlert isSignUp={true} errorMessage={errorMessage} />

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => { clearErrors(); setFullName(e.target.value); }}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { clearErrors(); setEmail(e.target.value.toLowerCase()); }}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 outline-none transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                  {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone className="h-5 w-5" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => { clearErrors(); setPhone(e.target.value); }}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 outline-none transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { clearErrors(); setPassword(e.target.value); }}
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { clearErrors(); setConfirmPassword(e.target.value); }}
                      required
                      className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 outline-none transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

              

              
              </div>

              {/* Terms */}
              <div className="flex items-center space-x-2">
                <input id="terms" type="checkbox" checked={acceptTerms} onChange={(e) => { clearErrors(); setAcceptTerms(e.target.checked); }} />
                <label htmlFor="terms" className="text-sm font-medium leading-none">I accept the <a href="/terms" className="text-[#ff0000] hover:text-red-700" target="_blank">terms and conditions</a></label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#ff0000] to-red-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Create Account
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                Already have an account? {" "}
                <button type="button" onClick={() => navigate('/auth/login')} className="text-[#ff0000] hover:text-red-700 font-semibold transition-colors">Sign in</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;


