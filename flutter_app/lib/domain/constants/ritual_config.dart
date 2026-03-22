import '../models/app_models.dart';

class RoundConfig {
  const RoundConfig({
    required this.id,
    required this.name,
    required this.duration,
    required this.description,
    required this.allowed,
    required this.forbidden,
    this.hasRoulette = false,
  });

  final int id;
  final String name;
  final int duration;
  final String description;
  final List<String> allowed;
  final List<String> forbidden;
  final bool hasRoulette;

  RoundConfig copyWith({int? duration}) {
    return RoundConfig(
      id: id,
      name: name,
      duration: duration ?? this.duration,
      description: description,
      allowed: allowed,
      forbidden: forbidden,
      hasRoulette: hasRoulette,
    );
  }
}

const _durationSeconds = {
  DurationPreference.short: {'round': 3 * 60, 'final': 3 * 60},
  DurationPreference.standard: {'round': 5 * 60, 'final': 5 * 60},
  DurationPreference.extended: {'round': 8 * 60, 'final': 8 * 60},
};

const ritualRoundsBase = <RoundConfig>[
  RoundConfig(
    id: 1,
    name: 'Зрительный контакт',
    duration: 5 * 60,
    description: 'Только взгляд, дыхание и короткие фразы. Без прикосновений.',
    allowed: ['зрительный контакт', 'дыхание вместе', 'шёпот', 'флирт'],
    forbidden: ['прикосновения', 'поцелуи', 'снятие одежды'],
  ),
  RoundConfig(
    id: 2,
    name: 'Первое прикосновение',
    duration: 5 * 60,
    description: 'Один партнёр ведёт, второй принимает. Разрешены прикосновения и короткие поцелуи.',
    allowed: ['прикосновения', 'короткие поцелуи', 'объятие на паузе'],
    forbidden: ['ответные прикосновения', 'снятие одежды'],
    hasRoulette: true,
  ),
  RoundConfig(
    id: 3,
    name: 'Соблазнение',
    duration: 5 * 60,
    description: 'Один действует, второй принимает. Ласки только по открытым местам, затем смена.',
    allowed: ['ласки открытых мест', 'поцелуи', 'контролируемое сближение'],
    forbidden: ['снятие одежды', 'секс', 'ответ руками'],
  ),
  RoundConfig(
    id: 4,
    name: 'Ближе',
    duration: 5 * 60,
    description: 'Можно снять 1–2 вещи, но только по очереди и только с согласия.',
    allowed: ['снять 1–2 вещи', 'поцелуи', 'объятия', 'руки на талии'],
    forbidden: ['проникновение', 'секс', 'кульминация'],
  ),
  RoundConfig(
    id: 5,
    name: 'Пик',
    duration: 5 * 60,
    description: 'Меньше слов, больше ритма. Удерживайте напряжение до самого конца без финальной развязки.',
    allowed: ['объятия', 'поцелуи', 'прикосновения', 'ведение по очереди'],
    forbidden: ['проникновение', 'секс', 'кульминация'],
  ),
];

List<RoundConfig> getRitualRounds(DurationPreference duration) {
  final seconds = _durationSeconds[duration]!;
  return ritualRoundsBase
      .map(
        (round) => round.copyWith(
          duration: round.id == 5 ? seconds['final']! : seconds['round']!,
        ),
      )
      .toList(growable: false);
}
