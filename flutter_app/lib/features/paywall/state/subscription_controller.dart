import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/purchases_service.dart';
import '../../../domain/models/app_models.dart';

final subscriptionControllerProvider =
    AsyncNotifierProvider<SubscriptionController, SubscriptionStatus>(
  SubscriptionController.new,
);

class SubscriptionController extends AsyncNotifier<SubscriptionStatus> {
  @override
  Future<SubscriptionStatus> build() async {
    return ref.read(purchasesServiceProvider).refreshStatus();
  }

  bool isPremium() => state.asData?.value == SubscriptionStatus.premium;

  Future<void> refreshStatus() async {
    state = const AsyncLoading();
    state = AsyncValue.data(
        await ref.read(purchasesServiceProvider).refreshStatus());
  }

  Future<bool> purchasePlan(String plan) async {
    final purchased =
        await ref.read(purchasesServiceProvider).purchasePlan(plan);
    if (purchased) {
      state = const AsyncValue.data(SubscriptionStatus.premium);
    }
    return purchased;
  }

  Future<bool> restore() async {
    final restored = await ref.read(purchasesServiceProvider).restore();
    if (restored) {
      state = const AsyncValue.data(SubscriptionStatus.premium);
    }
    return restored;
  }
}
