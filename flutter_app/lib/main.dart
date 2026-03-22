import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/ritual_app.dart';
import 'core/bootstrap/app_bootstrap.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final container = await bootstrapApplication();
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const RitualApp(),
    ),
  );
}
