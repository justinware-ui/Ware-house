import { loadDemoFromLocation } from '@/lib/demoShare'

const ONBOARDING_DISMISSED_KEY = 'consensus-demos-onboarding-dismissed'

export function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function dismissOnboarding(): void {
  try {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
  } catch {
    // localStorage may be unavailable
  }
}

export function shouldShowOnboarding(): boolean {
  if (isOnboardingDismissed()) return false
  const shared = loadDemoFromLocation()
  if (shared?.nodes?.length) return false
  return true
}
