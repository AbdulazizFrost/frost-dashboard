// Установка контекстного меню
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "frost-translate-parent",
        title: "Перевести картинку (Frost)",
        contexts: ["image"]
    });
    
    chrome.contextMenus.create({
        id: "frost-translate-yandex",
        parentId: "frost-translate-parent",
        title: "Через Яндекс (Идеально для манги)",
        contexts: ["image"]
    });
    
    chrome.contextMenus.create({
        id: "frost-translate-lens",
        parentId: "frost-translate-parent",
        title: "Через Google Lens",
        contexts: ["image"]
    });
});

// Обработка клика по контекстному меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId.startsWith("frost-translate")) {
        const imageUrl = info.srcUrl;
        let targetUrl = "";

        if (info.menuItemId === "frost-translate-yandex") {
            // Yandex Image Translate
            targetUrl = `https://translate.yandex.ru/ocr?url=${encodeURIComponent(imageUrl)}&target_lang=ru`;
        } else if (info.menuItemId === "frost-translate-lens") {
            // Google Lens
            targetUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;
        }

        if (targetUrl) {
            chrome.tabs.create({ url: targetUrl });
        }
    }
});

// Service Worker работает в фоне и имеет права на обход CORS (за счет host_permissions)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchSuggestions") {
        fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(request.query)}`)
            .then(response => response.json())
            .then(data => {
                // data[1] содержит массив строк-подсказок от Google
                sendResponse({ suggestions: data[1] });
            })
            .catch(error => {
                console.error("Fetch error:", error);
                sendResponse({ suggestions: [] });
            });
            
        // Возвращаем true, чтобы указать, что ответ будет отправлен асинхронно
        return true;
    }
});
