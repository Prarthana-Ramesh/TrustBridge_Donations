import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, User, Phone, MapPin, Building2, CreditCard, Heart, FileText, Shield } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface MakeDonationProps {
  onNavigate: (page: string) => void;
}

function MakeDonation({ onNavigate }: MakeDonationProps) {
  const { token: ctxToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [ngoOptions, setNgoOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: '',
    
    // Address Details
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    
    // Organization/Employment (Optional)
    isOrganization: false,
    organizationName: '',
    designation: '',
    employeeId: '',
    
    // Identity Verification
    panNumber: '',
    aadharNumber: '',
    
    // Donation Details
    ngo: '',
    donationAmount: '',
    donationPurpose: '',
    isAnonymous: false,
    isRecurring: false,
    recurringFrequency: '',
    
    // Payment Details
    paymentMethod: 'creditCard',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    
    // Consent & Terms
    taxBenefitConsent: false,
    communicationConsent: false,
    termsAccepted: false,
    
    // Additional
    comments: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitDonation();
  };

  const submitDonation = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const authToken = ctxToken || localStorage.getItem('token');
      if (!authToken) {
        setError('Authentication token not found. Please log in again.');
        setSubmitting(false);
        return;
      }

      // Prepare donation data
      const donationData = {
        ngo_name: formData.ngo,
        amount: parseFloat(formData.donationAmount),
        purpose: formData.donationPurpose,
      };

      const response = await fetch('http://localhost:5000/api/donations/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create donation');
      }

      const txnRef = data?.donation?.transaction_id || data?.donation?.donation_id || 'N/A';
      alert(`Donation successful! Reference: ${txnRef}`);

      // Notify other tabs (e.g., NGO dashboard) to refresh immediately
      try {
        const channel = new BroadcastChannel('donation-updates');
        channel.postMessage({ type: 'donation-created', ts: Date.now() });
        channel.close();
      } catch (notifyErr) {
        console.warn('BroadcastChannel not available, skipping cross-tab notify', notifyErr);
      }

      onNavigate('donor-dashboard');
    } catch (err) {
      console.error('Error submitting donation:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch NGOs when component mounts
  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        const authToken = ctxToken || localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/api/ngo/list', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          },
        });

        if (response.ok) {
          const data = await response.json();
          const ngoNames = data.ngos.map((ngo: any) => ngo.name);
          setNgoOptions(ngoNames);
        } else {
          console.error('Failed to fetch NGOs from API');
          // Fallback to empty list - user must enter manually or contact admin
          setNgoOptions([]);
          setError('Unable to load NGO list. Please try again or contact support.');
        }
      } catch (err) {
        console.error('Error fetching NGOs:', err);
        // Fallback to empty list
        setNgoOptions([]);
        setError('Unable to load NGO list. Please try again or contact support.');
      }
    };

    fetchNGOs();
  }, [ctxToken]);

  const purposeOptions = [
    'Education Support',
    'Medical Equipment',
    'Infrastructure Development',
    'Food Security',
    'Skill Development',
    'Emergency Relief',
    'General Contribution',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Make a Donation</h1>
          <p className="text-gray-600">Your contribution makes a difference</p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step < currentStep
                        ? 'bg-green-500 text-white'
                        : step === currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="w-6 h-6" /> : step}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">
                    {step === 1 && 'Personal'}
                    {step === 2 && 'Donation'}
                    {step === 3 && 'Payment'}
                    {step === 4 && 'Review'}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal & Identity Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Address Details */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Address Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your complete address"
                        required
                      ></textarea>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country *
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization Details (Optional) */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Organization Details (Optional)
                    </h3>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isOrganization"
                        checked={formData.isOrganization}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        I am donating on behalf of an organization
                      </span>
                    </label>
                  </div>

                  {formData.isOrganization && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Designation
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Identity Verification */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Identity Verification</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number *
                      </label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for tax benefits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhar Number
                      </label>
                      <input
                        type="text"
                        name="aadharNumber"
                        value={formData.aadharNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234 5678 9012"
                        maxLength={12}
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional for verification</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Donation Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Donation Details</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select NGO *
                    </label>
                    <select
                      name="ngo"
                      value={formData.ngo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose an organization</option>
                      {ngoOptions.map((ngo) => (
                        <option key={ngo} value={ngo}>
                          {ngo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="donationAmount"
                      value={formData.donationAmount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10000"
                      min="100"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purpose of Donation *
                    </label>
                    <select
                      name="donationPurpose"
                      value={formData.donationPurpose}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select purpose</option>
                      {purposeOptions.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments / Special Instructions
                    </label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any specific requests or notes..."
                    ></textarea>
                  </div>
                </div>

                {/* Donation Options */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Donation Options</h3>

                  <div className="space-y-3">
                    <label className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        name="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-800">
                          Make this donation anonymous
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Your name will not be displayed publicly
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-medium text-gray-800">
                          Set up recurring donation
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Donate regularly to make a lasting impact
                        </p>
                      </div>
                    </label>

                    {formData.isRecurring && (
                      <div className="ml-7">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency
                        </label>
                        <select
                          name="recurringFrequency"
                          value={formData.recurringFrequency}
                          onChange={handleInputChange}
                          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select frequency</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method *
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'creditCard' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="creditCard"
                        checked={formData.paymentMethod === 'creditCard'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                        <span className="font-medium text-sm">Credit/Debit Card</span>
                      </div>
                    </label>

                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'upi' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={formData.paymentMethod === 'upi'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <Phone className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                        <span className="font-medium text-sm">UPI</span>
                      </div>
                    </label>

                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'netbanking' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="netbanking"
                        checked={formData.paymentMethod === 'netbanking'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                        <span className="font-medium text-sm">Net Banking</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Card Details (shown for credit card) */}
                {formData.paymentMethod === 'creditCard' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Holder Name *
                      </label>
                      <input
                        type="text"
                        name="cardHolder"
                        value={formData.cardHolder}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Name as on card"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="password"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123"
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Note */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Secure Payment</h4>
                      <p className="text-sm text-blue-700">
                        Your payment information is encrypted and secure. We never store your card details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Review & Confirm</h2>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Donation Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Donating to</p>
                      <p className="text-lg font-semibold">{formData.ngo || 'Not selected'}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Amount</p>
                      <p className="text-2xl font-bold">
                        ₹{formData.donationAmount ? parseInt(formData.donationAmount).toLocaleString() : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Purpose</p>
                      <p className="font-semibold">{formData.donationPurpose || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Donation Type</p>
                      <p className="font-semibold">
                        {formData.isRecurring
                          ? `Recurring (${formData.recurringFrequency})`
                          : 'One-time'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Info Review */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Personal Information</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{formData.fullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium">{formData.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">PAN:</span>
                      <span className="ml-2 font-medium">{formData.panNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Consent & Terms */}
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="taxBenefitConsent"
                      checked={formData.taxBenefitConsent}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      required
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      I consent to share my PAN details for tax benefit certificate (80G)
                    </span>
                  </label>

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="communicationConsent"
                      checked={formData.communicationConsent}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      I agree to receive updates about the utilization of my donation
                    </span>
                  </label>

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      required
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      I accept the <a href="#" className="text-blue-600 hover:underline">terms and conditions</a> and <a href="#" className="text-blue-600 hover:underline">privacy policy</a> *
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold transition-all ${
                    submitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Donation
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MakeDonation;
