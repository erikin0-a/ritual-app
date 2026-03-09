/**
 * Truth or Dare Content — Russian cards for 3 categories
 *
 * Categories:
 * - Light: можно в кафе (appropriate for cafe)
 * - Spicy: приватная обстановка (private setting)
 * - Wild: только дома, интимно (only at home, intimate)
 *
 * Tone: intimate, playful, without vulgarity, with sensuality
 * Total: 120 cards (3 categories × 2 types × 20 cards)
 */

export interface TodCard {
  category: 'light' | 'spicy' | 'wild'
  type: 'truth' | 'dare'
  text: string
}

// ============================================================================
// LIGHT CATEGORY — 40 cards (20 truth + 20 dare)
// ============================================================================

const LIGHT_TRUTH: TodCard[] = [
  { category: 'light', type: 'truth', text: 'Что первое привлекло тебя во мне?' },
  { category: 'light', type: 'truth', text: 'Какой комплимент тебе больше всего запомнился?' },
  { category: 'light', type: 'truth', text: 'О чём ты мечтал в последний раз?' },
  { category: 'light', type: 'truth', text: 'Какое качество во мне тебя вдохновляет?' },
  { category: 'light', type: 'truth', text: 'Что заставляет тебя улыбаться, когда ты думаешь обо мне?' },
  { category: 'light', type: 'truth', text: 'Какой наш общий момент ты вспоминаешь чаще всего?' },
  { category: 'light', type: 'truth', text: 'Что тебя удивило во мне, когда мы познакомились?' },
  { category: 'light', type: 'truth', text: 'Какую черту характера ты хотел бы развить в себе?' },
  { category: 'light', type: 'truth', text: 'Где бы ты хотел оказаться прямо сейчас вместе со мной?' },
  { category: 'light', type: 'truth', text: 'Какой твой любимый способ провести выходные?' },
  { category: 'light', type: 'truth', text: 'О чём ты думаешь, когда засыпаешь?' },
  { category: 'light', type: 'truth', text: 'Какая песня напоминает тебе обо мне?' },
  { category: 'light', type: 'truth', text: 'Что делает тебя счастливым в обычный день?' },
  { category: 'light', type: 'truth', text: 'Какое место в городе тебе особенно дорого?' },
  { category: 'light', type: 'truth', text: 'Что ты ценишь в наших отношениях больше всего?' },
  { category: 'light', type: 'truth', text: 'Каким был твой самый романтичный момент?' },
  { category: 'light', type: 'truth', text: 'О чём ты любишь мечтать?' },
  { category: 'light', type: 'truth', text: 'Что тебя привлекает в людях?' },
  { category: 'light', type: 'truth', text: 'Какой твой любимый способ получать внимание?' },
  { category: 'light', type: 'truth', text: 'Что заставляет тебя чувствовать себя особенным?' },
]

const LIGHT_DARE: TodCard[] = [
  { category: 'light', type: 'dare', text: 'Скажи три комплимента, глядя мне в глаза.' },
  { category: 'light', type: 'dare', text: 'Прошепчи мне что-то на ухо.' },
  { category: 'light', type: 'dare', text: 'Поделись одной своей мечтой.' },
  { category: 'light', type: 'dare', text: 'Опиши меня тремя словами и объясни почему.' },
  { category: 'light', type: 'dare', text: 'Расскажи о моменте, когда ты почувствовал притяжение.' },
  { category: 'light', type: 'dare', text: 'Держи зрительный контакт 30 секунд молча.' },
  { category: 'light', type: 'dare', text: 'Опиши своё идеальное свидание с партнёром.' },
  { category: 'light', type: 'dare', text: 'Признайся в чём-то милом, что ты скрывал.' },
  { category: 'light', type: 'dare', text: 'Сделай партнёру комплимент за что-то, что он не замечает в себе.' },
  { category: 'light', type: 'dare', text: 'Улыбнись и расскажи, о чём подумал в этот момент.' },
  { category: 'light', type: 'dare', text: 'Покажи жестами, как ты хочешь провести вечер.' },
  { category: 'light', type: 'dare', text: 'Спой одну строчку из любимой песни.' },
  { category: 'light', type: 'dare', text: 'Нарисуй в воздухе пальцем, что чувствуешь прямо сейчас.' },
  { category: 'light', type: 'dare', text: 'Прикоснись к руке партнёра и скажи, что приходит в голову.' },
  { category: 'light', type: 'dare', text: 'Расскажи историю о первом впечатлении от партнёра.' },
  { category: 'light', type: 'dare', text: 'Опиши один момент, когда тебе было особенно хорошо со мной.' },
  { category: 'light', type: 'dare', text: 'Поделись одной своей слабостью.' },
  { category: 'light', type: 'dare', text: 'Скажи, что тебя интригует во мне больше всего.' },
  { category: 'light', type: 'dare', text: 'Назови три вещи, которые делают меня особенным для тебя.' },
  { category: 'light', type: 'dare', text: 'Придумай ласковое прозвище для партнёра и объясни его.' },
]

