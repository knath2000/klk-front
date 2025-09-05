
'use client';

import { useState } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    conversations_per_month: number;
    messages_per_conversation: number;
    models_access: string[];
    storage_gb: number;
  };
}

export default function SubscriptionPanel() {
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [isAnnual, setIsAnnual] = useState(false);

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic access to the chat assistant',
      price_monthly: 0,
      price_yearly: 0,
      features: [
        '3 conversations per day',
        'Basic models only',
        'Community support'
      ],
      limits: {
        conversations_per_month: 90,
        messages_per_conversation: 50,
        models_access: ['gpt-4o-mini'],
        storage_gb: 1
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Advanced features for power users',
      price_monthly: 8,
      price_yearly: 80,
      features: [
        'Unlimited conversations',
        'Access to all models',
        'Priority support',
        'Higher message limits',
        '5GB storage'
      ],
      limits: {
        conversations_per_month: 1000,
        messages_per_conversation: 500,
        models_access: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro', 'gpt-4o-mini'],
        storage_gb: 5
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Ultimate experience with all features',
      price_monthly: 15,
      price_yearly: 150,
      features: [
        'Unlimited conversations',
        'Access to all models',
        'Priority support',
        'Highest message limits',
        '20GB storage',
        'Early access to new features'
      ],
      limits: {
        conversations_per_month: 10000,
        messages_per_conversation: 2000,
        models_access: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro', 'gpt-4o-mini'],
        storage_gb: 20
      }
    }
  ];

  const handleSubscribe = async (planId: string) => {
    // In a real implementation, this would call the backend API
    console.log('Subscribing to plan:', planId);
    alert(`Subscribed to ${plans.find(p => p.id === planId)?.name} plan!`);
  };

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (plan.id === 'free') return 'Free';
    return isAnnual ? `$${plan.price_yearly}/year` : `$${plan.price_monthly}/month`;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (plan.id === 'free' || !isAnnual) return null;
    const monthlyEquivalent = plan.price_yearly / 12;
    const savings = ((plan.price_monthly - monthlyEquivalent) / plan.price_monthly * 100).toFixed(0);
    return savings;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Unlock premium features and unlimited conversations with our subscription plans
        </p>
        
        {/* Annual toggle */}
        <div className="flex items-center justify-center mb-8">
          <span className={`mr-3 text-sm font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className={`${isAnnual ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
          </button>
          <span className={`ml-3 text-sm font-medium ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Annual <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Save 20%</span>
          </span>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`rounded-2xl border p-8 text-left ${
                selectedPlan === plan.id 
                  ? 'border-indigo-500 ring-2 ring-indigo-500' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getPlanPrice(plan)}
                  {plan.id !== 'free' && isAnnual && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      Save {getSavings(plan)}%
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  selectedPlan === plan.id
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : plan.id === 'free'
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800'
                } transition-colors`}
              >
                {plan.id === 'free' ? 'Get Started' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        {/* Plan comparison table */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Plan Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    Conversations per month
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      {plan.limits.conversations_per_month.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    Messages per conversation
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      {plan.limits.messages_per_conversation.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    Storage
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      {plan.limits.storage_gb} GB
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    Model Access
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      <div className="flex flex-col items-center">
                        {plan.limits.models_access.map((model, index) => (
                          <span key={index} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mb-1">
                            {model}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
