import 'dart:math';

import '../models/app_models.dart';

const truthOrDareCards = <TruthOrDareCardModel>[
  TruthOrDareCardModel(
    id: 'light-truth-1',
    category: TruthOrDareCategory.light,
    type: TruthOrDareType.truth,
    content: 'Что первое привлекло тебя во мне?',
  ),
  TruthOrDareCardModel(
    id: 'light-truth-2',
    category: TruthOrDareCategory.light,
    type: TruthOrDareType.truth,
    content: 'Какой наш общий момент ты вспоминаешь чаще всего?',
  ),
  TruthOrDareCardModel(
    id: 'light-dare-1',
    category: TruthOrDareCategory.light,
    type: TruthOrDareType.dare,
    content: 'Скажи три комплимента, глядя мне в глаза.',
  ),
  TruthOrDareCardModel(
    id: 'light-dare-2',
    category: TruthOrDareCategory.light,
    type: TruthOrDareType.dare,
    content: 'Держи зрительный контакт 30 секунд молча.',
  ),
  TruthOrDareCardModel(
    id: 'spicy-truth-1',
    category: TruthOrDareCategory.spicy,
    type: TruthOrDareType.truth,
    content: 'Какая часть моего тела тебя больше всего притягивает?',
  ),
  TruthOrDareCardModel(
    id: 'spicy-truth-2',
    category: TruthOrDareCategory.spicy,
    type: TruthOrDareType.truth,
    content: 'Что заводит тебя больше всего?',
  ),
  TruthOrDareCardModel(
    id: 'spicy-dare-1',
    category: TruthOrDareCategory.spicy,
    type: TruthOrDareType.dare,
    content: 'Поцелуй меня так, как давно хотел.',
  ),
  TruthOrDareCardModel(
    id: 'spicy-dare-2',
    category: TruthOrDareCategory.spicy,
    type: TruthOrDareType.dare,
    content: 'Прошепчи мне на ухо свою тайную фантазию.',
  ),
  TruthOrDareCardModel(
    id: 'wild-truth-1',
    category: TruthOrDareCategory.wild,
    type: TruthOrDareType.truth,
    content: 'Какая самая смелая фантазия у тебя была обо мне?',
  ),
  TruthOrDareCardModel(
    id: 'wild-truth-2',
    category: TruthOrDareCategory.wild,
    type: TruthOrDareType.truth,
    content: 'Что тебе хочется прямо сейчас?',
  ),
  TruthOrDareCardModel(
    id: 'wild-dare-1',
    category: TruthOrDareCategory.wild,
    type: TruthOrDareType.dare,
    content: 'Сними с меня одну вещь медленно.',
  ),
  TruthOrDareCardModel(
    id: 'wild-dare-2',
    category: TruthOrDareCategory.wild,
    type: TruthOrDareType.dare,
    content: 'Шепни мне на ухо свою самую откровенную мысль обо мне.',
  ),
];

List<TruthOrDareCardModel> getCardsByCategory(TruthOrDareCategory category) {
  return truthOrDareCards
      .where((card) => card.category == category)
      .toList(growable: false);
}

List<TruthOrDareCardModel> getCardsByType(TruthOrDareType type) {
  return truthOrDareCards.where((card) => card.type == type).toList(growable: false);
}

List<TruthOrDareCardModel> getCardsByCategoryAndType(
  TruthOrDareCategory category,
  TruthOrDareType type,
) {
  return truthOrDareCards
      .where((card) => card.category == category && card.type == type)
      .toList(growable: false);
}

TruthOrDareCardModel getRandomCard({
  TruthOrDareCategory? category,
  TruthOrDareType? type,
}) {
  var pool = truthOrDareCards;
  if (category != null) {
    pool = pool.where((card) => card.category == category).toList(growable: false);
  }
  if (type != null) {
    pool = pool.where((card) => card.type == type).toList(growable: false);
  }

  return pool[Random().nextInt(pool.length)];
}