// ============================================================================
// SPICY CATEGORY — 40 cards (20 truth + 20 dare)
// ============================================================================

const SPICY_TRUTH: TodCard[] = [
  { category: 'spicy', type: 'truth', text: 'Какая часть моего тела тебя больше всего притягивает?' },
  { category: 'spicy', type: 'truth', text: 'О чём ты фантазировал, когда думал обо мне?' },
  { category: 'spicy', type: 'truth', text: 'Что заводит тебя больше всего?' },
  { category: 'spicy', type: 'truth', text: 'Какое прикосновение ты вспоминаешь чаще всего?' },
  { category: 'spicy', type: 'truth', text: 'Что тебе хочется попробовать вместе со мной?' },
  { category: 'spicy', type: 'truth', text: 'Какой момент близости с тобой я запомнил навсегда?' },
  { category: 'spicy', type: 'truth', text: 'Что ты чувствуешь, когда я прикасаюсь к тебе?' },
  { category: 'spicy', type: 'truth', text: 'О каком месте для близости ты мечтаешь?' },
  { category: 'spicy', type: 'truth', text: 'Какая моя привычка тебя соблазняет?' },
  { category: 'spicy', type: 'truth', text: 'Что ты думаешь, когда смотришь на мои губы?' },
  { category: 'spicy', type: 'truth', text: 'Какое слово, сказанное мной, возбуждает тебя?' },
  { category: 'spicy', type: 'truth', text: 'Когда ты почувствовал желание в последний раз?' },
  { category: 'spicy', type: 'truth', text: 'Что во мне вызывает у тебя страсть?' },
  { category: 'spicy', type: 'truth', text: 'О чём ты думал, когда мы впервые остались наедине?' },
  { category: 'spicy', type: 'truth', text: 'Какой аромат или запах напоминает тебе об интимности?' },
  { category: 'spicy', type: 'truth', text: 'Что тебя заводит в моём голосе?' },
  { category: 'spicy', type: 'truth', text: 'Какое моё движение ты находишь самым сексуальным?' },
  { category: 'spicy', type: 'truth', text: 'О каком сценарии близости ты мечтаешь?' },
  { category: 'spicy', type: 'truth', text: 'Что ты почувствовал, когда я впервые тебя поцеловал?' },
  { category: 'spicy', type: 'truth', text: 'Какая фантазия с участием нас обоих у тебя есть?' },
]

