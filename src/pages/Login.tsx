import { useState } from 'react';
import { UserCircle, Mail, Lock, User, Building, Heart, Shield } from 'lucide-react';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../api';

interface LoginProps {
  onNavigate: (page: string) => void;
}

type UserRole = 'admin' | 'ngo' | 'donor' | 'user';

function Login({ onNavigate }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [signupStep, setSignupStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    gender: '',
    pan_number: '',
    aadhaar_number: '',
    organization: '',
    registration_number: '',
    registration_date: '',
    category: '',
    city: '',
    state: '',
    country: '',
    mission: '',
    vision: '',
    website: ''
  });

  const { login } = useAuth();

  const roles = [
    {
      id: 'admin' as UserRole,
      label: 'Admin',
      icon: <Shield className="w-6 h-6" />,
      description: 'Manage platform and users',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      id: 'ngo' as UserRole,
      label: 'NGO',
      icon: <Building className="w-6 h-6" />,
      description: 'Receive and manage donations',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'donor' as UserRole,
      label: 'Donor',
      icon: <Heart className="w-6 h-6" />,
      description: 'Make charitable contributions',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1️⃣ Basic validation
  if (isSignup && formData.password !== formData.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    // 2️⃣ AUTH API (login / signup)
    const authEndpoint = isSignup
      ? `${API_BASE_URL}/api/auth/signup`
      : `${API_BASE_URL}/api/auth/login`;

    const authPayload = {
      email: formData.email,
      password: formData.password,
      role: selectedRole,
      name: formData.name,
      organization: formData.organization,
    };

    const authRes = await fetch(authEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authPayload),
    });

    const authData = await authRes.json();
    console.debug('auth response', authData);

    if (!authRes.ok) {
      alert(authData.error || "Authentication failed");
      return;
    }

    // 3️⃣ Save auth context (store token & user_id if provided)
    login(authData.role, authData.token ?? null, authData.user_id ?? null);
    
    // 3️⃣a Store token in localStorage for API requests
    if (authData.token) {
      localStorage.setItem('token', authData.token);
    }

    // 4️⃣ CREATE PROFILE ONLY DURING SIGNUP
    if (isSignup) {
      // ---- DONOR PROFILE ----
      if (selectedRole === "donor") {
        await fetch(`${API_BASE_URL}/api/profile/donor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: authData.user_id,
            name: formData.name,
            phone: formData.phone,
            dob: formData.dob || null,
            gender: formData.gender || null,
            pan_number: formData.pan_number || null,
            aadhaar_number: formData.aadhaar_number || null,
          }),
        });
      }

      // ---- NGO PROFILE ----
      if (selectedRole === "ngo") {
        await fetch(`${API_BASE_URL}/api/profile/ngo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: authData.user_id,
            registration_number: formData.registration_number,
            registration_date: formData.registration_date,
            category: formData.category,
            phone: formData.phone,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            mission: formData.mission || null,
            vision: formData.vision || null,
            website: formData.website || null,
          }),
        });
      }
    }

    // 5️⃣ ROLE-BASED REDIRECT
    if (authData.role === "donor") {
      onNavigate("donor-dashboard");
    } else if (authData.role === "ngo") {
      onNavigate("ngo-dashboard");
    } else if (authData.role === "admin") {
      onNavigate("dashboard");
    }

  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
};



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Multi-step controls for signup
  const handleNext = () => {
    // Basic validation before moving to step 2
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSignupStep(2);
  };

  const handleBack = () => setSignupStep(1);

  const toggleSignup = () => {
    setIsSignup((prev) => !prev);
    setSignupStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {isSignup
              ? 'Join TrustBridge and start making a difference'
              : 'Sign in to continue your journey'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Role Selection */}
            <div className="bg-gradient-to-br from-blue-600 to-green-600 p-8 text-white">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Select Your Role</h2>
                <p className="text-blue-100">Choose how you want to participate</p>
              </div>

              <div className="space-y-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full p-4 rounded-xl transition-all duration-200 ${
                      selectedRole === role.id
                        ? 'bg-white text-gray-800 shadow-lg scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          selectedRole === role.id
                            ? `bg-gradient-to-r ${role.color}`
                            : 'bg-white/20'
                        }`}
                      >
                        {role.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{role.label}</div>
                        <div
                          className={`text-sm ${
                            selectedRole === role.id ? 'text-gray-600' : 'text-blue-100'
                          }`}
                        >
                          {role.description}
                        </div>
                      </div>
                      {selectedRole === role.id && (
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 p-4 bg-white/10 rounded-lg">
                <p className="text-sm text-blue-100">
                  <span className="font-semibold">Note:</span> Each role has different
                  permissions and access levels. Choose the one that best fits your needs.
                </p>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserCircle className="inline w-4 h-4 mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline w-4 h-4 mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {isSignup && (selectedRole === 'ngo' || selectedRole === 'admin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline w-4 h-4 mr-1" />
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter organization name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="inline w-4 h-4 mr-1" />
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="inline w-4 h-4 mr-1" />
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

                {/* Multi-step signup: Step 1 shows Next, Step 2 shows remaining fields */}
                {isSignup && signupStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">One more step — fill the next section to complete sign up.</p>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Sign Up
                      </button>
                      <button
                        type="button"
                        onClick={toggleSignup}
                        className="w-full border border-gray-300 rounded-lg py-3 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {isSignup && signupStep === 2 && (
                  <>
                    <p className="text-sm text-gray-600">Fill these to complete sign up.</p>

                    {/* Donor fields */}
                    {selectedRole === 'donor' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                          <input
                            name="pan_number"
                            value={formData.pan_number}
                            onChange={handleInputChange}
                            placeholder="PAN Number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </>
                    )}

                    {/* NGO fields */}
                    {selectedRole === 'ngo' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                          <input
                            name="registration_number"
                            value={formData.registration_number}
                            onChange={handleInputChange}
                            placeholder="Registration Number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date</label>
                          <input
                            type="date"
                            name="registration_date"
                            value={formData.registration_date}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <input
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            placeholder="Category"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="City"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                          <input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="State"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                          <input
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
                          <input
                            name="mission"
                            value={formData.mission}
                            onChange={handleInputChange}
                            placeholder="Mission"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Vision</label>
                          <input
                            name="vision"
                            value={formData.vision}
                            onChange={handleInputChange}
                            placeholder="Vision"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                          <input
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            placeholder="Website"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between space-x-3">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="w-1/3 text-sm text-gray-600 hover:text-gray-800"
                      >
                        ← Back
                      </button>

                      <button
                        type="submit"
                        className="w-2/3 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Create Account
                      </button>
                    </div>
                  </>
                )}

                {!isSignup && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600">Remember me</span>
                      </label>
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                        Forgot password?
                      </a>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Sign In
                    </button>
                  </>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={toggleSignup}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    {isSignup ? (
                      <>
                        Already have an account?{' '}
                        <span className="text-blue-600 font-semibold">Sign In</span>
                      </>
                    ) : (
                      <>
                        Don't have an account?{' '}
                        <span className="text-blue-600 font-semibold">Sign Up</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => onNavigate('home')}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Secure Platform</h3>
            <p className="text-sm text-gray-600">
              Your data is protected with enterprise-grade security
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Verified Users</h3>
            <p className="text-sm text-gray-600">
              All accounts are verified to ensure authenticity
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Transparent</h3>
            <p className="text-sm text-gray-600">
              Track every donation from start to finish
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
