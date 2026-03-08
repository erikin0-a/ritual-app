/**
 * Ritual Microcopy — Small UI text elements for polish and atmosphere
 *
 * These are short phrases, labels, and atmospheric text snippets
 * that appear throughout the ritual experience.
 */

export const MICROCOPY = {
  // ====== PRE-RITUAL ======
  preRitual: {
    title: 'Готовы начать?',
    subtitle: '20–30 минут только для вас двоих',
    startButton: 'Начать Ритуал',
    preparationHint: 'Найдите уединённое место. Отключите уведомления.',
  },

  // ====== TIMER UI ======
  timer: {
    remaining: 'Осталось',
    timerEnding: 'Раунд заканчивается...',
    nextRound: 'Следующий раунд',
  },

  // ====== ROULETTE (Round 2) ======
  roulette: {
    title: 'Кто начинает?',
    spinning: 'Рулетка вращается...',
    result: (partnerName: string) => `${partnerName} начинает`,
    continue: 'Продолжить',
  },

  // ====== PARTNER CHOICE (Round 3) ======
  partnerChoice: {
    title: 'Выберите партнёра',
    subtitle: 'Кто начнёт раздевание?',
    confirmButton: 'Выбрать',
  },

  // ====== PAUSE / SAFETY ======
  pause: {
    pauseButton: 'Пауза',
    resumeButton: 'Продолжить',
    exitButton: 'Завершить',
    safetyMessage: 'Вы всегда можете остановиться',
    exitConfirm: {
      title: 'Завершить Ритуал?',
      body: 'Вы уверены? Прогресс не сохранится.',
      cancel: 'Отмена',
      confirm: 'Да, завершить',
    },
  },

  // ====== ROUND INFO ======
  roundInfo: {
    allowed: 'Разрешено',
    forbidden: 'Запрещено',
    rulesButton: 'Правила раунда',
  },

  // ====== NOTIFICATIONS / TOASTS ======
  notifications: {
    roundStarted: (roundName: string) => `Раунд: ${roundName}`,
    oneMinuteLeft: 'Осталась минута',
    thirtySecondsLeft: '30 секунд',
    finalRoundEnding: 'Правила исчезают...',
  },

  // ====== POST-RITUAL ======
  postRitual: {
    title: 'Ритуал завершён',
    subtitle: 'Как вам?',
    shareButton: 'Поделиться впечатлением',
    repeatButton: 'Повторить',
    homeButton: 'На главную',
    feedbackPrompt: 'Оцените опыт (необязательно)',
  },

  // ====== ATMOSPHERIC PHRASES (optional, for variety) ======
  atmospheric: [
    'Дышите медленнее.',
    'Наслаждайтесь моментом.',
    'Не торопитесь.',
    'Почувствуйте друг друга.',
    'Здесь только вы двое.',
    'Пусть мир подождёт.',
  ],

  // ====== ERRORS / EDGE CASES ======
  errors: {
    timerError: 'Ошибка таймера. Попробуйте снова.',
    genericError: 'Что-то пошло не так.',
    retryButton: 'Повторить',
  },
}

/**
 * Get a random atmospheric phrase (for showing variety)
 */
export function getRandomAtmosphericPhrase(): string {
  const phrases = MICROCOPY.atmospheric
  return phrases[Math.floor(Math.random() * phrases.length)]
}
