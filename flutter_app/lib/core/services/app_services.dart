import 'package:amplitude_flutter/amplitude.dart';
import 'package:amplitude_flutter/configuration.dart';
import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_env.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('SharedPreferences override is required.'),
);

final appEnvProvider = Provider<AppEnv>((ref) => AppEnv.fromEnvironment());

final amplitudeProvider = Provider<Amplitude>((ref) {
  final env = ref.watch(appEnvProvider);
  return Amplitude(
    Configuration(
      apiKey: env.amplitudeApiKey,
      instanceName: 'ritual',
    ),
  );
});

final supabaseClientProvider = Provider<SupabaseClient?>((ref) {
  final env = ref.watch(appEnvProvider);
  if (!env.hasSupabase) {
    return null;
  }

  return SupabaseClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(autoRefreshToken: true),
  );
});

final musicPlayerProvider = Provider<AudioPlayer>((ref) {
  final player = AudioPlayer();
  ref.onDispose(player.dispose);
  return player;
});

final voicePlayerProvider = Provider<AudioPlayer>((ref) {
  final player = AudioPlayer();
  ref.onDispose(player.dispose);
  return player;
});

final purchasesConfiguredProvider =
    NotifierProvider<PurchasesConfiguredNotifier, bool>(
        PurchasesConfiguredNotifier.new);

class PurchasesConfiguredNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void setConfigured(bool value) {
    state = value;
  }
}

final appStartupProvider = FutureProvider<void>((ref) async {
  final env = ref.read(appEnvProvider);
  final amplitude = ref.read(amplitudeProvider);

  if (env.hasAmplitude) {
    await amplitude.isBuilt;
  }

  if (env.hasSupabase) {
    await Supabase.initialize(
      url: env.supabaseUrl,
      anonKey: env.supabaseAnonKey,
    );
  }

  final session = await AudioSession.instance;
  await session.configure(const AudioSessionConfiguration.music());

  final apiKey = defaultTargetPlatform == TargetPlatform.iOS
      ? env.revenueCatIosApiKey
      : env.revenueCatAndroidApiKey;

  if (apiKey.isNotEmpty) {
    await Purchases.setLogLevel(kDebugMode ? LogLevel.debug : LogLevel.info);
    await Purchases.configure(PurchasesConfiguration(apiKey));
    ref.read(purchasesConfiguredProvider.notifier).setConfigured(true);
  }
});
