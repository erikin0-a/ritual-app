class StoryStepModel {
  const StoryStepModel({
    required this.id,
    required this.text,
    required this.duration,
    this.hint,
  });

  final String id;
  final String text;
  final int duration;
  final String? hint;
}

class StoryModel {
  const StoryModel({
    required this.id,
    required this.title,
    required this.description,
    required this.duration,
    required this.level,
    required this.steps,
  });

  final String id;
  final String title;
  final String description;
  final int duration;
  final String level;
  final List<StoryStepModel> steps;
}

const stories = <StoryModel>[
  StoryModel(
    id: 'first-date',
    title: 'Первое свидание',
    description:
        'Лёгкий сценарий для начала близости. Узнайте друг друга заново через взгляды, прикосновения и откровенные разговоры.',
    duration: 15 * 60,
    level: 'light',
    steps: [
      StoryStepModel(
        id: 'fd-1',
        text: 'Сядьте друг напротив друга. Уберите телефоны подальше.',
        duration: 30,
        hint: 'Создайте пространство только для вас двоих',
      ),
      StoryStepModel(
        id: 'fd-2',
        text: 'Посмотрите друг другу в глаза. Попробуйте удержать взгляд 20 секунд.',
        duration: 60,
      ),
      StoryStepModel(
        id: 'fd-3',
        text: 'Расскажите партнёру, что вас в нём привлекло с самого начала.',
        duration: 90,
        hint: 'Говорите от сердца, не спешите',
      ),
      StoryStepModel(
        id: 'fd-4',
        text: 'Возьмите партнёра за руку. Медленно проведите пальцами по его ладони.',
        duration: 90,
      ),
      StoryStepModel(
        id: 'fd-5',
        text: 'Обнимитесь. Скажите партнёру одно слово, которое описывает ваши чувства прямо сейчас.',
        duration: 90,
      ),
    ],
  ),
  StoryModel(
    id: 'candlelight-massage',
    title: 'Массаж при свечах',
    description:
        'Чувственный массаж в полумраке. Создайте атмосферу, расслабьтесь и насладитесь прикосновениями.',
    duration: 20 * 60,
    level: 'spicy',
    steps: [
      StoryStepModel(
        id: 'cm-1',
        text: 'Приглушите свет, зажгите несколько свечей. Включите тихую музыку.',
        duration: 90,
        hint: 'Создайте атмосферу — это важная часть ритуала',
      ),
      StoryStepModel(
        id: 'cm-2',
        text: 'Пусть партнёр ляжет на живот, устроившись поудобнее.',
        duration: 60,
      ),
      StoryStepModel(
        id: 'cm-3',
        text: 'Начните с плеч. Медленными, уверенными движениями разминайте мышцы.',
        duration: 120,
      ),
      StoryStepModel(
        id: 'cm-4',
        text: 'Проведите ладонями вдоль позвоночника — сверху вниз, медленно.',
        duration: 90,
      ),
      StoryStepModel(
        id: 'cm-5',
        text: 'Медленно наклонитесь и поцелуйте партнёра.',
        duration: 75,
      ),
    ],
  ),
  StoryModel(
    id: 'secret-desires',
    title: 'Тайные желания',
    description:
        'Интимный сценарий для доверия и открытости. Поделитесь фантазиями и исследуйте границы вместе.',
    duration: 25 * 60,
    level: 'wild',
    steps: [
      StoryStepModel(
        id: 'sd-1',
        text: 'Сядьте на кровать друг напротив друга. Приглушите свет до полумрака.',
        duration: 60,
      ),
      StoryStepModel(
        id: 'sd-2',
        text: 'Скажите партнёру: "Сегодня мы можем быть честными обо всём." Дождитесь его согласия.',
        duration: 60,
        hint: 'Consent — это основа',
      ),
      StoryStepModel(
        id: 'sd-3',
        text: 'Задайте вопрос: "О чём ты фантазируешь, но никогда не говорил вслух?"',
        duration: 120,
      ),
      StoryStepModel(
        id: 'sd-4',
        text: 'Проведите руками по телу партнёра — медленно, внимательно, изучающе.',
        duration: 120,
      ),
      StoryStepModel(
        id: 'sd-5',
        text: 'Обнимитесь. Скажите партнёру: "Спасибо за доверие." Дальше — только ваше желание.',
        duration: 90,
      ),
    ],
  ),
];

StoryModel? getStoryById(String id) {
  for (final story in stories) {
    if (story.id == id) return story;
  }
  return null;
}

List<StoryModel> getStoriesByLevel(String level) {
  return stories.where((story) => story.level == level).toList(growable: false);
}
