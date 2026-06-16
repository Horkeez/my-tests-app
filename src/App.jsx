import React, { useState, useEffect } from 'react';
import {
  User, Plus, FileText, BarChart3, ClipboardList, Trash2,
  ChevronLeft, Image as ImageIcon, Check, X, CircleDot,
  CheckSquare, Type, Award, Eye, Send, ListChecks,
  LogOut, Share2, Copy, Mail, Lock, KeyRound, ArrowLeft,
  EyeOff, ArrowLeftRight
} from 'lucide-react';
import {
  fetchTests, createTest, deleteTest, submitTest,
  updateTest, deleteSubmission, fetchTestByCode, registerStart,
  registerConfirm, loginUser, resetStart, resetConfirm, forgotLogin
} from './api';


// Типы тестов — объявлены в начале, доступны всем компонентам
const TYPE_LABELS = {
  quiz: { label: 'Тест с баллами', color: 'bg-indigo-100 text-indigo-700', icon: Award },
  survey: { label: 'Опрос / сбор данных', color: 'bg-emerald-100 text-emerald-700', icon: ClipboardList },
  analytics: { label: 'Аналитика', color: 'bg-amber-100 text-amber-700', icon: BarChart3 },
};


export default function TestApp() {
  // При запуске пытаемся достать сохранённое имя из localStorage
  const savedUser = localStorage.getItem('username') || '';

  const [screen, setScreen] = useState(savedUser ? 'menu' : 'login');
  const [username, setUsername] = useState(savedUser);
  const [usernameInput, setUsernameInput] = useState('');
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null); // тест, который проходим/смотрим
  const [editingTest, setEditingTest] = useState(null); // тест, который редактируем
  const [loading, setLoading] = useState(false);
  const [resultsSource, setResultsSource] = useState('resultslist');

  // Сохраняем данные пользователя после успешного входа/регистрации
  const applyAuth = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.login);
    localStorage.setItem('email', data.email);
    setUsername(data.login);
    loadTests(data.login);
    setScreen('menu');
  };


  // Выход из аккаунта: чистим имя и возвращаем на экран входа
  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUsername('');
    setScreen('login');
  };


  // Тест, ссылкой на который сейчас делимся (для модального окна)
  const [shareTest, setShareTest] = useState(null);

  // Гостевой режим: когда зашли по ссылке ?code=...
  const [guestTest, setGuestTest] = useState(null);  // загруженный тест
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');

  // При запуске приложения проверяем — есть ли в адресе ?code=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setGuestLoading(true);
      setScreen('guest');           // отдельный экран для гостя
      fetchTestByCode(code)
        .then((test) => {
          setGuestTest(test);
          setGuestLoading(false);
        })
        .catch(() => {
          setGuestError('Тест не найден или ссылка устарела');
          setGuestLoading(false);
        });
    } else if (savedUser) {
      // Восстанавливаем тесты из базы при перезагрузке страницы
      loadTests(savedUser);
    }
  }, []);


  // Загрузить тесты пользователя с сервера
  const loadTests = async (owner) => {
    try {
      setLoading(true);
      const data = await fetchTests(owner);
      setTests(data);
    } catch (e) {
      console.error(e);
      alert('Не удалось загрузить тесты. Запущен ли сервер?');
    } finally {
      setLoading(false);
    }
  };


  // ----- ГОСТЕВОЙ ЭКРАН (заход по ссылке ?code=) -----
  if (screen === 'guest') {
    if (guestLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-gray-500 text-center">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 animate-pulse text-indigo-400" />
            Загрузка теста...
          </div>
        </div>
      );
    }
    if (guestError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
            <X className="w-10 h-10 mx-auto mb-2 text-red-400" />
            <p className="text-gray-700 font-medium mb-4">{guestError}</p>
            <button
              onClick={() => {
                window.history.replaceState({}, '', '/');
                setScreen(localStorage.getItem('username') ? 'menu' : 'login');
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg"
            >
              На главную
            </button>
          </div>
        </div>
      );
    }
    if (guestTest) {
      return (
        <TestTaking
          key={Date.now()}
          test={guestTest}
          onCancel={() => setScreen('guest-done')}
          onSubmit={async (submission) => {
            try {
              await submitTest(guestTest.id, submission);
            } catch { }
            setScreen('guest-done');
          }}
        />
      );
    }
    return null;
  }

  // ----- ЭКРАН БЛАГОДАРНОСТИ ПОСЛЕ ПРОХОЖДЕНИЯ ПО ССЫЛКЕ -----
  if (screen === 'guest-done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
          <div className="bg-emerald-100 rounded-full p-4 w-fit mx-auto mb-3">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Спасибо!</h2>
          <p className="text-sm text-gray-500 mb-5">Ваши ответы отправлены.</p>

          {/* Пройти этот же тест ещё раз */}
          {guestTest && (
            <button
              onClick={() => setScreen('guest')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg mb-2"
            >
              Пройти ещё раз
            </button>
          )}

          {/* Создать свой тест — ведёт на вход/регистрацию, НЕ в чужой кабинет */}
          <button
            onClick={() => {
              setGuestTest(null);
              window.history.replaceState({}, '', '/');
              setScreen('login');
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg"
          >
            Создать свой тест
          </button>
        </div>
      </div>
    );
  }

  // ----- ЭКРАН АВТОРИЗАЦИИ (вход / регистрация / сброс пароля) -----
  if (screen === 'login') {
    return <AuthScreen onAuth={applyAuth} />;
  }


  // ----- ГЛАВНОЕ МЕНЮ -----
  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header username={username} onLogout={handleLogout} />
        <div className="max-w-md mx-auto p-4 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Главное меню</h2>
          <MenuCard
            icon={<Plus className="w-6 h-6 text-white" />}
            color="bg-indigo-600"
            title="Создать тест"
            subtitle="Новый тест, опрос или анкета"
            onClick={() => setScreen('create')}
          />
          <MenuCard
            icon={<FileText className="w-6 h-6 text-white" />}
            color="bg-emerald-600"
            title="Мои тесты"
            subtitle={`${tests.length} ${plural(tests.length)}`}
            onClick={() => setScreen('mytests')}
          />
          <MenuCard
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            color="bg-amber-600"
            title="Результаты"
            subtitle="Ответы и статистика"
            onClick={() => setScreen('resultslist')}
          />
        </div>
      </div>
    );
  }

  // ----- СОЗДАНИЕ / РЕДАКТИРОВАНИЕ ТЕСТА -----
  if (screen === 'create') {
    return (
      <TestCreator
        username={username}
        editingTest={editingTest}
        onCancel={() => {
          setEditingTest(null);
          setScreen(editingTest ? 'mytests' : 'menu');
        }}
        onSave={async (test) => {
          try {
            if (editingTest) {
              // режим редактирования — обновляем
              const updated = await updateTest(editingTest.id, test);
              setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
              setEditingTest(null);
            } else {
              // режим создания — создаём новый
              const saved = await createTest(test);
              setTests((prev) => [...prev, saved]);
            }
            setScreen('mytests');
          } catch (e) {
            console.error(e);
            alert('Не удалось сохранить тест. Запущен ли сервер?');
          }
        }}
      />
    );
  }


  // ----- МОИ ТЕСТЫ -----
  if (screen === 'mytests') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header username={username} onLogout={handleLogout} />
        <div className="max-w-md mx-auto p-4">
          <button
            onClick={() => setScreen('menu')}
            className="flex items-center text-indigo-600 mb-3 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Мои тесты</h2>
          {tests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Пока нет тестов.<br />Создайте первый!
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((t) => (
                <TestListItem
                  key={t.id}
                  test={t}
                  onTake={() => { setActiveTest(t); setScreen('take'); }}
                  onResults={() => { setResultsSource('mytests'); setActiveTest(t); setScreen('results'); }}
                  onEdit={() => { setEditingTest(t); setScreen('create'); }}
                  onDelete={async () => {
                    try {
                      await deleteTest(t.id);
                      setTests((prev) => prev.filter((x) => x.id !== t.id));
                    } catch (e) {
                      console.error(e);
                      alert('Не удалось удалить тест.');
                    }
                  }}
                  onShare={() => setShareTest(t)}
                />
              ))}
            </div>
          )}
        </div>
        {shareTest && (
          <ShareModal test={shareTest} onClose={() => setShareTest(null)} />
        )}
      </div>
    );
  }


  // ----- СПИСОК РЕЗУЛЬТАТОВ (отдельный раздел) -----
  if (screen === 'resultslist') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header username={username} />
        <div className="max-w-md mx-auto p-4">
          <button
            onClick={() => setScreen('menu')}
            className="flex items-center text-indigo-600 mb-3 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Результаты тестов</h2>
          {tests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Пока нет тестов.<br />Сначала создайте тест.
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((t) => {
                const meta = TYPE_LABELS[t.type];
                const Icon = meta.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setResultsSource('resultslist'); setActiveTest(t); setScreen('results'); }}
                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-left flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color} mb-1.5`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </div>
                      <h3 className="font-semibold text-gray-800">{t.title}</h3>
                      <p className="text-sm text-gray-500">
                        {t.submissions.length} {t.type === 'quiz' ? 'прохожд.' : 'опрошено'}
                      </p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-amber-600 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }



  // ----- ПРОХОЖДЕНИЕ ТЕСТА -----
  if (screen === 'take' && activeTest) {
    return (
      <TestTaking
        test={activeTest}
        onCancel={() => setScreen('mytests')}
        onSubmit={async (submission) => {
          try {
            const updated = await submitTest(activeTest.id, submission);
            setTests((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setActiveTest(updated);
            setScreen('results');
          } catch (e) {
            console.error(e);
            alert('Не удалось отправить ответы. Запущен ли сервер?');
          }
        }}
      />
    );
  }


  // ----- РЕЗУЛЬТАТЫ -----
  if (screen === 'results' && activeTest) {
    const fresh = tests.find((t) => t.id === activeTest.id) || activeTest;
    return (
      <TestResults
        test={fresh}
        onBack={() => setScreen(resultsSource)}
        onDeleteSubmission={async (subId) => {
          try {
            const updated = await deleteSubmission(fresh.id, subId);
            setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setActiveTest(updated);
          } catch (e) {
            console.error(e);
            alert('Не удалось удалить результат.');
          }
        }}
      />
    );
  }

  return null;
}

/* ============ ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ============ */

function Header({ username, onLogout }) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 rounded-lg p-1.5">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="font-bold text-gray-800">Тесты</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <User className="w-4 h-4" />
            {username}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuCard({ icon, color, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition text-left"
    >
      <div className={`${color} rounded-xl p-3`}>{icon}</div>
      <div>
        <div className="font-semibold text-gray-800">{title}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
    </button>
  );
}

function TestListItem({ test, onTake, onResults, onEdit, onDelete, onShare }) {
  const meta = TYPE_LABELS[test.type];
  const Icon = meta.icon;
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color} mb-1.5`}>
            <Icon className="w-3 h-3" /> {meta.label}
          </div>
          <h3 className="font-semibold text-gray-800">{test.title}</h3>
          <p className="text-sm text-gray-500">
            {test.questions.length} вопр. · {test.submissions.length} прохожд.
          </p>
        </div>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onTake}
          className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg"
        >
          <Eye className="w-4 h-4" /> Пройти
        </button>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-medium py-2 rounded-lg"
        >
          <Type className="w-4 h-4" /> Изменить
        </button>
        <button
          onClick={onResults}
          className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg"
        >
          <BarChart3 className="w-4 h-4" /> Итоги
        </button>
      </div>
      <button
        onClick={onShare}
        className="w-full mt-2 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium py-2 rounded-lg"
      >
        <Share2 className="w-4 h-4" /> Поделиться тестом
      </button>
    </div>
  );
}

