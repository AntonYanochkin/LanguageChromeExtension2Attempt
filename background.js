// JavaScript source code
// Создаём пункт меню при установке расширения
//chrome.runtime.onInstalled — это событие, которое срабатывает только при установке или обновлении расширения.
//addListener(...) — ты "подписываешься" на это событие.
// Ты можешь делать тут инициализацию — создавать контекстное меню, записывать дефолтные настройки и т.п.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({

        //id: "saveWord" — даёшь уникальный ID, чтобы потом отслеживать, какой пункт выбрали.
        //title: "Сохранить слово" — текст, который видит пользователь в меню.
        //contexts: ["selection"] — этот пункт появляется ТОЛЬКО, если пользователь что- то выделил на странице.
        id: "saveWordEn",
        title: "Сохранить английское слово",
        //Контекст — это условие, в котором Chrome решает: показывать меню или нет.
        //        Вот какие бывают contexts:

        //            Значение	Что означает
        //"all"	Всегда, во всех ситуациях
        //"page"	Щелчок по странице
        //"selection"	Есть выделенный текст
        //"image"	Щелчок по картинке
        //"link"	Щелчок по ссылке
        //"video"	Щелчок по видео
        //"audio"	Щелчок по аудио
        //"editable"	Щелчок по полю ввода(input, textarea)
        //"frame"	Щелчок по iframe
        //"launcher"	Щелчок по ярлыку приложения Chrome
        //"browser_action"	Клик по иконке расширения(устаревшее)
        contexts: ["selection"]
    });
});

// Обработка клика по пункту меню
/*🧠 Тут ты подписываешься на другое событие — onClicked:*/
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "saveWordEn") {
        const word = info.selectionText.trim().toLowerCase();
        if (word) {
            let translation = await GetTranslation(word, "EN", "RU");

            console.log(`Переводы слова "${word}":`, translation); // Исправлено на более информативный вывод

            const message = {
                Word: word,
                Translations: translation, // Используем полученный translation
                Date: new Date().toISOString(), // Лучше сохранять дату в ISO формате
                IsLearned: false
            };
            chrome.storage.local.set({ [word]: message }, function () {
                chrome.storage.local.get([word], function (result) {
                    console.log(`We saved and readed ${JSON.stringify(result[word])}`);
                })
            });
        }
    }
});

async function GetTranslation(word, from, to) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`;
    const response = await fetch(url);
    const data = await response.json();

    const mainTranslation = data.responseData.translatedText;
    // Собираем уникальные переводы из matches
    const isProbablyRussian = text => /[а-яА-ЯёЁ]/.test(text);

    const allVariants = data.matches
        .map(m => m.translation.trim())
        .filter((v, i, self) => v && self.indexOf(v) === i); // убираем дубликаты

    // Если совпадает с основным переводом — пропускаем его
    const filtered = allVariants.filter(v => v !== mainTranslation && isProbablyRussian(v));

    // Оставим только 2–3 наиболее вероятных варианта
    const topVariants = [mainTranslation, ...filtered.slice(0, 4)];

    return topVariants;
}