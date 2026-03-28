import { useSubscriptionStore } from '../stores/subscriptionStore'

// TODO: Replace with real Stripe Checkout integration
// In production, this calls your backend which creates a Stripe Checkout session
// The backend should verify the payment and update the user's subscription status

const PRICES = {
  pro_monthly: '£4.99/month',
  pro_yearly: '£39.99/year',
  family_monthly: '£7.99/month',
} as const

type PricePlan = keyof typeof PRICES

export async function createCheckoutSession(plan: PricePlan): Promise<string> {
  // TODO: Replace with real Stripe Checkout
  // In production:
  // 1. Call POST /api/stripe/create-checkout-session with { plan, userId }
  // 2. Backend creates Stripe Checkout Session
  // 3. Redirect user to Stripe-hosted checkout page
  // 4. On success, Stripe webhook updates user plan in database

  console.log(`[Stripe Stub] Would create checkout for ${PRICES[plan]}`)

  // Simulate payment flow for development
  return new Promise((resolve) => {
    setTimeout(() => {
      const targetPlan = plan === 'family_monthly' ? 'family' : 'pro'
      // TODO: In production, this happens via webhook, not client-side
      useSubscriptionStore.getState().upgradePlan(targetPlan as 'pro' | 'family')
      resolve('stub_session_' + Date.now())
    }, 2000)
  })
}

// TODO: Replace with real Stripe Customer Portal
export async function openCustomerPortal(): Promise<string> {
  console.log('[Stripe Stub] Would open customer portal')
  return 'stub_portal_url'
}

// TODO: Replace with real webhook handler (server-side)
export function handleWebhook(_event: unknown): void {
  console.log('[Stripe Stub] Would handle webhook event')
}
