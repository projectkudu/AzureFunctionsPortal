# Установка зависимостей

Прежде чем приступить к работе, [установите Visual Studio 2017](https://go.microsoft.com/fwlink/?linkid=2016389). Также у вас обязательно должна быть установлена рабочая нагрузка разработки Azure.

Установив Visual Studio, проверьте, что у вас [актуальная версия инструментов для Функций Azure](https://go.microsoft.com/fwlink/?linkid=2016394).

<br/>
# Создание проекта Функций Azure

В Visual Studio выберите **Создать** > **Проект** из меню **Файл**.

В диалоговом окне **Новый проект** выберите **Установлено**, разверните **Visual C#** > **Облако**, выберите **Функции Azure**, введите **Имя** проекта и нажмите кнопку **ОК**. Имя приложения-функции должно быть допустимым названием пространства имен C#, поэтому не используйте знаки подчеркивания, дефисы и прочие символы, не являющиеся буквенно-цифровыми.

Выберите и настройте шаблон, следуя указаниям мастера. Для начала рекомендуем использовать HTTP. Затем нажмите кнопку **ОК**, чтобы создать свою первую функцию.

<br/>
# Создание функции

По умолчанию при создании проекта создается функция HTTP, поэтому никаких действий для этого шага сейчас выполнять не нужно. Если вы захотите добавить новую функцию позже, щелкните проект правой кнопкой мыши в **Обозревателе решений** и выберите **Добавить** > **Новая функция Azure…**

Укажите имя функции и щелкните **Добавить**. Выберите и настройте шаблон, а затем нажмите кнопку **ОК**.

<br/>
# Запуск проекта функции в локальной среде

Нажмите клавишу **F5**, чтобы запустить приложение-функцию.

Среда выполнения выведет для всех HTTP-функций URL-адрес, который можно скопировать и открыть в адресной строке браузера.

Чтобы прервать отладку, нажмите клавиши **SHIFT+F5**.

<br/>
# Развертывание кода в Azure

Щелкните проект правой кнопкой мыши в **Обозревателе решений** и выберите **Опубликовать**.

В качестве назначения для публикации выберите приложение-функцию Azure и укажите **Выбрать существующий**. Затем щелкните **Опубликовать**.

Если вы еще не подключили Visual Studio к своей учетной записи Azure, выберите **Добавить учетную запись…** и следуйте указаниям на экране.

В разделе **Подписка** выберите {subscriptionName}. Найдите приложение-функцию {functionAppName} и выберите его в разделе ниже. Затем нажмите кнопку **ОК**.