const SPICY_DARE: TodCard[] = [
  { category: 'spicy', type: 'dare', text: 'Поцелуй меня так, как давно хотел.' },
  { category: 'spicy', type: 'dare', text: 'Прикоснись к моей шее и задержись на 10 секунд.' },
  { category: 'spicy', type: 'dare', text: 'Прошепчи мне на ухо свою тайную фантазию.' },
  { category: 'spicy', type: 'dare', text: 'Медленно проведи пальцами по моей руке от запястья до плеча.' },
  { category: 'spicy', type: 'dare', text: 'Скажи, что бы ты сделал со мной прямо сейчас, если бы не было правил.' },
  { category: 'spicy', type: 'dare', text: 'Покажи, как бы ты меня обнял, если бы мы были одни.' },
  { category: 'spicy', type: 'dare', text: 'Опиши, какие ощущения вызывает у тебя моё присутствие.' },
  { category: 'spicy', type: 'dare', text: 'Положи руку мне на талию и смотри в глаза 20 секунд.' },
  { category: 'spicy', type: 'dare', text: 'Расскажи о моменте, когда ты почувствовал сильное влечение.' },
  { category: 'spicy', type: 'dare', text: 'Поцелуй меня в место, которое я не ожидаю.' },
  { category: 'spicy', type: 'dare', text: 'Скажи три вещи, которые ты хочешь сделать со мной позже.' },
  { category: 'spicy', type: 'dare', text: 'Убери волосы с моего лица и задержи руку у щеки.' },
  { category: 'spicy', type: 'dare', text: 'Опиши, как бы ты соблазнял меня, если бы у нас был весь вечер.' },
  { category: 'spicy', type: 'dare', text: 'Проведи губами вдоль моей шеи, не целуя.' },
  { category: 'spicy', type: 'dare', text: 'Шепни мне, что ты чувствуешь, когда прикасаешься ко мне.' },
  { category: 'spicy', type: 'dare', text: 'Прижми меня к себе и скажи, о чём думаешь в этот момент.' },
  { category: 'spicy', type: 'dare', text: 'Укуси меня нежно там, где я позволю.' },
  { category: 'spicy', type: 'dare', text: 'Скажи комплимент моему телу, глядя на него.' },
  { category: 'spicy', type: 'dare', text: 'Медленно расстегни одну пуговицу на моей одежде.' },
  { category: 'spicy', type: 'dare', text: 'Покажи жестом, что ты хочешь сделать со мной дальше.' },
]

// ============================================================================
// WILD CATEGORY — 40 cards (20 truth + 20 dare)
// ============================================================================

const WILD_TRUTH: TodCard[] = [
  { category: 'wild', type: 'truth', text: 'Какая самая смелая фантазия у тебя была обо мне?' },
  { category: 'wild', type: 'truth', text: 'Что доводит тебя до края быстрее всего?' },
  { category: 'wild', type: 'truth', text: 'Как ты хочешь, чтобы я прикасался к тебе?' },
  { category: 'wild', type: 'truth', text: 'О чём ты думаешь, когда возбуждён?' },
  { category: 'wild', type: 'truth', text: 'Какую часть интимности с тобой я делаю лучше всего?' },
  { category: 'wild', type: 'truth', text: 'Что тебе хочется прямо сейчас?' },
  { category: 'wild', type: 'truth', text: 'Какой сценарий близости заводит тебя больше всего?' },
  { category: 'wild', type: 'truth', text: 'Как бы ты описал свой идеальный оргазм?' },
  { category: 'wild', type: 'truth', text: 'Что я делаю, что сводит тебя с ума?' },
  { category: 'wild', type: 'truth', text: 'Какое самое чувственное место на твоём теле?' },
  { category: 'wild', type: 'truth', text: 'О чём ты мечтаешь, когда представляешь нас вдвоём?' },
  { category: 'wild', type: 'truth', text: 'Что ты хотел бы попробовать в постели, но стеснялся спросить?' },
  { category: 'wild', type: 'truth', text: 'Как ты предпочитаешь заниматься любовью — медленно или страстно?' },
  { category: 'wild', type: 'truth', text: 'Какое прикосновение вызывает у тебя мурашки?' },
  { category: 'wild', type: 'truth', text: 'Что ты чувствуешь, когда я тебя целую?' },
  { category: 'wild', type: 'truth', text: 'О каком запретном моменте близости ты думал?' },
  { category: 'wild', type: 'truth', text: 'Где на твоём теле ты больше всего любишь мои поцелуи?' },
  { category: 'wild', type: 'truth', text: 'Какой момент нашей близости ты вспоминаешь, когда хочешь меня?' },
  { category: 'wild', type: 'truth', text: 'Что тебе больше нравится — когда я нежный или когда страстный?' },
  { category: 'wild', type: 'truth', text: 'Опиши идеальный момент кульминации с тобой.' },
]

