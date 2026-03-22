import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/analytics_service.dart';
import '../../../core/services/purchases_service.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';
import '../state/subscription_controller.dart';

class PaywallScreen extends ConsumerStatefulWidget {
  const PaywallScreen({super.key, required this.source});

  final String source;

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  String? annualPrice;
  String? monthlyPrice;
  String? loadingAction;
  String? errorText;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await ref.read(analyticsServiceProvider).paywallOpened(widget.source);
      final purchases = ref.read(purchasesServiceProvider);
      final annual = await purchases.getPlanPrice('annual');
      final monthly = await purchases.getPlanPrice('monthly');
      if (!mounted) return;
      setState(() {
        annualPrice = annual;
        monthlyPrice = monthly;
      });
    });
  }

  Future<void> _purchase(String plan) async {
    setState(() {
      loadingAction = plan;
      errorText = null;
    });
    try {
      final ok = await ref.read(subscriptionControllerProvider.notifier).purchasePlan(plan);
      if (ok) {
        if (plan == 'annual') {
          await ref.read(analyticsServiceProvider).trialStarted(widget.source);
        } else {
          await ref.read(analyticsServiceProvider).subscriptionStarted(
                source: widget.source,
                plan: plan,
              );
        }
        if (!mounted) return;
        context.pop();
      }
    } catch (_) {
      setState(() {
        errorText =
            'Не удалось оформить подписку. Проверьте настройки RevenueCat и попробуйте снова.';
      });
    } finally {
      if (mounted) {
        setState(() => loadingAction = null);
      }
    }
  }

  Future<void> _restore() async {
    setState(() {
      loadingAction = 'restore';
      errorText = null;
    });
    try {
      final restored = await ref.read(subscriptionControllerProvider.notifier).restore();
      if (restored && mounted) {
        context.pop();
      }
    } catch (_) {
      setState(() {
        errorText = 'Не удалось восстановить покупки.';
      });
    } finally {
      if (mounted) {
        setState(() => loadingAction = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return RitualScaffold(
      child: ListView(
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: () => context.pop(),
              child: const Text('Не сейчас'),
            ),
          ),
          const SizedBox(height: 12),
          RitualGlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Nightly Premium',
                  style: TextStyle(
                    color: AppColors.accentStrong,
                    fontSize: 10,
                    letterSpacing: 2.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Голос. Музыка. Атмосфера. Полный Guided Ritual.',
                  style: GoogleFonts.playfairDisplay(
                    color: AppColors.text,
                    fontSize: 34,
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Премиум открывает режиссируемый session flow: интро, consent, правила, голосовые cues, мягкие transitions и финальный guided runtime.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15, height: 1.45),
                ),
                const SizedBox(height: 18),
                ...const [
                  _FeaturePill('Голосовые подсказки с именами'),
                  _FeaturePill('Атмосферная музыка и chip signal'),
                  _FeaturePill('Полный сценарий по раундам'),
                  _FeaturePill('Доступ ко всем premium обновлениям'),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          _PlanCard(
            title: 'Годовой план',
            price: annualPrice ?? '\$39.99 / год',
            meta: '7 дней trial, затем можно отменить в любой момент',
            cta: loadingAction == 'annual' ? 'Оформляем...' : 'Начать trial 7 дней',
            primary: true,
            onTap: () => _purchase('annual'),
          ),
          const SizedBox(height: 12),
          _PlanCard(
            title: 'Месячный план',
            price: monthlyPrice ?? '\$5.99 / месяц',
            meta: 'Подходит, если хотите попробовать guided mode без длинной подписки',
            cta: loadingAction == 'monthly' ? 'Оформляем...' : 'Оформить месячную подписку',
            primary: false,
            onTap: () => _purchase('monthly'),
          ),
          const SizedBox(height: 14),
          RitualButton(
            label: loadingAction == 'restore' ? 'Восстанавливаем...' : 'Восстановить покупки',
            onTap: _restore,
            secondary: true,
          ),
          if (errorText != null) ...[
            const SizedBox(height: 12),
            Text(
              errorText!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.danger),
            ),
          ],
        ],
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  const _FeaturePill(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        text,
        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.price,
    required this.meta,
    required this.cta,
    required this.primary,
    required this.onTap,
  });

  final String title;
  final String price;
  final String meta;
  final String cta;
  final bool primary;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return RitualGlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: AppColors.text, fontSize: 20)),
          const SizedBox(height: 6),
          Text(price, style: GoogleFonts.playfairDisplay(fontSize: 28, color: AppColors.text)),
          const SizedBox(height: 6),
          Text(meta, style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 14),
          RitualButton(
            label: cta,
            onTap: onTap,
            secondary: !primary,
          ),
        ],
      ),
    );
  }
}