/* ============ КОНСТРУКТОР ТЕСТА ============ */

function TestCreator({ username, editingTest, onCancel, onSave }) {
  const [title, setTitle] = useState(editingTest ? editingTest.title : '');
  const [type, setType] = useState(editingTest ? editingTest.type : 'quiz');
  const [questions, setQuestions] = useState(editingTest ? editingTest.questions : []);
  const [error, setError] = useState('');


  const addQuestion = (format) => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: '',
        image: '',
        format, // single | multiple | text | match
        options: (format === 'text' || format === 'match') ? [] : [
          { id: 1, text: '', correct: false },
          { id: 2, text: '', correct: false },
        ],
        pairs: format === 'match' ? [
          { id: 1, leftText: '', leftImage: '', rightText: '', rightImage: '' },
          { id: 2, leftText: '', leftImage: '', rightText: '', rightImage: '' },
        ] : [],
        correctText: '',
      },
    ]);
  };

  const updateQuestion = (qid, patch) =>
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)));

  const removeQuestion = (qid) =>
    setQuestions((prev) => prev.filter((q) => q.id !== qid));

  const addOption = (qid) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, options: [...q.options, { id: Date.now(), text: '', correct: false }] }
          : q
      )
    );

  const updateOption = (qid, oid, patch) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? {
            ...q,
            options: q.options.map((o) => {
              if (o.id !== oid) {
                // для single — снимаем correct с других при выборе
                if (q.format === 'single' && patch.correct) return { ...o, correct: false };
                return o;
              }
              return { ...o, ...patch };
            }),
          }
          : q
      )
    );

  const removeOption = (qid, oid) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, options: q.options.filter((o) => o.id !== oid) } : q
      )
    );

  const addPair = (qid) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, pairs: [...(q.pairs || []), { id: Date.now(), leftText: '', leftImage: '', rightText: '', rightImage: '' }] }
          : q
      )
    );

  const updatePair = (qid, pid, patch) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, pairs: (q.pairs || []).map((p) => (p.id === pid ? { ...p, ...patch } : p)) }
          : q
      )
    );

  const removePair = (qid, pid) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, pairs: (q.pairs || []).filter((p) => p.id !== pid) } : q
      )
    );

  // Проверяем тест перед сохранением. Возвращает текст ошибки или '' если всё ок.
  const validateTest = () => {
    if (!title.trim()) return 'Введите название теста';
    if (questions.length === 0) return 'Добавьте хотя бы один вопрос';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const num = i + 1;

      // 1. У каждого вопроса должен быть текст
      if (!q.text.trim()) {
        return `Вопрос ${num}: введите текст вопроса`;
      }

      // 2. Текстовый вопрос
      if (q.format === 'text') {
        // если это тест с баллами — нужен правильный ответ
        if (type === 'quiz' && !q.correctText.trim()) {
          return `Вопрос ${num}: укажите правильный ответ`;
        }
      } else if (q.format === 'match') {
        // 3. Вопрос на сопоставление
        const pairs = q.pairs || [];
        if (pairs.length < 2) {
          return `Вопрос ${num}: добавьте минимум 2 пары для сопоставления`;
        }
        for (let j = 0; j < pairs.length; j++) {
          const p = pairs[j];
          if (!p.leftText.trim() && !p.leftImage.trim()) {
            return `Вопрос ${num}, пара ${j + 1}: укажите левый элемент (текст или картинку)`;
          }
          if (!p.rightText.trim() && !p.rightImage.trim()) {
            return `Вопрос ${num}, пара ${j + 1}: укажите правый элемент (текст или картинку)`;
          }
        }
      } else {
        // 4. Вопросы с вариантами (single / multiple)
        if (q.options.length < 2) {
          return `Вопрос ${num}: добавьте минимум 2 варианта ответа`;
        }
        // ни один вариант не должен быть пустым
        const emptyOption = q.options.find((o) => !o.text.trim());
        if (emptyOption) {
          return `Вопрос ${num}: заполните все варианты ответа`;
        }
        // для теста с баллами — должен быть отмечен хотя бы один правильный
        if (type === 'quiz') {
          const hasCorrect = q.options.some((o) => o.correct);
          if (!hasCorrect) {
            return `Вопрос ${num}: отметьте правильный ответ галочкой`;
          }
        }
      }
    }
    return '';
  };

  const handleSave = () => {
    const problem = validateTest();
    if (problem) {
      setError(problem);
      // плавно прокручиваем вверх, чтобы пользователь увидел сообщение
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    onSave({
      id: Date.now(),
      owner: username,
      title: title.trim(),
      type,
      questions,
      submissions: [],
      shareCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    });
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onCancel} className="flex items-center text-gray-600 text-sm">
            <ChevronLeft className="w-5 h-5" /> Отмена
          </button>
          <span className="font-bold text-gray-800">{editingTest ? 'Редактирование' : 'Новый тест'}</span>
          <span className="w-16" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Сообщение об ошибке валидации */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Название */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Название теста</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="например, Тест по физике: Механика"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Тип теста */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Тип теста</label>
          <div className="space-y-2">
            {Object.entries(TYPE_LABELS).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition text-left ${type === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${type === key ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{meta.label}</div>
                    <div className="text-xs text-gray-500">
                      {key === 'quiz' && 'Есть правильные ответы, считаются баллы'}
                      {key === 'survey' && 'Просто собираем ответы, без оценки'}
                      {key === 'analytics' && 'Для статистики по выбранным вариантам'}
                    </div>
                  </div>
                  {type === key && <Check className="w-5 h-5 text-indigo-600 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Вопросы */}
        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.id}
            index={idx}
            question={q}
            isQuiz={type === 'quiz'}
            onUpdate={(patch) => updateQuestion(q.id, patch)}
            onRemove={() => removeQuestion(q.id)}
            onAddOption={() => addOption(q.id)}
            onUpdateOption={(oid, patch) => updateOption(q.id, oid, patch)}
            onRemoveOption={(oid) => removeOption(q.id, oid)}
            onAddPair={() => addPair(q.id)}
            onUpdatePair={(pid, patch) => updatePair(q.id, pid, patch)}
            onRemovePair={(pid) => removePair(q.id, pid)}
          />
        ))}

        {/* Добавить вопрос */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-2">Добавить вопрос</p>
          <div className="grid grid-cols-2 gap-2">
            <AddBtn icon={<CircleDot className="w-5 h-5" />} label="Один ответ" onClick={() => addQuestion('single')} />
            <AddBtn icon={<CheckSquare className="w-5 h-5" />} label="Несколько ответов" onClick={() => addQuestion('multiple')} />
            <AddBtn icon={<Type className="w-5 h-5" />} label="Текстовый ответ" onClick={() => addQuestion('text')} />
            <AddBtn icon={<ArrowLeftRight className="w-5 h-5" />} label="Сопоставление" onClick={() => addQuestion('match')} />
          </div>
        </div>
      </div>

      {/* Кнопка сохранить */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition"
          >
            Сохранить тест {questions.length > 0 && `(${questions.length} вопр.)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

const FORMAT_LABELS = {
  single: { label: 'Один ответ', icon: CircleDot },
  multiple: { label: 'Несколько ответов', icon: CheckSquare },
  text: { label: 'Текстовый ответ', icon: Type },
  match: { label: 'Сопоставление', icon: ArrowLeftRight },
};

function QuestionEditor({
  index, question, isQuiz, onUpdate, onRemove,
  onAddOption, onUpdateOption, onRemoveOption,
  onAddPair, onUpdatePair, onRemovePair,
}) {
  const meta = FORMAT_LABELS[question.format] || FORMAT_LABELS.single;
  const Icon = meta.icon;
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Icon className="w-3.5 h-3.5" /> {meta.label}
          </span>
        </div>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={question.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Текст вопроса..."
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
      />

      {/* Картинка к вопросу */}
      <input
        value={question.image}
        onChange={(e) => onUpdate({ image: e.target.value })}
        placeholder="Ссылка на картинку к вопросу (необязательно)"
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 mb-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      />

      {question.format === 'match' ? (
        /* ===== СОПОСТАВЛЕНИЕ ===== */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1 text-center">
            <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md py-1">Левый элемент</div>
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-md py-1">Правый элемент</div>
          </div>
          {(question.pairs || []).map((pair, pairIdx) => (
            <div key={pair.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400">Пара {pairIdx + 1}</span>
                {(question.pairs || []).length > 2 && (
                  <button onClick={() => onRemovePair(pair.id)} className="text-gray-300 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <input
                    value={pair.leftText}
                    onChange={(e) => onUpdatePair(pair.id, { leftText: e.target.value })}
                    placeholder="Текст"
                    className="w-full border border-indigo-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                  <input
                    value={pair.leftImage}
                    onChange={(e) => onUpdatePair(pair.id, { leftImage: e.target.value })}
                    placeholder="Ссылка на картинку"
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-400 outline-none bg-white text-gray-500"
                  />
                  {pair.leftImage && (
                    <img src={pair.leftImage} alt="" className="w-full rounded max-h-16 object-cover bg-gray-100"
                      onError={(e) => (e.target.style.display = 'none')} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <input
                    value={pair.rightText}
                    onChange={(e) => onUpdatePair(pair.id, { rightText: e.target.value })}
                    placeholder="Текст"
                    className="w-full border border-emerald-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  />
                  <input
                    value={pair.rightImage}
                    onChange={(e) => onUpdatePair(pair.id, { rightImage: e.target.value })}
                    placeholder="Ссылка на картинку"
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-400 outline-none bg-white text-gray-500"
                  />
                  {pair.rightImage && (
                    <img src={pair.rightImage} alt="" className="w-full rounded max-h-16 object-cover bg-gray-100"
                      onError={(e) => (e.target.style.display = 'none')} />
                  )}
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={onAddPair}
            className="text-sm text-indigo-600 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Добавить пару
          </button>
          <p className="text-xs text-gray-400">
            При прохождении правые элементы будут перемешаны в случайном порядке
          </p>
        </div>
      ) : question.format === 'text' ? (
        /* ===== ТЕКСТОВЫЙ ОТВЕТ ===== */
        isQuiz ? (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Правильный ответ
            </label>
            <input
              value={question.correctText}
              onChange={(e) => onUpdate({ correctText: e.target.value })}
              placeholder="например, 9.8"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Пользователь введёт ответ текстом
          </p>
        )
      ) : (
        /* ===== ВЫБОР ВАРИАНТОВ (single / multiple) ===== */
        <div className="space-y-2">
          {question.options.map((o) => (
            <div key={o.id} className="flex items-center gap-2">
              {isQuiz && (
                <button
                  onClick={() => onUpdateOption(o.id, { correct: !o.correct })}
                  className={`flex-shrink-0 w-6 h-6 rounded-${question.format === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center ${o.correct ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                  title="Отметить правильным"
                >
                  {o.correct && <Check className="w-4 h-4 text-white" />}
                </button>
              )}
              <input
                value={o.text}
                onChange={(e) => onUpdateOption(o.id, { text: e.target.value })}
                placeholder="Вариант ответа"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {question.options.length > 1 && (
                <button onClick={() => onRemoveOption(o.id)} className="text-gray-300 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={onAddOption}
            className="text-sm text-indigo-600 font-medium flex items-center gap-1 mt-1"
          >
            <Plus className="w-4 h-4" /> Добавить вариант
          </button>
          {isQuiz && (
            <p className="text-xs text-gray-400 mt-1">
              Отметьте {question.format === 'single' ? 'правильный вариант' : 'правильные варианты'} галочкой
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ ПРОХОЖДЕНИЕ ТЕСТА ============ */

function TestTaking({ test, onCancel, onSubmit }) {
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({}); // qid -> {selected:[], text:''}

  const setAnswer = (qid, patch) =>
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch } }));

  const toggleOption = (q, oid) => {
    const cur = answers[q.id]?.selected || [];
    if (q.format === 'single') {
      setAnswer(q.id, { selected: [oid] });
    } else {
      setAnswer(q.id, {
        selected: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid],
      });
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">{test.title}</h2>
          <p className="text-sm text-gray-500 mb-4">{test.questions.length} вопросов</p>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Ваше имя</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите имя"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            onClick={() => name.trim() && setStarted(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg mb-2"
          >
            Начать
          </button>
          <button onClick={onCancel} className="w-full text-gray-500 text-sm py-2">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    let score = 0;
    let answered = 0;
    const detailed = test.questions.map((q) => {
      const a = answers[q.id] || {};
      let hasAnswer = false;
      let correct = null;

      if (q.format === 'match') {
        const userMatches = a.matches || {};
        hasAnswer = Object.keys(userMatches).length > 0;
        if (test.type === 'quiz') {
          const pairs = q.pairs || [];
          correct = pairs.length > 0 && pairs.every((p) => userMatches[p.id] === p.id);
          if (correct) score++;
        }
        if (hasAnswer) answered++;
        return { qid: q.id, selected: [], text: '', correct, matches: userMatches };
      }

      if (q.format === 'text') {
        hasAnswer = !!(a.text && a.text.trim());
      } else {
        hasAnswer = (a.selected || []).length > 0;
      }
      if (hasAnswer) answered++;

      if (test.type === 'quiz') {
        if (q.format === 'text') {
          correct = (a.text || '').trim().toLowerCase() === (q.correctText || '').trim().toLowerCase();
        } else {
          const correctIds = q.options.filter((o) => o.correct).map((o) => o.id).sort();
          const sel = [...(a.selected || [])].sort();
          correct = JSON.stringify(correctIds) === JSON.stringify(sel);
        }
        if (correct) score++;
      }
      return { qid: q.id, selected: a.selected || [], text: a.text || '', correct, matches: {} };
    });

    onSubmit({
      id: Date.now(),
      name: name.trim(),
      score,
      total: test.questions.length,
      answered,
      skipped: test.questions.length - answered,
      detailed,
      at: new Date().toLocaleString('ru-RU'),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onCancel} className="text-gray-600 text-sm flex items-center">
            <ChevronLeft className="w-5 h-5" /> Выйти
          </button>
          <span className="font-bold text-gray-800 truncate px-2">{test.title}</span>
          <span className="w-12" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {test.questions.map((q, idx) => {
          const a = answers[q.id] || {};
          return (
            <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-2 mb-3">
                <span className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="font-medium text-gray-800">{q.text || '(вопрос без текста)'}</p>
              </div>

              {q.image && (
                <img
                  src={q.image}
                  alt=""
                  className="w-full rounded-lg mb-3 max-h-48 object-cover bg-gray-100"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}

              {q.format === 'match' ? (
                <MatchTaking
                  question={q}
                  matches={a.matches || {}}
                  onMatch={(leftId, rightId) => {
                    const current = answers[q.id]?.matches || {};
                    const updated = { ...current };
                    // Снимаем если тот же правый элемент был сопоставлен другому левому
                    Object.keys(updated).forEach((key) => {
                      if (updated[key] === rightId) delete updated[key];
                    });
                    // Переключаем: повторный клик по тому же правому — снимает сопоставление
                    if (current[leftId] === rightId) {
                      delete updated[leftId];
                    } else {
                      updated[leftId] = rightId;
                    }
                    setAnswer(q.id, { matches: updated });
                  }}
                />
              ) : q.format === 'text' ? (
                <input
                  value={a.text || ''}
                  onChange={(e) => setAnswer(q.id, { text: e.target.value })}
                  placeholder="Ваш ответ..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              ) : (
                <div className="space-y-2">
                  {q.options.map((o) => {
                    const sel = (a.selected || []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        onClick={() => toggleOption(q, o.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition ${sel ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                      >
                        <div
                          className={`w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center ${q.format === 'single' ? 'rounded-full' : 'rounded-md'} ${sel ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}
                        >
                          {sel && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">{o.text || '(пусто)'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Отправить ответы
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ СОПОСТАВЛЕНИЕ (прохождение) ============ */

function MatchTaking({ question, matches, onMatch }) {
  const [activeLeftId, setActiveLeftId] = useState(null);

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Перемешиваем правые элементы один раз при монтировании
  const [shuffledRights] = useState(() => {
    const rights = (question.pairs || []).map((p) => ({
      id: p.id,
      text: p.rightText,
      image: p.rightImage,
    }));
    for (let i = rights.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rights[i], rights[j]] = [rights[j], rights[i]];
    }
    return rights;
  });

  // rightId → буква (A, B, C, ...)
  const rightLabel = {};
  shuffledRights.forEach((r, i) => { rightLabel[r.id] = LETTERS[i] || String(i + 1); });

  const matchedRightIds = new Set(Object.values(matches));

  const getMatchedRight = (leftId) => {
    const rightId = matches[leftId];
    return rightId != null ? shuffledRights.find((r) => r.id === rightId) : null;
  };

  const handleLeftClick = (leftId) => {
    setActiveLeftId((prev) => (prev === leftId ? null : leftId));
  };

  const handleRightClick = (rightId) => {
    if (activeLeftId == null) return;
    onMatch(activeLeftId, rightId);
    setActiveLeftId(null);
  };

  const pairs = question.pairs || [];
  const allMatched = pairs.length > 0 && pairs.every((p) => matches[p.id] != null);

  // Кто из левых сейчас активен — его порядковый номер
  const activeNum = activeLeftId != null ? pairs.findIndex((p) => p.id === activeLeftId) + 1 : null;

  return (
    <div>
      {/* Подсказка */}
      <div className={`text-xs text-center py-1.5 px-3 rounded-lg mb-3 font-medium ${
        activeLeftId != null
          ? 'bg-indigo-50 text-indigo-700'
          : allMatched
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-gray-50 text-gray-500'
      }`}>
        {activeLeftId != null
          ? `Выбрано: ${activeNum} — выберите букву в правом столбце`
          : allMatched
          ? 'Все элементы сопоставлены. Нажмите чтобы изменить.'
          : 'Нажмите цифру слева, затем букву справа'}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Левый столбец — цифры */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-indigo-600 text-center py-1 bg-indigo-50 rounded-md">
            Левый столбец
          </div>
          {pairs.map((pair, idx) => {
            const matched = getMatchedRight(pair.id);
            const isActive = activeLeftId === pair.id;
            const num = idx + 1;
            return (
              <button
                key={pair.id}
                onClick={() => handleLeftClick(pair.id)}
                className={`w-full p-2 rounded-lg border-2 text-left transition ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : matched
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-1.5">
                  {/* Порядковый номер */}
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    isActive ? 'bg-indigo-500 text-white' : matched ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {num}
                  </span>
                  <div className="flex-1 min-w-0">
                    {pair.leftImage && (
                      <img src={pair.leftImage} alt="" className="w-full rounded mb-1 max-h-20 object-cover bg-gray-100"
                        onError={(e) => (e.target.style.display = 'none')} />
                    )}
                    {pair.leftText && (
                      <span className="font-medium text-gray-800 text-xs leading-snug block">{pair.leftText}</span>
                    )}
                    {matched && (
                      <div className="mt-1 text-xs text-emerald-700 border-t border-emerald-200 pt-1 leading-snug flex items-center gap-1">
                        <span className="font-bold">→ {rightLabel[matched.id]}</span>
                        {matched.text && <span className="text-emerald-600">({matched.text})</span>}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Правый столбец — буквы */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-600 text-center py-1 bg-emerald-50 rounded-md">
            Правый столбец
          </div>
          {shuffledRights.map((right, idx) => {
            const label = LETTERS[idx] || String(idx + 1);
            const isUsed = matchedRightIds.has(right.id);
            const isSelectable = activeLeftId != null;
            return (
              <button
                key={right.id}
                onClick={() => handleRightClick(right.id)}
                className={`w-full p-2 rounded-lg border-2 text-left transition ${
                  isUsed
                    ? 'border-emerald-400 bg-emerald-50'
                    : isSelectable
                    ? 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-1.5">
                  {/* Буква */}
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    isUsed ? 'bg-emerald-500 text-white' : isSelectable ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {label}
                  </span>
                  <div className="flex-1 min-w-0">
                    {right.image && (
                      <img src={right.image} alt="" className="w-full rounded mb-1 max-h-20 object-cover bg-gray-100"
                        onError={(e) => (e.target.style.display = 'none')} />
                    )}
                    {right.text && (
                      <span className="font-medium text-gray-800 text-xs leading-snug block">{right.text}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ============ РЕЗУЛЬТАТЫ ============ */

function TestResults({ test, onBack, onDeleteSubmission }) {
  const subs = test.submissions;
  const [openSub, setOpenSub] = useState(null); // открытое прохождение (для разбора)

  // средний балл для теста с баллами
  const avgScore =
    test.type === 'quiz' && subs.length
      ? (subs.reduce((sum, s) => sum + s.score, 0) / subs.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-gray-600 text-sm flex items-center">
            <ChevronLeft className="w-5 h-5" /> Назад
          </button>
          <span className="font-bold text-gray-800">Результаты</span>
          <span className="w-12" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800">{test.title}</h2>
          <p className="text-sm text-gray-500">
            {TYPE_LABELS[test.type].label} · {test.questions.length} вопросов
          </p>

          {/* Сводные показатели */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{subs.length}</div>
              <div className="text-xs text-gray-500">
                {test.type === 'quiz' ? 'прохождений' : 'опрошено человек'}
              </div>
            </div>
            {test.type === 'quiz' && (
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {avgScore ?? '—'}
                  {avgScore && <span className="text-sm text-gray-400">/{test.questions.length}</span>}
                </div>
                <div className="text-xs text-gray-500">средний балл</div>
              </div>
            )}
          </div>
        </div>

        {subs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">
            <ListChecks className="w-10 h-10 mx-auto mb-2 opacity-50" />
            Пока никто не проходил тест
          </div>
        ) : (
          <>
            {/* Список прохождений */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                Прохождения
              </div>
              {subs.map((s) => (
                <div key={s.id} className="border-t border-gray-100">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.at}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {test.type === 'quiz' ? (
                          <span className="font-bold text-indigo-600">
                            {s.score}/{s.total}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">{s.answered} отв.</span>
                        )}
                        <div className="text-xs text-gray-400">пропущ.: {s.skipped}</div>
                      </div>
                      {/* Кнопка разбора — только для теста с баллами */}
                      {test.type === 'quiz' && (
                        <button
                          onClick={() => setOpenSub(openSub === s.id ? null : s.id)}
                          className="text-xs text-indigo-600 font-medium border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50"
                        >
                          {openSub === s.id ? 'Скрыть' : 'Разбор'}
                        </button>
                      )}
                      {/* Удалить только это прохождение */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить результат «${s.name}»? Сам тест останется.`)) {
                            onDeleteSubmission(s.id);
                          }
                        }}
                        className="text-gray-300 hover:text-red-500 p-1"
                        title="Удалить этот результат"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Развёрнутый разбор ответов */}
                  {test.type === 'quiz' && openSub === s.id && (
                    <div className="px-4 pb-3 space-y-3 bg-gray-50">
                      {test.questions.map((q, idx) => (
                        <AnswerReview key={q.id} q={q} idx={idx} detail={s.detailed.find((d) => d.qid === q.id)} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Аналитика по вопросам (для analytics/survey) */}
            {(test.type === 'analytics' || test.type === 'survey') && (
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  Сводка по ответам
                </div>
                {test.questions.map((q, idx) => (
                  <QuestionStats key={q.id} q={q} idx={idx} subs={subs} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AnswerReview({ q, idx, detail }) {
  if (!detail) return null;

  const isCorrect = detail.correct === true;
  const isWrong = detail.correct === false;

  const indicator = (
    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
      isCorrect ? 'bg-emerald-500' : isWrong ? 'bg-red-500' : 'bg-gray-300'
    }`}>
      {isCorrect ? <Check className="w-3 h-3 text-white" /> : isWrong ? <X className="w-3 h-3 text-white" /> : null}
    </span>
  );

  // ===== СОПОСТАВЛЕНИЕ =====
  if (q.format === 'match') {
    const userMatches = detail.matches || {};
    const pairs = q.pairs || [];
    const correctCount = pairs.filter((p) => userMatches[p.id] === p.id).length;
    return (
      <div className="bg-white rounded-lg p-3 border border-gray-100">
        <div className="flex items-start gap-2 mb-2">
          {indicator}
          <p className="text-sm font-medium text-gray-800">
            {idx + 1}. {q.text || '(вопрос без текста)'}
          </p>
        </div>
        <div className="ml-7 space-y-1">
          {pairs.map((pair) => {
            const userRightId = userMatches[pair.id];
            const matchedPair = pairs.find((p) => p.id === userRightId);
            const isPairOk = userRightId === pair.id;
            return (
              <div key={pair.id} className={`text-xs rounded-md px-2 py-1.5 ${
                isPairOk ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                <span className="font-medium">{pair.leftText || '🖼'}</span>
                {' → '}
                <span className="font-medium">
                  {matchedPair ? (matchedPair.rightText || '🖼') : '(не выбрано)'}
                </span>
                {!isPairOk && (
                  <span className="text-gray-400 ml-1">
                    (правильно: {pair.rightText || '🖼'})
                  </span>
                )}
              </div>
            );
          })}
          <div className="text-xs text-gray-500 mt-1">
            Верных пар: {correctCount} из {pairs.length}
          </div>
        </div>
      </div>
    );
  }

  // ===== ТЕКСТ / ВАРИАНТЫ =====
  let userAnswer;
  let correctAnswer;

  if (q.format === 'text') {
    userAnswer = detail.text?.trim() || '(пусто)';
    correctAnswer = q.correctText;
  } else {
    const selectedTexts = (q.options || [])
      .filter((o) => (detail.selected || []).includes(o.id))
      .map((o) => o.text || '(пусто)');
    userAnswer = selectedTexts.length ? selectedTexts.join(', ') : '(не отвечено)';
    correctAnswer = (q.options || [])
      .filter((o) => o.correct)
      .map((o) => o.text || '(пусто)')
      .join(', ');
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="flex items-start gap-2 mb-1">
        {indicator}
        <p className="text-sm font-medium text-gray-800">
          {idx + 1}. {q.text || '(вопрос без текста)'}
        </p>
      </div>
      <div className="ml-7 space-y-0.5 text-xs">
        <div className={isCorrect ? 'text-emerald-700' : 'text-red-700'}>
          Ответ: <span className="font-medium">{userAnswer}</span>
        </div>
        {isWrong && (
          <div className="text-gray-500">
            Правильно: <span className="font-medium text-emerald-700">{correctAnswer}</span>
          </div>
        )}
      </div>
    </div>
  );
}


function QuestionStats({ q, idx, subs }) {
  const total = subs.length;

  if (q.format === 'text') {
    const texts = subs
      .map((s) => s.detailed.find((d) => d.qid === q.id)?.text)
      .filter((t) => t && t.trim());
    return (
      <div>
        <p className="font-medium text-gray-800 text-sm mb-1">
          {idx + 1}. {q.text}
        </p>
        <div className="space-y-1">
          {texts.length === 0 ? (
            <p className="text-xs text-gray-400">Нет ответов</p>
          ) : (
            texts.map((t, i) => (
              <div key={i} className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                {t}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (q.format === 'match') {
    const pairs = q.pairs || [];
    return (
      <div>
        <p className="font-medium text-gray-800 text-sm mb-2">
          {idx + 1}. {q.text}
        </p>
        <div className="space-y-1.5">
          {pairs.map((pair) => {
            const count = subs.filter((s) => {
              const detail = s.detailed.find((d) => d.qid === q.id);
              return detail?.matches?.[pair.id] === pair.id;
            }).length;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={pair.id}>
                <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                  <span>{pair.leftText || '🖼'} → {pair.rightText || '🖼'}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="font-medium text-gray-800 text-sm mb-2">
        {idx + 1}. {q.text}
      </p>
      <div className="space-y-1.5">
        {(q.options || []).map((o) => {
          const count = subs.filter((s) =>
            s.detailed.find((d) => d.qid === q.id)?.selected?.includes(o.id)
          ).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={o.id}>
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span>{o.text || '(пусто)'}</span>
                <span>{count} ({pct}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function plural(n) {
  const forms = ['тест', 'теста', 'тестов'];
  const n100 = n % 100;
  const n10 = n % 10;
  if (n100 >= 11 && n100 <= 14) return forms[2];
  if (n10 === 1) return forms[0];
  if (n10 >= 2 && n10 <= 4) return forms[1];
  return forms[2];
}


/* ============ АВТОРИЗАЦИЯ ============ */

function AuthScreen({ onAuth }) {
  // mode: login | register | code | reset-email | reset-code
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(''); setInfo(''); };

  // --- Вход ---
  const doLogin = async () => {
    reset();
    if (!login.trim() || !password) { setError('Введите логин и пароль'); return; }
    setLoading(true);
    try {
      const data = await loginUser(login.trim(), password);
      onAuth(data);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // --- Регистрация: шаг 1 (отправить код) ---
  const doRegisterStart = async () => {
    reset();
    if (!email.trim() || !login.trim() || !password) {
      setError('Заполните все поля'); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Введите корректный адрес почты'); return;
    }
    if (login.trim().length < 3) {
      setError('Логин минимум 3 символа'); return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(login.trim())) {
      setError('Логин может содержать только латинские буквы, цифры и знак _'); return;
    }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true);
    try {
      await registerStart(email.trim(), login.trim(), password);
      setInfo('Код отправлен на почту');
      setMode('code');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // --- Регистрация: шаг 2 (подтвердить код) ---
  const doRegisterConfirm = async () => {
    reset();
    if (!code.trim()) { setError('Введите код из письма'); return; }
    setLoading(true);
    try {
      const data = await registerConfirm(email.trim(), code.trim());
      onAuth(data);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // --- Сброс: шаг 1 (отправить код) ---
  const doResetStart = async () => {
    reset();
    if (!email.trim()) { setError('Введите почту'); return; }
    setLoading(true);
    try {
      await resetStart(email.trim());
      setInfo('Если почта зарегистрирована, код отправлен');
      setMode('reset-code');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // --- Сброс: шаг 2 (новый пароль) ---
  const doResetConfirm = async () => {
    reset();
    if (!code.trim() || !newPassword) { setError('Введите код и новый пароль'); return; }
    if (newPassword.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true);
    try {
      const data = await resetConfirm(email.trim(), code.trim(), newPassword);
      onAuth(data);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // --- Напомнить логин ---
  const doForgotLogin = async () => {
    reset();
    if (!email.trim()) { setError('Введите почту'); return; }
    setLoading(true);
    try {
      await forgotLogin(email.trim());
      setInfo('Если почта зарегистрирована, логин отправлен на неё');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const inputCls =
    'w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Шапка */}
        <div className="flex flex-col items-center mb-5">
          <div className="bg-indigo-100 rounded-full p-4 mb-3">
            <ClipboardList className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Конструктор тестов</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            {mode === 'login' && 'Войдите в свой аккаунт'}
            {mode === 'register' && 'Создание аккаунта'}
            {mode === 'code' && 'Подтверждение почты'}
            {mode === 'reset-email' && 'Восстановление пароля'}
            {mode === 'reset-code' && 'Новый пароль'}
          </p>
        </div>

        {/* Сообщения */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {info && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" /> {info}
          </div>
        )}

        {/* ===== ВХОД ===== */}
        {mode === 'login' && (
          <>
            <div className="relative mb-3">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input value={login} onChange={(e) => setLogin(e.target.value)}
                placeholder="Логин или почта" className={inputCls} />
            </div>
            <div className="mb-1">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                autoComplete="current-password"
              />
            </div>
            <button onClick={() => { reset(); setMode('reset-email'); }}
              className="text-xs text-indigo-600 mb-4 block ml-auto mt-2">
              Забыли пароль или логин?
            </button>
            <button onClick={doLogin} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg mb-3">
              {loading ? 'Вход...' : 'Войти'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Нет аккаунта?{' '}
              <button onClick={() => { reset(); setMode('register'); }}
                className="text-indigo-600 font-medium">Зарегистрироваться</button>
            </p>
          </>
        )}

        {/* ===== РЕГИСТРАЦИЯ ===== */}
        {mode === 'register' && (
          <>
            <div className="relative mb-3">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Электронная почта" className={inputCls} />
            </div>
            <div className="relative mb-3">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input value={login} onChange={(e) => setLogin(e.target.value)}
                placeholder="Придумайте логин" className={inputCls} />
            </div>
            <div className="mb-4">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль (минимум 6 символов)"
                autoComplete="new-password"
              />
            </div>
            <button onClick={doRegisterStart} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg mb-3">
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
            <button onClick={() => {
              reset(); setMode('login');
            }}
              className="w-full text-gray-500 text-sm py-1 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Назад ко входу
            </button>
          </>
        )}

        {/* ===== ВВОД КОДА (регистрация) ===== */}
        {mode === 'code' && (
          <>
            <p className="text-sm text-gray-600 mb-3 text-center">
              Код отправлен на <b>{email}</b>. Введите его ниже.
            </p>
            <div className="relative mb-4">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="6-значный код" maxLength={6}
                className={inputCls + ' tracking-widest text-center'} />
            </div>
            <button onClick={doRegisterConfirm} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg mb-2">
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>
            <button onClick={doRegisterStart} disabled={loading}
              className="w-full text-indigo-600 text-sm py-1">
              Отправить код повторно
            </button>
            <button onClick={() => { reset(); setMode('register'); }}
              className="w-full text-gray-500 text-sm py-1 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>
          </>
        )}

        {/* ===== ВОССТАНОВЛЕНИЕ: ввод почты ===== */}
        {mode === 'reset-email' && (
          <>
            <p className="text-sm text-gray-600 mb-3 text-center">
              Введите почту — пришлём код для смены пароля.
            </p>
            <div className="relative mb-4">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Электронная почта" className={inputCls} />
            </div>
            <button onClick={doResetStart} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg mb-2">
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
            <button onClick={doForgotLogin} disabled={loading}
              className="w-full text-indigo-600 text-sm py-1">
              Забыли логин? Напомнить на почту
            </button>
            <button onClick={() => { reset(); setMode('login'); }}
              className="w-full text-gray-500 text-sm py-1 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Назад ко входу
            </button>
          </>
        )}

        {/* ===== ВОССТАНОВЛЕНИЕ: код + новый пароль ===== */}
        {mode === 'reset-code' && (
          <>
            <p className="text-sm text-gray-600 mb-3 text-center">
              Код отправлен на <b>{email}</b>. Введите код и новый пароль.
            </p>
            <div className="relative mb-3">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="Код из письма" maxLength={6}
                className={inputCls + ' tracking-widest text-center'} />
            </div>
            <div className="mb-4">
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Новый пароль (минимум 6 символов)"
                autoComplete="new-password"
              />
            </div>
            <button onClick={doResetConfirm} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg mb-2">
              {loading ? 'Сохранение...' : 'Сменить пароль и войти'}
            </button>
            <button onClick={() => { reset(); setMode('login'); }}
              className="w-full text-gray-500 text-sm py-1 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Назад ко входу
            </button>
          </>
        )}
      </div>
    </div>
  );
}


/* ============ ОКНО "ПОДЕЛИТЬСЯ" ============ */

function ShareModal({ test, onClose }) {
  const [copied, setCopied] = useState(false);

  // Ссылка на прохождение теста по коду
  const shareUrl = `${window.location.origin}/?code=${test.shareCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // запасной вариант, если clipboard недоступен
      window.prompt('Скопируйте ссылку вручную:', shareUrl);
    }
  };

  // Системное "Поделиться" (на телефоне откроет WhatsApp/Telegram и т.д.)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: test.title,
          text: `Пройдите тест: ${test.title}`,
          url: shareUrl,
        });
      } catch {
        // пользователь закрыл окно — ничего не делаем
      }
    } else {
      copyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Поделиться тестом</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-1">{test.title}</p>
        <p className="text-xs text-gray-400 mb-3">
          Код теста: <span className="font-mono font-bold">{test.shareCode}</span>
        </p>

        {/* Поле со ссылкой */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
          />
          <button
            onClick={copyLink} className="flex-shrink-0 text-indigo-600 hover:text-indigo-800"
            title="Скопировать"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Кнопки действий */}
        <button
          onClick={nativeShare}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg mb-2"
        >
          <Share2 className="w-4 h-4" /> Отправить ссылку
        </button>
        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg"
        >
          <Copy className="w-4 h-4" /> {copied ? 'Скопировано!' : 'Скопировать ссылку'}
        </button>
      </div>
    </div>
  );
}


/* ============ ПОЛЕ ПАРОЛЯ С ГЛАЗИКОМ ============ */

function PasswordInput({ value, onChange, placeholder = 'Пароль', autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
        title={show ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}