const WILD_DARE: TodCard[] = [
  { category: 'wild', type: 'dare', text: 'Сними с меня одну вещь медленно.' },
  { category: 'wild', type: 'dare', text: 'Покажи мне своими руками, как бы ты хотел, чтобы я тебя трогал.' },
  { category: 'wild', type: 'dare', text: 'Шепни мне на ухо свою самую откровенную мысль обо мне.' },
  { category: 'wild', type: 'dare', text: 'Укуси меня страстно там, где хочешь.' },
  { category: 'wild', type: 'dare', text: 'Проведи языком по моей шее от ключицы до уха.' },
  { category: 'wild', type: 'dare', text: 'Поцелуй меня так, чтобы я потерял контроль.' },
  { category: 'wild', type: 'dare', text: 'Скажи мне, что ты хочешь сделать со мной после этой игры.' },
  { category: 'wild', type: 'dare', text: 'Прикоснись ко мне там, где я больше всего хочу твоих рук.' },
  { category: 'wild', type: 'dare', text: 'Покажи звуками, что ты чувствуешь, когда я тебя трогаю.' },
  { category: 'wild', type: 'dare', text: 'Прижмись ко мне всем телом и останься так 30 секунд.' },
  { category: 'wild', type: 'dare', text: 'Опиши вслух, что ты чувствуешь в своём теле прямо сейчас.' },
  { category: 'wild', type: 'dare', text: 'Сними с себя одну вещь одежды и объясни, почему выбрал её.' },
  { category: 'wild', type: 'dare', text: 'Целуй меня везде, кроме губ, в течение минуты.' },
  { category: 'wild', type: 'dare', text: 'Прошепчи мне инструкцию, как довести тебя до удовольствия.' },
  { category: 'wild', type: 'dare', text: 'Скажи мне грязный комплимент, глядя в глаза.' },
  { category: 'wild', type: 'dare', text: 'Положи мою руку туда, где хочешь, чтобы я тебя трогал.' },
  { category: 'wild', type: 'dare', text: 'Покажи жестами, в какой позе ты хочешь меня прямо сейчас.' },
  { category: 'wild', type: 'dare', text: 'Прикоснись губами к моему телу в трёх местах по выбору.' },
  { category: 'wild', type: 'dare', text: 'Скажи три самые откровенные вещи, которые ты хочешь со мной сделать.' },
  { category: 'wild', type: 'dare', text: 'Прикоснись ко мне так, чтобы я захотел продолжения.' },
]

// ============================================================================
// EXPORT ALL CARDS
// ============================================================================

export const TRUTH_OR_DARE_CARDS: TodCard[] = [
  ...LIGHT_TRUTH,
  ...LIGHT_DARE,
  ...SPICY_TRUTH,
  ...SPICY_DARE,
  ...WILD_TRUTH,
  ...WILD_DARE,
]

// Helper functions for filtering cards

export function getCardsByCategory(category: 'light' | 'spicy' | 'wild'): TodCard[] {
  return TRUTH_OR_DARE_CARDS.filter((card) => card.category === category)
}

export function getCardsByType(type: 'truth' | 'dare'): TodCard[] {
  return TRUTH_OR_DARE_CARDS.filter((card) => card.type === type)
}

export function getCardsByCategoryAndType(
  category: 'light' | 'spicy' | 'wild',
  type: 'truth' | 'dare'
): TodCard[] {
  return TRUTH_OR_DARE_CARDS.filter(
    (card) => card.category === category && card.type === type
  )
}

export function getRandomCard(
  category?: 'light' | 'spicy' | 'wild',
  type?: 'truth' | 'dare'
): TodCard {
  let pool = TRUTH_OR_DARE_CARDS

  if (category) {
    pool = pool.filter((card) => card.category === category)
  }

  if (type) {
    pool = pool.filter((card) => card.type === type)
  }

  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex]
}

// ============================================================================
// STATS
// ============================================================================

export const TOD_STATS = {
  total: TRUTH_OR_DARE_CARDS.length,
  light: LIGHT_TRUTH.length + LIGHT_DARE.length,
  spicy: SPICY_TRUTH.length + SPICY_DARE.length,
  wild: WILD_TRUTH.length + WILD_DARE.length,
  truth: TRUTH_OR_DARE_CARDS.filter((c) => c.type === 'truth').length,
  dare: TRUTH_OR_DARE_CARDS.filter((c) => c.type === 'dare').length,
}

// Expected: { total: 120, light: 40, spicy: 40, wild: 40, truth: 60, dare: 60 }
