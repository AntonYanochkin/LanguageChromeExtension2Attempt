// JavaScript source code
// Создаю пункт меню при установке расширения
//chrome.runtime.onInstalled — это событие, которое срабатывает только при установке или обновлении расширения.
//addListener(...) — подписываюсь на это событие.
// Тут могу делать инициализацию — создавать контекстное меню, записывать дефолтные настройки и т.п.
chrome.runtime.onInstalled.addListener(() => {
    // Создаю пункт контекстного меню
    chrome.contextMenus.create({

        //id: "saveWordEn" — даю уникальный ID saveWordEn, чтобы потом отслеживать, какой пункт выбрали.
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
//Тут подписываюсь на событие onClicked:
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "saveWordEn") {
        const word = info.selectionText.trim().toLowerCase();
        if (word) {
            let translation = await GetTranslation(word, "EN", "RU");

            console.log(`Word translations "${word}":`, translation); 

            const message = {
                Word: word,
                Translations: translation, // Используем полученный translation
                Date: new Date().toISOString(), // Лучше сохранять дату в ISO формате
                IsLearned: false //Пока не используется, но потом можно заморочиться с повторением "невыученных" слов через определенные промежутки врмеени
            };
            //Сохраняю перевод слова в локальном хранилище расширения Chrome
            chrome.storage.local.set({ [word]: message }, function () {
                chrome.storage.local.get([word], function (result) {
                    console.log(`We saved and readed ${JSON.stringify(result[word])}`);
                })
            });
        }
    }
});
/**
 * Перевеодит слово с одного языка на другой при помощи публичного API MyMemory.
 * Возвращает массив возможных переводов, где первый элемент — это самый частый перевод
 * @param {any} word Слово, которое нужно перевести
 * @param {any} from Код исходного языка (например, "EN")
 * @param {any} to Код языка на который хотим перевести
 * @returns Возвращает массив возможных переводов, где первый элемент — это самый частый перевод
 */
async function GetTranslation(word, from, to) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`;
    const response = await fetch(url);//Отправляю запрос на сервер
    const data = await response.json();// 

    const mainTranslation = data.responseData.translatedText;          
    const isProbablyRussian = text => /[а-яА-ЯёЁ]/.test(text); //Объявляю функцию которая возвращает true если есть хоть 1 русская буква
    // Собираю уникальные переводы из matches
    const allVariants = data.matches
        .map(m => m.translation.trim())
        .filter((v, i, self) => v && self.indexOf(v) === i); // убираю дубликаты

    // Если совпадает с основным переводом — пропускаем 
    const filtered = allVariants.filter(v => v !== mainTranslation && isProbablyRussian(v));

    // Оставлю только 2–3 наиболее вероятных варианта
    const topVariants = [mainTranslation, ...filtered.slice(0, 4)];

    return topVariants; //возвращаю массив строк
}