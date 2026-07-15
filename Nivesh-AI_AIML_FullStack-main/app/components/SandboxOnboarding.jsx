'use client';

import { useState, useEffect } from 'react';

/**
 * SandboxOnboarding Component
 * 
 * Guides users through investment profile collection
 * Shows progress, collects financial goals, risk appetite, experience level
 * Creates initial AI profile with recommendations
 */

export default function SandboxOnboarding({ userId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [prompts, setPrompts] = useState({});
  const [formData, setFormData] = useState({
    financial_goal: '',
    investment_horizon: '',
    risk_appetite: '',
    monthly_budget: '',
    experience_level: '',
    education_level: '',
    age: '',
    college_name: '',
  });
  const [error, setError] = useState('');

  // Fetch onboarding prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/tradeverse/onboarding/prompts');
        if (!response.ok) throw new Error('Failed to fetch prompts');
        const data = await response.json();
        setPrompts(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load onboarding prompts');
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const formFields = [
    'financial_goal',
    'investment_horizon',
    'risk_appetite',
    'monthly_budget',
    'experience_level',
    'education_level',
    'age',
    'college_name',
  ];

  const currentFieldKey = formFields[currentStep];
  const currentPrompt = prompts[currentFieldKey];

  const handleNext = () => {
    // Validate current field
    if (currentFieldKey === 'monthly_budget' || currentFieldKey === 'age') {
      if (!formData[currentFieldKey]) {
        setError(`${currentPrompt?.question || 'This field'} is required`);
        return;
      }
    } else if (
      ['financial_goal', 'investment_horizon', 'risk_appetite', 'experience_level'].includes(
        currentFieldKey
      )
    ) {
      if (!formData[currentFieldKey]) {
        setError(`${currentPrompt?.question || 'This field'} is required`);
        return;
      }
    }

    setError('');
    if (currentStep < formFields.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.monthly_budget || !formData.experience_level) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/tradeverse/onboarding/complete/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          financial_goal: formData.financial_goal,
          investment_horizon: formData.investment_horizon,
          risk_appetite: formData.risk_appetite,
          monthly_budget: parseFloat(formData.monthly_budget),
          experience_level: formData.experience_level,
          education_level: formData.education_level || null,
          age: formData.age ? parseInt(formData.age) : null,
          country: null,
          college_name: formData.college_name || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete onboarding');
      }

      const data = await response.json();
      onComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-[#083344] via-[#155e75] to-[#083344]">
        <span className="text-sm font-bold uppercase tracking-wider text-color-5 animate-pulse">[LOADING]</span>
      </div>
    );
  }

  const progressPercent = ((currentStep + 1) / formFields.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-n-8 via-n-7 to-n-8 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            WELCOME TO NIVESHAI TRADEVERSE
          </h1>
          <p className="text-lg text-n-3">
            Let's build your investment profile
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-n-3 mb-2">
            <span>Step {currentStep + 1} of {formFields.length}</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-stroke-1 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-color-1 to-color-5 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-linear-to-b from-[#083344] via-[#155e75] to-[#083344] border border-n-6 rounded-2xl shadow-xl p-8 mb-6">
          {currentPrompt ? (
            <div>
              {/* Question */}
              <h2 className="text-2xl font-bold text-white mb-2">
                {currentPrompt.question}
              </h2>
              {currentPrompt.description && (
                <p className="text-n-3 mb-6">{currentPrompt.description}</p>
              )}

              {/* Options */}
              {currentPrompt.options ? (
                <div className="grid grid-cols-1 gap-3">
                  {currentPrompt.options.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData[currentFieldKey] === option.value
                          ? 'border-color-1 bg-n-6'
                          : 'border-n-6 bg-n-7 hover:border-color-5'
                        }`}
                    >
                      <input
                        type="radio"
                        name={currentFieldKey}
                        value={option.value}
                        checked={formData[currentFieldKey] === option.value}
                        onChange={(e) => {
                          setFormData({ ...formData, [currentFieldKey]: e.target.value });
                          setError('');
                        }}
                        className="w-4 h-4 text-color-1 focus:ring-color-1"
                      />
                      <span className="ml-3 text-white font-medium">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              ) : currentPrompt.type === 'number' ? (
                <input
                  type="number"
                  placeholder={currentPrompt.placeholder}
                  value={formData[currentFieldKey]}
                  onChange={(e) => {
                    setFormData({ ...formData, [currentFieldKey]: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-n-6 bg-n-7 rounded-lg focus:border-color-1 focus:outline-none text-lg text-white placeholder-n-4"
                />
              ) : (
                <input
                  type="text"
                  placeholder={currentPrompt.placeholder}
                  value={formData[currentFieldKey]}
                  onChange={(e) => {
                    setFormData({ ...formData, [currentFieldKey]: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-n-6 bg-n-7 rounded-lg focus:border-color-1 focus:outline-none text-lg text-white placeholder-n-4"
                />
              )}

            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-n-4">Preparing onboarding data...</p>
            </div>
          )}
          {/* Error Message moved outside the conditional */}
          {error && (
            <div className="mt-4 p-4 bg-color-3/10 border border-color-3/30 rounded-lg">
              <p className="text-color-3 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentStep === 0
                ? 'bg-n-6 text-gray-500 cursor-not-allowed'
                : 'bg-n-6 text-white hover:bg-stroke-1 active:scale-95'
              }`}
          >
            ← Back
          </button>

          {currentStep < formFields.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-color-1 text-white rounded-lg font-semibold hover:bg-color-1/80 active:scale-95 transition-all flex items-center gap-2"
            >
              Next <span className="text-xs uppercase ml-1 block">[NEXT]</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-8 py-3 bg-color-4 text-white rounded-lg font-semibold transition-all flex items-center gap-2 ${submitting
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-color-4/80 active:scale-95'
                }`}
            >
              {submitting ? (
                <>
                  <span className="text-xs uppercase tracking-wider animate-pulse">[LOADING]</span>
                  Creating Profile...
                </>
              ) : (
                'COMPLETE SETUP'
              )}
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-n-7 border border-color-5/30 rounded-lg text-center">
          <p className="text-color-5 text-sm">
            <strong>NOTE:</strong> Be honest with your profile. This helps our AI
            make better trade recommendations for you!
          </p>
        </div>
      </div>
    </div>
  );
}
