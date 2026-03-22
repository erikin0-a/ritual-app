import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../../domain/models/app_models.dart';
import 'app_services.dart';

final purchasesServiceProvider = Provider<PurchasesService>(
  (ref) => PurchasesService(ref),
);

class PurchasesService {
  PurchasesService(this._ref);

  final Ref _ref;

  bool get _isConfigured => _ref.read(purchasesConfiguredProvider);

  String _entitlementId() =>
      _ref.read(appEnvProvider).revenueCatPremiumEntitlementId;

  String _offeringId() => _ref.read(appEnvProvider).revenueCatOfferingId;

  String _productIdForPlan(String plan) {
    final env = _ref.read(appEnvProvider);
    return plan == 'annual'
        ? env.revenueCatAnnualProductId
        : env.revenueCatMonthlyProductId;
  }

  bool isPremiumEntitled(CustomerInfo customerInfo) {
    final entitlementId = _entitlementId();
    if (entitlementId.isNotEmpty) {
      return customerInfo.entitlements.active.containsKey(entitlementId);
    }
    return customerInfo.entitlements.active.isNotEmpty;
  }

  Future<SubscriptionStatus> refreshStatus() async {
    if (!_isConfigured) return SubscriptionStatus.free;
    try {
      final info = await Purchases.getCustomerInfo();
      return isPremiumEntitled(info)
          ? SubscriptionStatus.premium
          : SubscriptionStatus.free;
    } catch (_) {
      return SubscriptionStatus.free;
    }
  }

  Future<Offering?> _currentOffering() async {
    if (!_isConfigured) return null;
    final offerings = await Purchases.getOfferings();
    return offerings.all[_offeringId()] ?? offerings.current;
  }

  Package? _findPackageByPlan(Offering offering, String plan) {
    final configuredProductId = _productIdForPlan(plan);
    if (configuredProductId.isNotEmpty) {
      for (final package in offering.availablePackages) {
        if (package.storeProduct.identifier == configuredProductId) {
          return package;
        }
      }
    }

    final expectedType =
        plan == 'annual' ? PackageType.annual : PackageType.monthly;
    for (final package in offering.availablePackages) {
      if (package.packageType == expectedType) {
        return package;
      }
    }

    for (final package in offering.availablePackages) {
      final id = '${package.identifier}:${package.storeProduct.identifier}'
          .toLowerCase();
      if (id.contains(plan == 'annual' ? 'annual' : 'month')) {
        return package;
      }
    }

    return null;
  }

  Future<String?> getPlanPrice(String plan) async {
    final offering = await _currentOffering();
    if (offering == null) return null;
    return _findPackageByPlan(offering, plan)?.storeProduct.priceString;
  }

  Future<bool> purchasePlan(String plan) async {
    if (!_isConfigured) return false;
    final offering = await _currentOffering();
    if (offering == null) {
      throw Exception('RevenueCat offering "${_offeringId()}" not found.');
    }
    final package = _findPackageByPlan(offering, plan);
    if (package == null) {
      throw Exception('RevenueCat package for $plan not found.');
    }

    try {
      final result = await Purchases.purchasePackage(package);
      return isPremiumEntitled(result.customerInfo);
    } on PlatformException catch (error) {
      final errorCode = PurchasesErrorHelper.getErrorCode(error);
      if (errorCode == PurchasesErrorCode.purchaseCancelledError) {
        return false;
      }
      rethrow;
    }
  }

  Future<bool> restore() async {
    if (!_isConfigured) return false;
    final info = await Purchases.restorePurchases();
    return isPremiumEntitled(info);
  }
}
