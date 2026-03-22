class RoundContent {
  const RoundContent({
    required this.roundId,
    required this.extendedDescription,
    required this.moodSetter,
    required this.duringRoundHints,
  });

  final int roundId;
  final String extendedDescription;
  final String moodSetter;
  final List<String> duringRoundHints;
}

class TransitionPhrase {
  const TransitionPhrase({
    required this.from,
    required this.to,
    required this.text,
    this.subtext,
  });

  final String from;
  final int to;
  final String text;
  final String? subtext;
}

class FinalMessage {
  const FinalMessage({
    required this.title,
    required this.body,
    this.cta,
  });

  final String title;
  final String body;
  final String? cta;
}

const roundContents = <RoundContent>[
  RoundContent(
    roundId: 1,
    extendedDescription:
        'Первый раунд сбрасывает рутину: только взгляд, дыхание и короткие реплики. Цель — снова увидеть партнёра, не касаясь.',
    moodSetter: 'Только взгляд. Без прикосновений.',
    duringRoundHints: [
      'Держите взгляд дольше обычного.',
      'Синхронизируйте вдох и выдох.',
      'Фраз меньше. Внимания больше.',
    ],
  ),
  RoundContent(
    roundId: 2,
    extendedDescription:
        'Рулетка выбирает ведущего. В этом раунде действует один партнёр, второй принимает, чтобы напряжение росло точнее.',
    moodSetter: 'Один ведёт. Второй принимает.',
    duringRoundHints: [
      'Остановитесь в сантиметре перед касанием.',
      'После каждого действия делайте паузу.',
      'Ответ руками пока не нужен.',
    ],
  ),
  RoundContent(
    roundId: 3,
    extendedDescription:
        'Соблазнение идёт волнами: один действует, затем происходит мягкая смена. Ласки только по открытым местам, без снятия одежды.',
    moodSetter: 'Глубже, но всё ещё сдержанно.',
    duringRoundHints: [
      'Кончики пальцев, затем пауза.',
      'Один вдох ближе, один вдох назад.',
      'Слова усиливают действие, но не заменяют его.',
    ],
  ),
  RoundContent(
    roundId: 4,
    extendedDescription:
        'Это раунд молчаливого согласия: касание вещи, взгляд, кивок, медленное снятие. Всё только по очереди и без спешки.',
    moodSetter: 'Почти. Но ещё не сейчас.',
    duringRoundHints: [
      'Кивок важнее скорости.',
      'Если согласия нет, остановитесь и обнимите.',
      'После снятия вещи вернитесь к дыханию.',
    ],
  ),
  RoundContent(
    roundId: 5,
    extendedDescription:
        'Финал держит пик, а не разрешает его. Меньше слов, больше очередности, направленных прикосновений и намеренного контроля.',
    moodSetter: 'Удержите пик до конца таймера.',
    duringRoundHints: [
      'Ведёт один партнёр, затем смена.',
      'Если комфортно, снимайте ещё одну вещь по очереди.',
      'Последняя минута остаётся только вам двоим.',
    ],
  ),
];

const transitions = <TransitionPhrase>[
  TransitionPhrase(
    from: 'intro',
    to: 1,
    text: 'Раунд 1. Зрительный контакт',
    subtext: 'Только взгляд, дыхание и точные слова.',
  ),
  TransitionPhrase(
    from: '1',
    to: 2,
    text: 'Раунд 2. Первое прикосновение',
    subtext: 'Рулетка выберет, кто ведёт.',
  ),
  TransitionPhrase(
    from: '2',
    to: 3,
    text: 'Раунд 3. Соблазнение',
    subtext: 'Один действует, потом мягкая смена.',
  ),
  TransitionPhrase(
    from: '3',
    to: 4,
    text: 'Раунд 4. Ближе',
    subtext: 'Согласие взглядом. Медленное снятие вещей.',
  ),
  TransitionPhrase(
    from: '4',
    to: 5,
    text: 'Раунд 5. Пик',
    subtext: 'Меньше слов. Больше напряжения.',
  ),
];

const finalMessage = FinalMessage(
  title: 'Ритуал завершён',
  body: 'Я оставляю вас вдвоём. Дальше вы ведёте сами.',
  cta: 'Закрыть',
);
