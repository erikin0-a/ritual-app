class AppEnv {
  const AppEnv({
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.guidedAudioBucket,
    required this.guidedAudioVoiceProfile,
    required this.guidedAudioFunctionName,
    required this.guidedAudioPrimeFunctionName,
    required this.guidedAudioManifestPrefix,
    required this.guidedAudioNamePrefix,
    required this.guidedAudioPhrasePrefix,
    required this.guidedAudioPublicBaseUrl,
    required this.amplitudeApiKey,
    required this.revenueCatIosApiKey,
    required this.revenueCatAndroidApiKey,
    required this.revenueCatPremiumEntitlementId,
    required this.revenueCatOfferingId,
    required this.revenueCatAnnualProductId,
    required this.revenueCatMonthlyProductId,
  });

  factory AppEnv.fromEnvironment() {
    return const AppEnv(
      supabaseUrl: String.fromEnvironment('SUPABASE_URL'),
      supabaseAnonKey: String.fromEnvironment('SUPABASE_ANON_KEY'),
      guidedAudioBucket: String.fromEnvironment(
        'GUIDED_AUDIO_BUCKET',
        defaultValue: 'guided-audio',
      ),
      guidedAudioVoiceProfile: String.fromEnvironment(
        'GUIDED_AUDIO_VOICE_PROFILE',
        defaultValue: 'marusya-romantic-v1',
      ),
      guidedAudioFunctionName: String.fromEnvironment(
        'GUIDED_AUDIO_FUNCTION_NAME',
        defaultValue: 'guided-audio-resolver',
      ),
      guidedAudioPrimeFunctionName: String.fromEnvironment(
        'GUIDED_AUDIO_PRIME_FUNCTION_NAME',
        defaultValue: 'guided-audio-prime',
      ),
      guidedAudioManifestPrefix: String.fromEnvironment(
        'GUIDED_AUDIO_MANIFEST_PREFIX',
        defaultValue: 'guided-manifests',
      ),
      guidedAudioNamePrefix: String.fromEnvironment(
        'GUIDED_AUDIO_NAME_PREFIX',
        defaultValue: 'name-library',
      ),
      guidedAudioPhrasePrefix: String.fromEnvironment(
        'GUIDED_AUDIO_PHRASE_PREFIX',
        defaultValue: 'guided-phrases',
      ),
      guidedAudioPublicBaseUrl: String.fromEnvironment(
        'GUIDED_AUDIO_PUBLIC_BASE_URL',
        defaultValue: 'https://example.com/nightly-audio',
      ),
      amplitudeApiKey: String.fromEnvironment('AMPLITUDE_API_KEY'),
      revenueCatIosApiKey: String.fromEnvironment('REVENUECAT_IOS_API_KEY'),
      revenueCatAndroidApiKey: String.fromEnvironment('REVENUECAT_ANDROID_API_KEY'),
      revenueCatPremiumEntitlementId: String.fromEnvironment(
        'REVENUECAT_PREMIUM_ENTITLEMENT_ID',
        defaultValue: 'premium',
      ),
      revenueCatOfferingId: String.fromEnvironment(
        'REVENUECAT_OFFERING_ID',
        defaultValue: 'default',
      ),
      revenueCatAnnualProductId: String.fromEnvironment('REVENUECAT_ANNUAL_PRODUCT_ID'),
      revenueCatMonthlyProductId: String.fromEnvironment('REVENUECAT_MONTHLY_PRODUCT_ID'),
    );
  }

  final String supabaseUrl;
  final String supabaseAnonKey;
  final String guidedAudioBucket;
  final String guidedAudioVoiceProfile;
  final String guidedAudioFunctionName;
  final String guidedAudioPrimeFunctionName;
  final String guidedAudioManifestPrefix;
  final String guidedAudioNamePrefix;
  final String guidedAudioPhrasePrefix;
  final String guidedAudioPublicBaseUrl;
  final String amplitudeApiKey;
  final String revenueCatIosApiKey;
  final String revenueCatAndroidApiKey;
  final String revenueCatPremiumEntitlementId;
  final String revenueCatOfferingId;
  final String revenueCatAnnualProductId;
  final String revenueCatMonthlyProductId;

  bool get hasSupabase => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
  bool get hasAmplitude => amplitudeApiKey.isNotEmpty;
}
