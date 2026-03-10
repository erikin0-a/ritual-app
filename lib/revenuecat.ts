import Purchases, { type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases'
import { Platform } from 'react-native'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { isPremiumBypassEnabled } from '@/lib/premium-bypass'

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? ''
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? ''
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT_ID ?? 'premium'
const OFFERING_ID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ?? 'default'
const ANNUAL_PRODUCT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID ?? ''
const MONTHLY_PRODUCT_ID = process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID ?? ''

type Plan = 'annual' | 'monthly'

let isConfigured = false
let hasListener = false

function getApiKey(): string {
  if (Platform.OS === 'ios') return IOS_API_KEY
  if (Platform.OS === 'android') return ANDROID_API_KEY
  return ''
}

function isPremiumEntitled(customerInfo: CustomerInfo): boolean {
  if (ENTITLEMENT_ID) {
    return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID])
  }
  return Object.keys(customerInfo.entitlements.active).length > 0
}

function syncSubscriptionStatus(customerInfo: CustomerInfo) {
  const setStatus = useSubscriptionStore.getState().setStatus
  setStatus(isPremiumEntitled(customerInfo) ? 'premium' : 'free')
}

async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings()
  if (offerings.all[OFFERING_ID]) {
    return offerings.all[OFFERING_ID]
  }
  return offerings.current
}

function findPackageByPlan(offering: PurchasesOffering, plan: Plan): PurchasesPackage | null {
  const configuredProductId = plan === 'annual' ? ANNUAL_PRODUCT_ID : MONTHLY_PRODUCT_ID

  if (configuredProductId) {
    const packageByProduct = offering.availablePackages.find(
      (pkg) => pkg.product.identifier === configuredProductId,
    )
    if (packageByProduct) {
      return packageByProduct
    }
  }

  const preferredType = plan === 'annual' ? Purchases.PACKAGE_TYPE.ANNUAL : Purchases.PACKAGE_TYPE.MONTHLY
  const packageByType = offering.availablePackages.find((pkg) => pkg.packageType === preferredType)
  if (packageByType) {
    return packageByType
  }

  const planHint = plan === 'annual' ? 'annual' : 'month'
  return (
    offering.availablePackages.find((pkg) => {
      const id = `${pkg.identifier}:${pkg.product.identifier}`.toLowerCase()
      return id.includes(planHint)
    }) ?? null
  )
}

function ensureConfigured() {
  if (!isConfigured) {
    throw new Error('RevenueCat is not configured. Check EXPO_PUBLIC_REVENUECAT_* env values.')
  }
}

export async function initRevenueCat(): Promise<boolean> {
  if (isConfigured) return true

  if (isPremiumBypassEnabled) {
    useSubscriptionStore.getState().setStatus('premium')
    return false
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    useSubscriptionStore.getState().setStatus('free')
    return false
  }

  Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.ERROR)
  Purchases.configure({ apiKey })
  isConfigured = true

  if (!hasListener) {
    Purchases.addCustomerInfoUpdateListener(syncSubscriptionStatus)
    hasListener = true
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo()
    syncSubscriptionStatus(customerInfo)
  } catch {
    useSubscriptionStore.getState().setStatus('free')
  }

  return true
}

export async function refreshSubscriptionStatus(): Promise<void> {
  ensureConfigured()
  const customerInfo = await Purchases.getCustomerInfo()
  syncSubscriptionStatus(customerInfo)
}

export async function getPaywallPlanPrice(plan: Plan): Promise<string | null> {
  ensureConfigured()
  const offering = await getCurrentOffering()
  if (!offering) return null

  const pkg = findPackageByPlan(offering, plan)
  if (!pkg) return null
  return pkg.product.priceString
}

export async function purchasePlan(plan: Plan): Promise<{ cancelled: boolean }> {
  ensureConfigured()

  const offering = await getCurrentOffering()
  if (!offering) {
    throw new Error(`RevenueCat offering "${OFFERING_ID}" not found.`)
  }

  const pkg = findPackageByPlan(offering, plan)
  if (!pkg) {
    throw new Error(`RevenueCat package for "${plan}" is not configured in offering "${offering.identifier}".`)
  }

  try {
    const result = await Purchases.purchasePackage(pkg)
    syncSubscriptionStatus(result.customerInfo)
    return { cancelled: false }
  } catch (error) {
    const userCancelled = Boolean((error as { userCancelled?: boolean } | null)?.userCancelled)
    if (userCancelled) {
      return { cancelled: true }
    }
    throw error
  }
}

export async function restoreSubscriptions(): Promise<void> {
  ensureConfigured()
  const customerInfo = await Purchases.restorePurchases()
  syncSubscriptionStatus(customerInfo)
}
