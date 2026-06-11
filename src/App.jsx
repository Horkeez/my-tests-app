import React, { useState, useEffect } from 'react';
import {
  User, Plus, FileText, BarChart3, ClipboardList, Trash2,
  ChevronLeft, Image as ImageIcon, Check, X, CircleDot,
  CheckSquare, Type, Award, Eye, Send, ListChecks
} from 'lucide-react';
import { fetchTests, createTest, deleteTest, submitTest, updateTest, deleteSubmission } from './api';


// Типы тестов — объявлены в начале, доступны всем компонентам
const TYPE_LABELS = {
  quiz: { label: 'Тест с баллами', color: 'bg-indigo-100 text-indigo-700', icon: Award },
  survey: { label: 'Опрос / сбор данных', color: 'bg-emerald-100 text-emerald-700', icon: ClipboardList },
  analytics: { label: 'Аналитика', color: 'bg-amber-100 text-amber-700', icon: BarChart3 },
};


export default function TestApp() {
  const [screen, setScreen] = useState('login');
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null); // тест, который проходим/смотрим
  const [editingTest, setEditingTest] = useState(null); // тест, который редактируем (null = создание нового)
  const [loading, setLoading] = useState(false);


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


  // ----- ЭКРАН ВХОДА -----
  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-100 rounded-full p-4 mb-3">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Конструктор тестов</h1>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Создавайте тесты, опросы и анкеты
            </p>
          </div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Имя пользователя
          </label>
          <div className="relative mb-4">
            <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="например, teacher_fizika"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={async () => {
              if (usernameInput.trim()) {
                const name = usernameInput.trim();
                setUsername(name);
                await loadTests(name);
                setScreen('menu');
              }
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  // ----- ГЛАВНОЕ МЕНЮ -----
  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header username={username} />
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
        <Header username={username} />
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
                  onResults={() => { setActiveTest(t); setScreen('results'); }}
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
                />
              ))}
            </div>
          )}
        </div>
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
                    onClick={() => { setActiveTest(t); setScreen('results'); }}
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
        onBack={() => setScreen('resultslist')}
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

function Header({ username }) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 rounded-lg p-1.5">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="font-bold text-gray-800">Тесты</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <User className="w-4 h-4" />
          {username}
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

function TestListItem({ test, onTake, onResults, onEdit, onDelete }) {
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
    </div>
  );
}

/* ============ КОНСТРУКТОР ТЕСТА ============ */

function TestCreator({ username, editingTest, onCancel, onSave }) {
  const [title, setTitle] = useState(editingTest ? editingTest.title : '');
  const [type, setType] = useState(editingTest ? editingTest.type : 'quiz');
  const [questions, setQuestions] = useState(editingTest ? editingTest.questions : []);

  const addQuestion = (format) => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: '',
        image: '',
        format, // single | multiple | text
        options: format === 'text' ? [] : [
          { id: 1, text: '', correct: false },
          { id: 2, text: '', correct: false },
        ],
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

  const canSave = title.trim() && questions.length > 0;

  const handleSave = () => {
    onSave({
      owner: username,
      title: title.trim(),
      type,
      questions,
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
          />
        ))}

        {/* Добавить вопрос */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-2">Добавить вопрос</p>
          <div className="grid grid-cols-3 gap-2">
            <AddBtn icon={<CircleDot className="w-5 h-5" />} label="Один ответ" onClick={() => addQuestion('single')} />
            <AddBtn icon={<CheckSquare className="w-5 h-5" />} label="Несколько" onClick={() => addQuestion('multiple')} />
            <AddBtn icon={<Type className="w-5 h-5" />} label="Текст" onClick={() => addQuestion('text')} />
          </div>
        </div>
      </div>

      {/* Кнопка сохранить */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition"
          >
            {editingTest ? 'Сохранить изменения' : 'Сохранить тест'} {questions.length > 0 && `(${questions.length} вопр.)`}
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
};

function QuestionEditor({
  index, question, isQuiz, onUpdate, onRemove,
  onAddOption, onUpdateOption, onRemoveOption,
}) {
  const meta = FORMAT_LABELS[question.format];
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

      {/* Картинка (заглушка) */}
      <input
        value={question.image}
        onChange={(e) => onUpdate({ image: e.target.value })}
        placeholder="Ссылка на картинку (необязательно)"
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 mb-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      />

      {question.format === 'text' ? (
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
        <div className="space-y-2">
          {question.options.map((o) => (
            <div key={o.id} className="flex items-center gap-2">
              {isQuiz && (
                <button
                  onClick={() => onUpdateOption(o.id, { correct: !o.correct })}
                  className={`flex-shrink-0 w-6 h-6 rounded-${question.format === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center ${o.correct ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                    }`}
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
      const hasAnswer =
        q.format === 'text' ? !!(a.text && a.text.trim()) : (a.selected || []).length > 0;
      if (hasAnswer) answered++;

      let correct = null;
      if (test.type === 'quiz') {
        if (q.format === 'text') {
          correct = (a.text || '').trim().toLowerCase() === q.correctText.trim().toLowerCase();
        } else {
          const correctIds = q.options.filter((o) => o.correct).map((o) => o.id).sort();
          const sel = [...(a.selected || [])].sort();
          correct = JSON.stringify(correctIds) === JSON.stringify(sel);
        }
        if (correct) score++;
      }
      return { qid: q.id, selected: a.selected || [], text: a.text || '', correct };
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

              {q.format === 'text' ? (
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
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition ${sel ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                          }`}
                      >
                        <div
                          className={`w-5 h-5 flex-shrink-0 border-2 flex items-center justify-center ${q.format === 'single' ? 'rounded-full' : 'rounded-md'
                            } ${sel ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}
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

  // правильность вопроса
  const isCorrect = detail.correct === true;
  const isWrong = detail.correct === false;

  // что выбрал пользователь
  let userAnswer;
  let correctAnswer;

  if (q.format === 'text') {
    userAnswer = detail.text?.trim() || '(пусто)';
    correctAnswer = q.correctText;
  } else {
    const selectedTexts = q.options
      .filter((o) => detail.selected.includes(o.id))
      .map((o) => o.text || '(пусто)');
    userAnswer = selectedTexts.length ? selectedTexts.join(', ') : '(не отвечено)';
    correctAnswer = q.options
      .filter((o) => o.correct)
      .map((o) => o.text || '(пусто)')
      .join(', ');
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="flex items-start gap-2 mb-1">
        <span
          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isCorrect ? 'bg-emerald-500' : isWrong ? 'bg-red-500' : 'bg-gray-300'
            }`}
        >
          {isCorrect ? (
            <Check className="w-3 h-3 text-white" />
          ) : isWrong ? (
            <X className="w-3 h-3 text-white" />
          ) : null}
        </span>
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

  const total = subs.length;
  return (
    <div>
      <p className="font-medium text-gray-800 text-sm mb-2">
        {idx + 1}. {q.text}
      </p>
      <div className="space-y-1.5">
        {q.options.map((o) => {
          const count = subs.filter((s) =>
            s.detailed.find((d) => d.qid === q.id)?.selected.includes(o.id)
          ).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={o.id}>
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span>{o.text || '(пусто)'}</span>
                <span>{count} ({pct}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
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