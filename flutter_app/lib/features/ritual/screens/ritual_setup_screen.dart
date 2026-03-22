import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/services/guided_audio_service.dart';
import '../../../domain/logic/ritual_participants.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/ritual_ui.dart';
import '../../auth/state/auth_controller.dart';

class RitualSetupScreen extends ConsumerStatefulWidget {
  const RitualSetupScreen({super.key, required this.mode});

  final String mode;

  @override
  ConsumerState<RitualSetupScreen> createState() => _RitualSetupScreenState();
}

class _RitualSetupScreenState extends ConsumerState<RitualSetupScreen> {
  late TextEditingController _p1Controller;
  late TextEditingController _p2Controller;

  @override
  void initState() {
    super.initState();
    final participants = ref.read(authControllerProvider).ritualParticipants;
    _p1Controller = TextEditingController(text: participants.p1.name);
    _p2Controller = TextEditingController(text: participants.p2.name);
    _p1Controller.addListener(_handleTextChanged);
    _p2Controller.addListener(_handleTextChanged);
  }

  void _handleTextChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _p1Controller.removeListener(_handleTextChanged);
    _p2Controller.removeListener(_handleTextChanged);
    _p1Controller.dispose();
    _p2Controller.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    HapticFeedback.mediumImpact();
    final auth = ref.read(authControllerProvider.notifier);
    final current = ref.read(authControllerProvider).ritualParticipants;
    final participants = createRitualParticipants(
      p1: current.p1.copyWith(name: _p1Controller.text.trim()),
      p2: current.p2.copyWith(name: _p2Controller.text.trim()),
    );
    auth.setRitualParticipants(participants);
    await ref.read(guidedAudioServiceProvider).warmNameAudio(participants);
    if (!mounted) return;
    context.push('/ritual-session?mode=${widget.mode}');
  }

  @override
  Widget build(BuildContext context) {
    return RitualScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.arrow_back_ios_new,
                  color: AppColors.text, size: 20),
            ),
          ),
          const SizedBox(height: 12),
          const Center(
            child: Text(
              'ПОДГОТОВКА',
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
                letterSpacing: 4,
              ),
            ),
          ),
          const Spacer(),
          _EditableName(label: '01', controller: _p1Controller),
          const SizedBox(height: 42),
          _EditableName(label: '02', controller: _p2Controller),
          const Spacer(),
          RitualButton(
            label: 'НАЧАТЬ ПОГРУЖЕНИЕ',
            onTap: _start,
            enabled: _p1Controller.text.trim().isNotEmpty &&
                _p2Controller.text.trim().isNotEmpty,
          ),
        ],
      ),
    );
  }
}

class _EditableName extends StatefulWidget {
  const _EditableName({
    required this.label,
    required this.controller,
  });

  final String label;
  final TextEditingController controller;

  @override
  State<_EditableName> createState() => _EditableNameState();
}

class _EditableNameState extends State<_EditableName> {
  bool _editing = false;
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus && _editing) {
        HapticFeedback.selectionClick();
        setState(() => _editing = false);
      }
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Text(
            '${widget.label} УЧАСТНИК',
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 10,
              letterSpacing: 3,
            ),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _editing = true);
              _focusNode.requestFocus();
            },
            child: SizedBox(
              width: double.infinity,
              child: _editing
                  ? TextField(
                      controller: widget.controller,
                      focusNode: _focusNode,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 42,
                        color: AppColors.text,
                      ),
                      cursorColor: AppColors.accent,
                      decoration: const InputDecoration(
                        hintText: 'Имя',
                        hintStyle: TextStyle(color: AppColors.textMuted),
                        border: UnderlineInputBorder(
                          borderSide:
                              BorderSide(color: AppColors.borderStrong),
                        ),
                        enabledBorder: UnderlineInputBorder(
                          borderSide:
                              BorderSide(color: AppColors.borderStrong),
                        ),
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: AppColors.accent),
                        ),
                      ),
                      onSubmitted: (_) {
                        HapticFeedback.selectionClick();
                        setState(() => _editing = false);
                      },
                    )
                  : Column(
                      children: [
                        Text(
                          widget.controller.text.isEmpty
                              ? 'Имя'
                              : widget.controller.text,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 42,
                            color: widget.controller.text.isEmpty
                                ? AppColors.textMuted
                                : AppColors.text,
                          ),
                        ),
                        Container(
                          width: double.infinity,
                          height: 1,
                          color: AppColors.borderStrong,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'нажмите чтобы изменить',
                          style: TextStyle(
                            fontSize: 9,
                            color: Colors.white.withValues(alpha: 0.25),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
