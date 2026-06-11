// Адрес бэкенда. Локально это localhost:8000.
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Получить все тесты пользователя
export async function fetchTests(owner) {
    const res = await fetch(`${API_URL}/tests?owner=${encodeURIComponent(owner)}`);
    if (!res.ok) throw new Error("Не удалось загрузить тесты");
    return res.json();
}

// Получить тест по share-коду (для прохождения по ссылке)
export async function fetchTestByCode(code) {
    const res = await fetch(`${API_URL}/tests/by-code/${code}`);
    if (!res.ok) throw new Error("Тест не найден");
    return res.json();
}

// Создать новый тест
export async function createTest(test) {
    const res = await fetch(`${API_URL}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            owner: test.owner,
            title: test.title,
            type: test.type,
            questions: test.questions,
        }),
    });
    if (!res.ok) throw new Error("Не удалось создать тест");
    return res.json();
}

// Удалить тест
export async function deleteTest(testId) {
    const res = await fetch(`${API_URL}/tests/${testId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Не удалось удалить тест");
    return res.json();
}

// Обновить существующий тест
export async function updateTest(testId, test) {
    const res = await fetch(`${API_URL}/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            owner: test.owner,
            title: test.title,
            type: test.type,
            questions: test.questions,
        }),
    });
    if (!res.ok) throw new Error("Не удалось обновить тест");
    return res.json();
}


// Отправить прохождение теста
export async function submitTest(testId, submission) {
    const res = await fetch(`${API_URL}/tests/${testId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
    });
    if (!res.ok) throw new Error("Не удалось отправить ответы");
    return res.json();
}


// Удалить одно прохождение (результат) — сам тест остаётся
export async function deleteSubmission(testId, subId) {
    const res = await fetch(`${API_URL}/tests/${testId}/submissions/${subId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Не удалось удалить результат");
    return res.json();
}
