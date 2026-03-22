class IntroTimelineItem {
  const IntroTimelineItem({
    required this.startSec,
    required this.endSec,
    required this.text,
    this.style = 'default',
  });

  final int startSec;
  final int endSec;
  final String text;
  final String style;
}

const ritualIntroTimeline = <IntroTimelineItem>[
  IntroTimelineItem(startSec: 0, endSec: 3, text: 'Режим соблазнения', style: 'large'),
  IntroTimelineItem(startSec: 4, endSec: 8, text: 'Между вами будет расти напряжение'),
  IntroTimelineItem(startSec: 9, endSec: 15, text: 'Каждый раунд усиливает желание'),
  IntroTimelineItem(startSec: 15, endSec: 19, text: 'Но сначала... ограничения', style: 'accent'),
  IntroTimelineItem(startSec: 19, endSec: 25, text: 'Запреты делают желание сильнее', style: 'italic'),
  IntroTimelineItem(startSec: 26, endSec: 30, text: 'Следуйте моему голосу', style: 'large'),
  IntroTimelineItem(
    startSec: 30,
    endSec: 34,
    text: 'Когда правила изменятся — вы услышите сигнал',
  ),
  IntroTimelineItem(
    startSec: 35,
    endSec: 42,
    text: 'Оба партнера должны дать согласие',
    style: 'accent',
  ),
  IntroTimelineItem(startSec: 42, endSec: 60, text: 'Приложите пальцы', style: 'large'),
];

const ritualMicrocopy = {
  'preRitualTitle': 'Готовы начать?',
  'preRitualSubtitle': '20–30 минут только для вас двоих',
  'preparationHint': 'Найдите уединённое место. Отключите уведомления.',
  'timerRemaining': 'Осталось',
  'timerEnding': 'Раунд заканчивается...',
  'nextRound': 'Следующий раунд',
  'pauseButton': 'Пауза',
  'resumeButton': 'Продолжить',
  'exitButton': 'Завершить',
  'safetyMessage': 'Вы всегда можете остановиться',
  'roundAllowed': 'Разрешено',
  'roundForbidden': 'Запрещено',
};
