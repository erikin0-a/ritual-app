import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/app_services.dart';

Future<ProviderContainer> bootstrapApplication() async {
  final preferences = await SharedPreferences.getInstance();
  final container = ProviderContainer(
    overrides: [
      sharedPreferencesProvider.overrideWithValue(preferences),
    ],
  );

  await container.read(appStartupProvider.future);
  return container;
}
