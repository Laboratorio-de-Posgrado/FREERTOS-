import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity, ArrowDown, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, Clock3, Code2, Cpu, Download, FileText, Gauge,
  GitBranch, House, Layers3, Lightbulb, ListChecks, Menu, Play, RotateCcw,
  Search, ShieldCheck, StepForward, Terminal, X,
} from 'lucide-react'

type Section = 'inicio' | 'manual' | 'conceptos' | 'flujo' | 'simulador' | 'codigo' | 'practicas' | 'evaluacion'
type TopicGroup = 'Arquitectura' | 'Tiempo' | 'Comunicación' | 'Hardware'

const navItems: { id: Section; label: string; icon: ReactNode }[] = [
  { id: 'inicio', label: 'Inicio', icon: <House size={16} /> },
  { id: 'manual', label: 'Mi manual', icon: <BookOpen size={16} /> },
  { id: 'conceptos', label: 'FreeRTOS', icon: <Layers3 size={16} /> },
  { id: 'flujo', label: 'Flujo del código', icon: <GitBranch size={16} /> },
  { id: 'simulador', label: 'Scheduler', icon: <Activity size={16} /> },
  { id: 'codigo', label: 'Código', icon: <Code2 size={16} /> },
  { id: 'practicas', label: 'Prácticas', icon: <ListChecks size={16} /> },
  { id: 'evaluacion', label: 'Repaso', icon: <CircleHelp size={16} /> },
]

const topics: {
  id: string; title: string; group: TopicGroup; short: string; explanation: string;
  use: string; code: string[]; caution: string;
}[] = [
  {
    id: 'tareas', title: 'Tareas (Tasks)', group: 'Arquitectura',
    short: 'Divide el firmware en actividades independientes.',
    explanation: 'Una tarea es una función que FreeRTOS puede planificar. Cada tarea mantiene su propio contexto y pila; normalmente contiene un bucle y se bloquea o espera cuando no tiene trabajo.',
    use: 'Separar, por ejemplo, la lectura de un sensor, la actualización de una pantalla y el control de un actuador.',
    code: ['void tareaSensor(void *arg) {', '  for (;;) {', '    leerSensor();', '    vTaskDelay(pdMS_TO_TICKS(100));', '  }', '}'],
    caution: 'Una tarea no es un hilo ilimitado: su pila ocupa RAM y el tiempo de CPU debe repartirse con las demás.'
  },
  {
    id: 'estados', title: 'Estados de una tarea', group: 'Arquitectura',
    short: 'Ready, Running, Blocked y Suspended describen qué puede ejecutar.',
    explanation: 'Ready (lista) significa que puede usar CPU; Running (en ejecución), que está usando un núcleo; Blocked (bloqueada), que espera tiempo o un evento; Suspended (suspendida), que fue apartada explícitamente hasta reanudarla.',
    use: 'Seguir por qué una tarea no ejecuta: quizá espera una cola, un semáforo o el vencimiento de un retardo.',
    code: ['vTaskDelay(pdMS_TO_TICKS(250)); // pasa a Blocked', 'xQueueReceive(cola, &dato, portMAX_DELAY);', '// espera hasta recibir un elemento'],
    caution: 'Blocked y Suspended no son sinónimos: una tarea bloqueada puede volver a Ready cuando se cumple su condición.'
  },
  {
    id: 'scheduler', title: 'Scheduler (planificador)', group: 'Arquitectura',
    short: 'Elige una tarea lista para usar cada núcleo.',
    explanation: 'El Scheduler cambia entre tareas listas y aplica las reglas de prioridad y configuración del port. En planificación apropiativa, una tarea de mayor prioridad que queda lista puede desplazar a otra de menor prioridad.',
    use: 'Entender qué ocurre cuando llega un dato, termina un retardo o se libera un semáforo.',
    code: ['vTaskStartScheduler(); // en FreeRTOS sin framework', '// En Arduino-ESP32 el framework administra', '// el planificador; normalmente no se llama aquí.'],
    caution: 'El simulador de esta página es un modelo didáctico. La afinidad a núcleos y el comportamiento exacto dependen del chip y de ESP-IDF.'
  },
  {
    id: 'prioridades', title: 'Prioridades', group: 'Arquitectura',
    short: 'Afectan quién recibe CPU cuando varias tareas están listas.',
    explanation: 'Un valor mayor representa más prioridad en la configuración habitual. La prioridad no acelera una tarea: cambia su preferencia de ejecución frente a otras listas.',
    use: 'Dar atención preferente a una tarea de control con plazo corto y mantener tareas de registro o interfaz con menor prioridad.',
    code: ['xTaskCreate(tareaControl, "Control", 3072,', '            NULL, 4, NULL); // prioridad 4', 'xTaskCreate(tareaLed, "LED", 2048,', '            NULL, 1, NULL); // prioridad 1'],
    caution: 'Evita dejar una tarea de alta prioridad en un bucle sin bloqueo: puede impedir que otras tareas tengan CPU.'
  },
  {
    id: 'retardos', title: 'Retardos y periodicidad', group: 'Tiempo',
    short: 'Cede la CPU mientras la tarea espera.',
    explanation: 'vTaskDelay bloquea la tarea llamante durante un número de ticks. pdMS_TO_TICKS convierte milisegundos a ticks. Para mantener un periodo estable suele usarse xTaskDelayUntil.',
    use: 'Tomar una lectura cada 100 ms sin ocupar el procesador durante la espera.',
    code: ['vTaskDelay(pdMS_TO_TICKS(100));', '// Para periodos regulares:', 'xTaskDelayUntil(&despertar, periodo);'],
    caution: 'El retardo no es una garantía de tiempo exacta: depende de la frecuencia de tick, la carga y el planificador.'
  },
  {
    id: 'colas', title: 'Colas (Queues)', group: 'Comunicación',
    short: 'Pasan datos entre tareas con espera sincronizada.',
    explanation: 'Una cola guarda elementos por valor y permite que una tarea productora envíe datos mientras otra los recibe. Las operaciones pueden bloquearse hasta que haya espacio o un dato disponible.',
    use: 'Enviar mediciones desde una tarea de sensor a una tarea que las muestra o transmite por Wi-Fi.',
    code: ['QueueHandle_t cola;', 'cola = xQueueCreate(8, sizeof(float));', 'xQueueSend(cola, &medicion, 0);', 'xQueueReceive(cola, &medicion, portMAX_DELAY);'],
    caution: 'Comprueba que la cola se creó y maneja el resultado de envío/recepción cuando la cola puede llenarse.'
  },
  {
    id: 'semaforos', title: 'Semáforos', group: 'Comunicación',
    short: 'Sincronizan tareas con eventos o recursos.',
    explanation: 'Un semáforo binario suele señalar un evento; uno contador representa varias unidades disponibles. No lleva datos: para transferir datos, considera una cola.',
    use: 'Despertar una tarea cuando ocurre un evento externo o cuando termina una operación.',
    code: ['SemaphoreHandle_t evento = xSemaphoreCreateBinary();', 'xSemaphoreGive(evento);', 'xSemaphoreTake(evento, portMAX_DELAY);'],
    caution: 'No uses un semáforo binario como protección de una sección crítica compartida; para eso normalmente corresponde un mutex.'
  },
  {
    id: 'mutex', title: 'Mutex y recursos compartidos', group: 'Comunicación',
    short: 'Protege el acceso a un recurso usado por varias tareas.',
    explanation: 'Un mutex permite que solo una tarea a la vez use un recurso compartido, como un bus o una estructura. FreeRTOS puede aplicar herencia de prioridad para reducir inversión de prioridad.',
    use: 'Evitar que dos tareas escriban al mismo tiempo por una interfaz serial o actualicen una estructura común.',
    code: ['SemaphoreHandle_t mutex = xSemaphoreCreateMutex();', 'if (xSemaphoreTake(mutex, timeout) == pdTRUE) {', '  usarRecursoCompartido();', '  xSemaphoreGive(mutex);', '}'],
    caution: 'Mantén la sección protegida breve y libera el mutex en todos los caminos de ejecución.'
  },
  {
    id: 'eventos', title: 'Grupos de eventos', group: 'Comunicación',
    short: 'Representan varios eventos con bits.',
    explanation: 'Un Event Group mantiene un conjunto de bits. Una tarea puede esperar uno o varios bits y, según la configuración, limpiar los bits cuando se cumplen.',
    use: 'Esperar a que la red esté conectada y el sensor se haya inicializado antes de iniciar una tarea.',
    code: ['EventGroupHandle_t eventos = xEventGroupCreate();', 'xEventGroupSetBits(eventos, WIFI_LISTO);', 'xEventGroupWaitBits(eventos, WIFI_LISTO,', '  pdTRUE, pdFALSE, portMAX_DELAY);'],
    caution: 'Define qué tarea pone y limpia cada bit para evitar perder la condición que otras tareas esperan.'
  },
  {
    id: 'notificaciones', title: 'Notificaciones de tarea', group: 'Comunicación',
    short: 'Señalización ligera dirigida a una tarea.',
    explanation: 'Las notificaciones directas pueden despertar una tarea concreta y transportar un valor de 32 bits. Son eficientes cuando el destino es una sola tarea.',
    use: 'Avisar a una tarea procesadora de que una operación terminó o de que llegaron datos.',
    code: ['xTaskNotifyGive(tareaDestino);', 'ulTaskNotifyTake(pdTRUE, portMAX_DELAY);'],
    caution: 'Elige una cola o grupo de eventos si necesitas entregar varios elementos o coordinar a varios receptores.'
  },
  {
    id: 'temporizadores', title: 'Temporizadores de software', group: 'Tiempo',
    short: 'Ejecutan una función de devolución de llamada al vencer.',
    explanation: 'Los timers de software ofrecen alarmas de una sola ejecución o periódicas sin crear una tarea dedicada por cada temporizador.',
    use: 'Programar un aviso periódico o una acción que debe ocurrir después de un intervalo.',
    code: ['TimerHandle_t timer = xTimerCreate(', '  "Aviso", pdMS_TO_TICKS(1000), pdTRUE,', '  NULL, callbackTimer);', 'xTimerStart(timer, 0);'],
    caution: 'La callback se ejecuta desde la tarea de servicio de timers: debe ser corta y no bloquearse.'
  },
  {
    id: 'isr', title: 'Interrupciones (ISR)', group: 'Hardware',
    short: 'Responden a eventos de hardware con trabajo mínimo.',
    explanation: 'Una ISR atiende rápidamente el evento y puede notificar una tarea para que haga el trabajo más largo. Desde una ISR se deben usar las variantes de API terminadas en FromISR cuando corresponda.',
    use: 'Detectar un flanco de botón o una señal de periférico y procesar el evento fuera de la interrupción.',
    code: ['BaseType_t despertar = pdFALSE;', 'vTaskNotifyGiveFromISR(tarea, &despertar);', 'portYIELD_FROM_ISR(despertar);'],
    caution: 'No bloquees ni hagas operaciones largas dentro de una ISR. Verifica las reglas del periférico y del puerto utilizado.'
  },
  {
    id: 'memoria', title: 'Pila y memoria', group: 'Hardware',
    short: 'Cada tarea necesita espacio para sus variables y llamadas.',
    explanation: 'La pila de una tarea guarda variables locales, llamadas anidadas y contexto. FreeRTOS ofrece métricas para revisar margen de pila y opciones para crear tareas de forma dinámica o estática.',
    use: 'Investigar reinicios, corrupción de memoria o fallos intermitentes al aumentar el trabajo de una tarea.',
    code: ['UBaseType_t margen = uxTaskGetStackHighWaterMark(NULL);', '// Revisa el margen bajo la carga más exigente.'],
    caution: 'La unidad del tamaño de pila depende del port. En ESP-IDF suele expresarse en bytes; revisa la versión concreta de Arduino-ESP32/ESP-IDF.'
  },
  {
    id: 'nucleos', title: 'Núcleos y ESP32', group: 'Hardware',
    short: 'El hardware y la afinidad cambian el comportamiento.',
    explanation: 'Algunas variantes ESP32 tienen dos núcleos y otras, como ESP32-C6, son de un núcleo. En chips multinúcleo se puede fijar una tarea a un núcleo, aunque eso no siempre mejora el sistema.',
    use: 'Analizar carga de CPU, latencia y convivencia con tareas del framework Wi-Fi o Bluetooth.',
    code: ['xTaskCreatePinnedToCore(tarea, "Tarea",', '  4096, NULL, 2, NULL, nucleo);'],
    caution: 'No supongas que ESP32 y ESP32-C6 tienen la misma cantidad de núcleos ni la misma configuración de FreeRTOS.'
  },
]

const manualSections = [
  { title: 'ESP32 y Arduino IDE', pages: 'PDF · páginas 3–7', status: 'En el PDF', text: 'Presenta el entorno Arduino IDE, la familia ESP32, su conectividad y el uso del IDE para cargar programas.' },
  { title: 'Del super loop al RTOS', pages: 'PDF · páginas 8–14', status: 'En el PDF', text: 'Explica las limitaciones de un bucle secuencial con esperas largas, el concepto de RTOS y por qué es útil en un sistema embebido.' },
  { title: 'Tareas, Scheduler y prioridades', pages: 'PDF · páginas 15–18', status: 'En el PDF', text: 'Introduce las tareas y sus estados, el planificador preventivo y cómo interpretar las prioridades.' },
  { title: 'Multitarea apropiativa', pages: 'PDF · páginas 19–21', status: 'En el PDF', text: 'Describe el cambio entre tareas y el ejemplo de una tarea de sensor que desplaza una tarea de pantalla.' },
  { title: 'Preparación de Arduino IDE', pages: 'Anunciado en el índice', status: 'Por completar', text: 'El índice del manual menciona este apartado; el desarrollo no está en la copia PDF adjunta.' },
  { title: 'Entradas y salidas digitales', pages: 'Anunciado en el índice', status: 'Por completar', text: 'El índice también anuncia manejo de GPIO. Esta versión interactiva lo organiza como práctica sugerida para integrar cuando esté listo el capítulo.' },
]

const practices = [
  { id: 'blink', level: 'Inicial', title: 'LED sin bloquear el loop', text: 'Crear una tarea periódica que cambie el estado de un LED usando vTaskDelay.', learn: 'Task, xTaskCreate, GPIO, retardo y estado Blocked.', parts: 'Placa ESP32, LED integrado o externo con resistencia y cable USB.' },
  { id: 'sensor', level: 'Inicial', title: 'Lectura periódica de sensor', text: 'Tomar una lectura cada 100 ms y enviar el resultado a otra tarea.', learn: 'Tareas separadas, periodo y cola.', parts: 'ESP32 y un sensor disponible en el laboratorio.' },
  { id: 'button', level: 'Intermedia', title: 'Botón como evento', text: 'Detectar el botón con una ISR corta y despertar una tarea mediante un semáforo o notificación.', learn: 'Interrupciones, API FromISR y sincronización.', parts: 'Botón con resistencia pull-up/pull-down o entrada equivalente.' },
  { id: 'mutex', level: 'Intermedia', title: 'Recurso compartido protegido', text: 'Dos tareas escriben en un mismo recurso protegido para evitar intercalado de operaciones.', learn: 'Mutex, sección crítica y acceso concurrente.', parts: 'ESP32 y un recurso compartido, como Serial o una estructura.' },
  { id: 'review', level: 'Extensión', title: 'Comparar ESP32 y ESP32-C6', text: 'Medir el comportamiento del ejemplo en las placas disponibles y documentar núcleos, GPIO y versiones del core.', learn: 'Configuración de placa, afinidad y límites del modelo.', parts: 'Una o ambas placas; anotar versión de Arduino-ESP32.' },
]

const flowSteps = [
  { title: 'El framework llama setup()', text: 'Arduino ejecuta setup() una vez al iniciar la aplicación. En Arduino-ESP32, el framework ya está integrado con FreeRTOS.', lines: [13, 14] },
  { title: 'Se crea TaskLED', text: 'xTaskCreate registra la función, nombre, tamaño de pila, parámetro y prioridad. La nueva tarea queda lista para ejecutarse.', lines: [15, 16, 17, 18, 19, 20, 21, 22] },
  { title: 'El planificador selecciona la tarea', text: 'Cuando TaskLED es elegible, el Scheduler la despacha. La función prepara el GPIO y entra en su bucle.', lines: [3, 4, 5, 6] },
  { title: 'La tarea enciende el LED', text: 'digitalWrite escribe el nivel alto en el pin elegido. El número de GPIO depende de la placa y del cableado.', lines: [7] },
  { title: 'vTaskDelay libera la CPU', text: 'La tarea queda bloqueada durante los ticks solicitados. Otra tarea lista puede ejecutarse; si no hay ninguna, corre el idle task.', lines: [8] },
  { title: 'Despierta y repite el ciclo', text: 'Al vencer el retardo, TaskLED vuelve a la lista de tareas Ready, apaga el LED y repite el patrón.', lines: [9, 10, 11, 12] },
]

const codeLines = [
  'const int LED_PIN = 2;',
  '',
  'void TaskLED(void *pvParameters) {',
  '  pinMode(LED_PIN, OUTPUT);',
  '',
  '  for (;;) {',
  '    digitalWrite(LED_PIN, HIGH);',
  '    vTaskDelay(pdMS_TO_TICKS(500));',
  '    digitalWrite(LED_PIN, LOW);',
  '    vTaskDelay(pdMS_TO_TICKS(500));',
  '  }',
  '}',
  '',
  'void setup() {',
  '  xTaskCreate(',
  '    TaskLED,',
  '    "TaskLED",',
  '    2048,  // tamaño de pila: confirmar unidad del port',
  '    NULL,',
  '    1,     // prioridad',
  '    NULL',
  '  );',
  '}',
  '',
  'void loop() {',
  '  // Arduino-ESP32 ejecuta loop() en una tarea del framework.',
  '}',
]

const quizzes = [
  { question: '¿Qué ocurre cuando una tarea llama vTaskDelay()?', options: ['Se elimina del sistema', 'Queda bloqueada y cede la CPU', 'Aumenta su prioridad', 'Reinicia el Scheduler'], correct: 1, why: 'La tarea que llama espera el número de ticks indicado y no compite por CPU mientras está bloqueada.' },
  { question: '¿Qué permite una cola de FreeRTOS?', options: ['Cambiar el pin del LED', 'Transferir datos entre tareas', 'Aumentar la frecuencia del CPU', 'Evitar crear tareas'], correct: 1, why: 'Las colas transfieren elementos entre tareas y pueden sincronizar productor y consumidor.' },
  { question: '¿Qué debe hacer una ISR con trabajo que puede tardar?', options: ['Imprimir todo por Serial', 'Llamar vTaskDelay()', 'Avisar a una tarea y terminar rápido', 'Crear muchas tareas'], correct: 2, why: 'La interrupción debe ser breve; una tarea puede continuar el procesamiento con una API FromISR.' },
  { question: 'Una tarea de prioridad alta está bloqueada. ¿Puede ejecutar otra tarea lista?', options: ['No, nunca', 'Sí, porque la tarea alta no está lista', 'Solo si tienen el mismo nombre', 'Solo después de reiniciar'], correct: 1, why: 'El Scheduler considera estados además de prioridades; una tarea bloqueada no puede usar la CPU.' },
]

function App() {
  const [section, setSection] = useState<Section>('inicio')
  const [board, setBoard] = useState('ESP32')
  const [topicId, setTopicId] = useState('tareas')
  const [topicGroup, setTopicGroup] = useState<TopicGroup | 'Todos'>('Todos')
  const [search, setSearch] = useState('')
  const [flowStep, setFlowStep] = useState(0)
  const [priorities, setPriorities] = useState({ LED: 1, Sensor: 3 })
  const [simTime, setSimTime] = useState(0)
  const [simLast, setSimLast] = useState('Aún no iniciado')
  const [simTasks, setSimTasks] = useState([
    { name: 'TaskLED', key: 'LED', state: 'READY', wakeAt: 0, period: 500 },
    { name: 'TaskSensor', key: 'Sensor', state: 'READY', wakeAt: 0, period: 300 },
  ])
  const [practiceDone, setPracticeDone] = useState<string[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [completedTopics, setCompletedTopics] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('freertos-topics-done') || '[]') as string[] } catch { return [] }
  })
  const selectedTopic = topics.find(topic => topic.id === topicId) ?? topics[0]
  const visibleTopics = useMemo(() => topics.filter(topic => {
    const matchesGroup = topicGroup === 'Todos' || topic.group === topicGroup
    const query = search.trim().toLocaleLowerCase('es')
    const matchesQuery = !query || (topic.title + ' ' + topic.short + ' ' + topic.explanation).toLocaleLowerCase('es').includes(query)
    return matchesGroup && matchesQuery
  }), [topicGroup, search])
  const pageTitle = navItems.find(item => item.id === section)?.label ?? 'Inicio'
  const displayedTopic = visibleTopics.find(topic => topic.id === topicId) ?? visibleTopics[0] ?? selectedTopic
  const progress = Math.round(completedTopics.length / topics.length * 100)
  const groups: (TopicGroup | 'Todos')[] = ['Todos', 'Arquitectura', 'Tiempo', 'Comunicación', 'Hardware']

  function changeSection(next: Section) {
    setSection(next)
    setMenuOpen(false)
  }

  function markTopicDone(id: string) {
    const next = completedTopics.includes(id) ? completedTopics.filter(item => item !== id) : [...completedTopics, id]
    setCompletedTopics(next)
    localStorage.setItem('freertos-topics-done', JSON.stringify(next))
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeLines.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch { setCopied(false) }
  }

  function advanceSimulation() {
    const now = simTime + 100
    const next = simTasks.map(task => task.state === 'BLOCKED' && task.wakeAt <= now ? { ...task, state: 'READY' } : { ...task })
    const ready = next.filter(task => task.state === 'READY').sort((a, b) => {
      const diff = priorities[b.key as keyof typeof priorities] - priorities[a.key as keyof typeof priorities]
      if (diff !== 0) return diff
      if (simLast === a.name) return 1
      if (simLast === b.name) return -1
      return 0
    })
    if (ready.length === 0) {
      setSimTime(now)
      setSimTasks(next)
      setSimLast('CPU en reposo')
      return
    }
    const selected = ready[0]
    const at = next.findIndex(task => task.name === selected.name)
    next[at] = { ...next[at], state: 'BLOCKED', wakeAt: now + next[at].period }
    setSimTime(now)
    setSimTasks(next)
    setSimLast(selected.name)
  }

  function resetSimulation() {
    setSimTime(0)
    setSimLast('Aún no iniciado')
    setSimTasks([
      { name: 'TaskLED', key: 'LED', state: 'READY', wakeAt: 0, period: 500 },
      { name: 'TaskSensor', key: 'Sensor', state: 'READY', wakeAt: 0, period: 300 },
    ])
  }

  const isActive = (line: number) => flowSteps[flowStep].lines.includes(line)

  return <div className="app-shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand">
        <div className="brand-icon"><Cpu size={23} /></div>
        <div><strong>FreeRTOS <span>Lab</span></strong><small>ESP32 · GUÍA INTERACTIVA</small></div>
        <button className="mobile-close" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}><X size={17} /></button>
      </div>
      <div className="side-label">APRENDER</div>
      <nav>{navItems.map(item => <button key={item.id} className={section === item.id ? 'nav-item active' : 'nav-item'} onClick={() => changeSection(item.id)}>{item.icon}<span>{item.label}</span>{section === item.id && <ChevronRight size={15} className="nav-chevron" />}</button>)}</nav>
      <div className="progress-card"><div className="progress-top"><span>Tu avance</span><b>{progress}%</b></div><div className="progress-bar"><span style={{ width: progress + '%' }} /></div><small>{completedTopics.length} de {topics.length} conceptos repasados</small></div>
      <div className="sidebar-bottom"><span className="online-dot" /> Manual de ESP32 en desarrollo <span className="version">v0.2</span></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
        <div className="breadcrumb">LABORATORIO <span>/</span> <b>{pageTitle.toUpperCase()}</b></div>
        <div className="board-picker"><span>PLACA</span><select value={board} onChange={event => setBoard(event.target.value)}><option>ESP32</option><option>ESP32-C6</option></select><span className="status-dot" /></div>
      </header>

      {section === 'inicio' && <div className="content">
        <div className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse" /> RUTA INTERACTIVA · ESP32 + FREERTOS</div>
            <h1>Entiende qué hace tu código, <em>paso a paso.</em></h1>
            <p>Explora las ideas de tu manual, sigue una tarea desde setup() hasta el Scheduler y practica con ejemplos interactivos.</p>
            <div className="hero-actions"><button className="primary-btn" onClick={() => changeSection('flujo')}>Ver flujo del código <ArrowRight size={16} /></button><button className="secondary-btn" onClick={() => changeSection('manual')}><BookOpen size={16} /> Explorar mi manual</button></div>
          </div>
          <div className="hero-art" aria-hidden="true"><div className="hero-circuit"/><div className="chip-illustration"><Cpu size={65} strokeWidth={1.1} /><span>ESP32</span></div><div className="float-tag tag-top">TASK READY</div><div className="float-tag tag-bottom">SCHEDULER</div></div>
        </div>
        <div className="welcome-row"><div><div className="eyebrow">UNA RUTA PARA APRENDER HACIENDO</div><h2>¿Por dónde empezamos?</h2></div><button className="text-link" onClick={() => changeSection('conceptos')}>Ver todos los temas <ArrowRight size={14} /></button></div>
        <div className="start-grid">
          <button className="start-card" onClick={() => changeSection('manual')}><div className="card-icon"><BookOpen size={19} /></div><span className="step-label">01 · TU MATERIAL</span><h3>Integra tu manual</h3><p>Recorre el contenido que ya aparece en el PDF y detecta los capítulos por completar.</p><span className="card-link">Abrir manual <ArrowRight size={14} /></span></button>
          <button className="start-card" onClick={() => changeSection('conceptos')}><div className="card-icon"><Layers3 size={19} /></div><span className="step-label">02 · CONCEPTOS CLAVE</span><h3>Explora FreeRTOS</h3><p>Tareas, estados, prioridades, colas, mutex, interrupciones y más.</p><span className="card-link">Explorar conceptos <ArrowRight size={14} /></span></button>
          <button className="start-card" onClick={() => changeSection('simulador')}><div className="card-icon"><Activity size={19} /></div><span className="step-label">03 · LABORATORIO</span><h3>Prueba el Scheduler</h3><p>Cambia prioridades y observa cuándo las tareas están listas o bloqueadas.</p><span className="card-link">Iniciar simulador <ArrowRight size={14} /></span></button>
        </div>
        <div className="home-lower">
          <section className="panel route-panel"><div className="panel-heading"><div><div className="eyebrow">EL RECORRIDO DEL PROGRAMA</div><h2>De una línea a una tarea</h2></div><button className="icon-button" aria-label="Ver flujo" onClick={() => changeSection('flujo')}><ArrowRight size={17} /></button></div><div className="mini-flow"><span>setup()</span><i/><span>xTaskCreate()</span><i/><span>Ready</span><i/><span>Running</span><i/><span>Blocked</span></div><p>El retardo suspende la tarea temporalmente y deja que otras tareas listas usen la CPU.</p></section>
          <section className="manual-callout"><div className="callout-icon"><FileText size={19} /></div><div><div className="eyebrow">MATERIAL EN DESARROLLO</div><h3>Tu PDF ya es parte de la ruta</h3><p>La plataforma integra su introducción a FreeRTOS y marca lo que falta para completar los capítulos prácticos.</p><button className="text-link" onClick={() => changeSection('manual')}>Ver el contenido incluido <ArrowRight size={14} /></button></div></section>
        </div>
        <div className="bottom-note"><Lightbulb size={18} /><p><b>Una aclaración:</b> el simulador explica conceptos; no compila ni ejecuta código en la placa. Antes de cargar un ejemplo, confirma el GPIO, la placa y la versión del core.</p></div>
      </div>}

      {section === 'manual' && <div className="content narrow">
        <div className="eyebrow">CONTENIDO DEL BORRADOR · ESP32 + ARDUINO IDE</div>
        <div className="manual-hero"><div><h1 className="page-title">Tu manual, dentro del laboratorio.</h1><p className="page-lead">La guía combina los temas que aparecen en la copia adjunta con espacios para completar y prácticas interactivas sugeridas.</p></div><a className="secondary-btn" href="/manual/Manual-Practicas-ESP32-borrador.pdf" target="_blank" rel="noreferrer"><Download size={15} /> Abrir PDF borrador</a></div>
        <div className="source-strip"><div className="source-icon"><FileText size={19} /></div><div><b>Instituto Tecnológico de Oaxaca · Noviembre 2026</b><span>Se conserva el PDF original del manual como material de referencia descargable.</span></div><span className="draft-pill">BORRADOR</span></div>
        <div className="section-heading"><div><div className="eyebrow">MAPA DEL DOCUMENTO</div><h2>Lo que contiene la copia adjunta</h2></div><span className="muted">22 páginas</span></div>
        <div className="manual-list">{manualSections.map((item, index) => <article className="manual-item" key={item.title}><div className="manual-number">{String(index + 1).padStart(2, '0')}</div><div className="manual-text"><div className="manual-meta"><span>{item.pages}</span><span className={item.status === 'En el PDF' ? 'included-pill' : 'pending-pill'}>{item.status}</span></div><h3>{item.title}</h3><p>{item.text}</p></div>{item.status === 'En el PDF' ? <CheckCircle2 className="manual-check" size={18} /> : <Clock3 className="manual-pending-icon" size={18} />}</article>)}</div>
        <div className="notice"><Lightbulb size={18} /><p><b>Para mantener el contenido fiel al borrador:</b> el PDF adjunto tiene 22 páginas. Su índice anuncia instalación de Arduino IDE y manejo de entradas/salidas digitales, pero esos capítulos no aparecen desarrollados en esta copia. Aquí se identifican como pendientes y las prácticas se presentan como propuestas para integrar después.</p></div>
        <section className="reference-card"><div><div className="eyebrow">PARA PROFUNDIZAR</div><h3>Documentación técnica oficial</h3><p>Consulta los detalles de FreeRTOS y las diferencias específicas de cada variante ESP32.</p></div><div className="reference-links"><a href="https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/freertos.html" target="_blank" rel="noreferrer">FreeRTOS en ESP-IDF <ArrowRight size={13} /></a><a href="https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/performance/ram-usage.html" target="_blank" rel="noreferrer">Pila y uso de RAM <ArrowRight size={13} /></a><a href="https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c6/product-overview.html" target="_blank" rel="noreferrer">Ficha del ESP32-C6 <ArrowRight size={13} /></a></div></section>
        <div className="manual-next"><div><span className="eyebrow">SIGUIENTE PASO</span><h3>Explora los conceptos con ejemplos</h3><p>El complemento web amplía el manual con temas de FreeRTOS y notas prácticas para ESP32.</p></div><button className="primary-btn" onClick={() => changeSection('conceptos')}>Abrir conceptos <ArrowRight size={15} /></button></div>
      </div>}

      {section === 'conceptos' && <div className="content narrow">
        <div className="eyebrow">GUÍA DE REFERENCIA · FREERTOS</div><h1 className="page-title">Los bloques de <em>FreeRTOS.</em></h1><p className="page-lead">Consulta las piezas habituales de un sistema multitarea y cuándo conviene usarlas. Filtra por tema o busca un término.</p>
        <div className="topic-toolbar"><div className="search-field"><Search size={16} /><input aria-label="Buscar concepto" placeholder="Buscar tareas, colas, ISR…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="group-filters">{groups.map(group => <button key={group} className={topicGroup === group ? 'filter-chip selected' : 'filter-chip'} onClick={() => setTopicGroup(group)}>{group}</button>)}</div></div>
        <div className="topic-layout"><div className="topic-list">{visibleTopics.map(topic => <button key={topic.id} className={topicId === topic.id ? 'topic-item selected' : 'topic-item'} onClick={() => setTopicId(topic.id)}><span className="topic-symbol">{topic.group === 'Arquitectura' ? <Layers3 size={16} /> : topic.group === 'Tiempo' ? <Clock3 size={16} /> : topic.group === 'Comunicación' ? <Activity size={16} /> : <Cpu size={16} />}</span><span className="topic-label"><b>{topic.title}</b><small>{topic.group}</small></span>{completedTopics.includes(topic.id) && <Check size={15} className="done-mark" />}<ChevronRight size={14} className="topic-chevron" /></button>)}{visibleTopics.length === 0 && <div className="empty-state">No encontré temas con esa búsqueda.</div>}</div>
          <article className="topic-detail"><div className="topic-detail-top"><span className="topic-kicker">{displayedTopic.group.toUpperCase()} · CONCEPTO</span><button className={completedTopics.includes(displayedTopic.id) ? 'complete-btn done' : 'complete-btn'} onClick={() => markTopicDone(displayedTopic.id)}>{completedTopics.includes(displayedTopic.id) ? <CheckCircle2 size={15} /> : <Check size={15} />}{completedTopics.includes(displayedTopic.id) ? 'Repasado' : 'Marcar repasado'}</button></div><h2>{displayedTopic.title}</h2><p className="topic-short">{displayedTopic.short}</p><div className="topic-section"><h3>Cómo funciona</h3><p>{displayedTopic.explanation}</p></div><div className="topic-section use-case"><h3><Lightbulb size={15} /> ¿Para qué sirve?</h3><p>{displayedTopic.use}</p></div><div className="topic-section"><h3>Ejemplo mínimo</h3><pre className="snippet"><code>{displayedTopic.code.join('\n')}</code></pre></div><div className="caution"><ShieldCheck size={16} /><p><b>Ten en cuenta:</b> {displayedTopic.caution}</p></div></article>
        </div>
        <div className="concept-footer"><span><b>{topics.length} conceptos</b> organizados para estudiar</span><button className="text-link" onClick={() => changeSection('flujo')}>Seguir el flujo de una tarea <ArrowRight size={14} /></button></div>
      </div>}

      {section === 'flujo' && <div className="content narrow">
        <div className="eyebrow">LECTURA GUIADA · EJEMPLO LED</div><h1 className="page-title">Sigue el código <em>en ejecución.</em></h1><p className="page-lead">Selecciona un paso. La guía resalta las líneas relacionadas y explica qué hace el framework, la tarea y el Scheduler.</p>
        <div className="flow-progress"><span>PASO {String(flowStep + 1).padStart(2, '0')} DE {String(flowSteps.length).padStart(2, '0')}</span><div className="progress-bar"><span style={{ width: ((flowStep + 1) / flowSteps.length * 100) + '%' }} /></div><span>{Math.round((flowStep + 1) / flowSteps.length * 100)}%</span></div>
        <div className="flow-layout"><section className="code-panel flow-code"><div className="code-header"><div className="file-dot" /><span>primera_tarea.ino</span><span className="file-tag">ARDUINO C++</span></div><div className="numbered-code">{codeLines.map((line, index) => <div key={index} className={'code-line ' + (isActive(index + 1) ? 'line-active' : '')} onClick={() => { const match = flowSteps.findIndex(step => step.lines.includes(index + 1)); if (match >= 0) setFlowStep(match) }}><span className="line-number">{String(index + 1).padStart(2, '0')}</span><code>{line || ' '}</code>{isActive(index + 1) && <span className="line-pulse" />}</div>)}</div></section>
          <aside className="flow-guide"><div className="guide-icon"><GitBranch size={20} /></div><span className="eyebrow">PASO {String(flowStep + 1).padStart(2, '0')}</span><h2>{flowSteps[flowStep].title}</h2><p>{flowSteps[flowStep].text}</p><div className="flow-node-list">{flowSteps.map((step, index) => <button key={step.title} className={flowStep === index ? 'flow-node active' : 'flow-node'} onClick={() => setFlowStep(index)}><span>{index + 1}</span>{step.title}</button>)}</div><div className="guide-actions"><button className="secondary-btn" disabled={flowStep === 0} onClick={() => setFlowStep(flowStep - 1)}>Anterior</button><button className="primary-btn" onClick={() => flowStep < flowSteps.length - 1 ? setFlowStep(flowStep + 1) : changeSection('simulador')}>{flowStep < flowSteps.length - 1 ? 'Siguiente paso' : 'Probar Scheduler'} <ArrowRight size={15} /></button></div></aside>
        </div>
        <div className="notice"><Lightbulb size={17} /><p>En Arduino-ESP32, setup() y loop() forman parte de una tarea del framework. La llamada a xTaskCreate() añade aquí una tarea de usuario. El ejemplo ilustra el flujo; confirma GPIO y tamaño de pila para tu versión y placa.</p></div>
      </div>}

      {section === 'simulador' && <div className="content narrow">
        <div className="eyebrow">LABORATORIO VISUAL · MODELO DIDÁCTICO</div><h1 className="page-title">Mira al Scheduler <em>decidir.</em></h1><p className="page-lead">Avanza en intervalos de 100 ms. Las tareas que llaman a un retardo pasan a Blocked; cuando vence el tiempo regresan a Ready.</p>
        <div className="sim-layout"><section className="panel sim-panel"><div className="panel-header"><div><span className="eyebrow">CPU · {board}</span><h2>Estado del procesador</h2></div><span className="pill green">SIMULADO</span></div>
          <div className="cpu-display"><div className="cpu-icon"><Cpu size={28} /></div><div><small>TIEMPO DEL MODELO</small><strong>{(simTime / 1000).toFixed(1)}<small className="unit">s</small></strong></div><div className="running"><small>ÚLTIMA TAREA ELEGIDA</small><strong>{simLast}</strong></div></div>
          <div className="task-list"><h3 className="panel-subtitle">Tareas del ejemplo</h3>{simTasks.map(task => <div className="task-row" key={task.name}><div className="task-symbol">{task.key === 'LED' ? <Lightbulb size={18} /> : <Gauge size={18} />}</div><div className="task-info"><b>{task.name}</b><small>{task.key === 'LED' ? 'Parpadea y espera 500 ms' : 'Lee sensor y espera 300 ms'} · Prioridad {priorities[task.key as keyof typeof priorities]}</small></div><span className={task.state === 'READY' ? 'pill ready-pill' : 'pill'}>{task.state === 'READY' ? 'READY · LISTA' : 'BLOCKED · ESPERA'}</span></div>)}</div>
          <div className="priority-controls"><label>Prioridad TaskLED <b>{priorities.LED}</b></label><input aria-label="Prioridad de TaskLED" type="range" min="0" max="5" value={priorities.LED} onChange={event => setPriorities({ ...priorities, LED: Number(event.target.value) })} /><div className="range-labels"><span>0 · Baja</span><span>5 · Alta</span></div><label>Prioridad TaskSensor <b>{priorities.Sensor}</b></label><input aria-label="Prioridad de TaskSensor" type="range" min="0" max="5" value={priorities.Sensor} onChange={event => setPriorities({ ...priorities, Sensor: Number(event.target.value) })} /><div className="range-labels"><span>0 · Baja</span><span>5 · Alta</span></div></div>
          <div className="sim-actions"><button className="primary-btn" onClick={advanceSimulation}><StepForward size={16} /> Avanzar 100 ms</button><button className="secondary-btn" onClick={resetSimulation}><RotateCcw size={15} /> Reiniciar</button></div>
        </section><aside className="panel side-panel"><div className="eyebrow">OBSERVA Y APRENDE</div><h3>¿Qué decide la CPU?</h3><p>{simLast === 'CPU en reposo' ? 'Ninguna tarea está lista en este instante del modelo: el procesador puede ejecutar la tarea idle.' : simLast === 'Aún no iniciado' ? 'Ambas tareas empiezan listas. Al avanzar, el Scheduler elige la lista con mayor prioridad.' : simLast + ' fue elegida en este intervalo. Después del trabajo del ejemplo, se bloquea por su periodo.'}</p><div className="tip"><Lightbulb size={17} /><p><b>Idea clave</b><br />Una tarea bloqueada, incluso si tiene alta prioridad, no impide ejecutar otra tarea lista.</p></div><div className="state-legend"><span><i className="legend-ready" /> Ready · lista para ejecutar</span><span><i className="legend-blocked" /> Blocked · espera tiempo</span></div><div className="model-note">Este simulador resume cada tarea como “trabajo y retardo”. No reproduce ticks, interrupciones, afinidad ni las tareas internas del framework.</div></aside></div>
      </div>}

      {section === 'codigo' && <div className="content narrow">
        <div className="eyebrow">ARDUINO IDE · C++</div><h1 className="page-title">El ejemplo <em>completo.</em></h1><p className="page-lead">Una tarea hace parpadear un LED y se bloquea entre cambios. Pulsa una fila para ver qué parte del flujo representa.</p>
        <div className="code-explain-layout"><section className="code-panel full-code"><div className="code-header"><div className="file-dot" /><span>primera_tarea.ino</span><button className="copy-btn" onClick={copyCode}>{copied ? <CheckCircle2 size={15} /> : <Code2 size={15} />}{copied ? 'Copiado' : 'Copiar código'}</button></div><div className="numbered-code">{codeLines.map((line, index) => <button key={index} className={'code-line code-line-button ' + (isActive(index + 1) ? 'line-active' : '')} onClick={() => { const match = flowSteps.findIndex(step => step.lines.includes(index + 1)); if (match >= 0) { setFlowStep(match); changeSection('flujo') } }}><span className="line-number">{String(index + 1).padStart(2, '0')}</span><code>{line || ' '}</code></button>)}</div></section>
          <aside className="code-notes"><div className="panel"><div className="eyebrow">LEE ANTES DE CARGAR</div><h3>Parámetros importantes</h3><div className="parameter"><b>LED_PIN</b><p>El GPIO 2 es solo un ejemplo. Comprueba el pinout y el LED integrado de tu placa.</p></div><div className="parameter"><b>2048 · pila</b><p>El tamaño y su unidad dependen del port. Verifica la documentación de Arduino-ESP32/ESP-IDF que estés usando.</p></div><div className="parameter"><b>loop()</b><p>El framework Arduino-ESP32 ejecuta loop() en una tarea propia; no es un hilo mágico fuera de FreeRTOS.</p></div><div className="parameter"><b>Retardo</b><p>vTaskDelay libera la CPU, pero el tiempo real depende del tick y de la carga del sistema.</p></div><button className="text-link" onClick={() => changeSection('flujo')}>Abrir explicación paso a paso <ArrowRight size={14} /></button></div></aside>
        </div>
        <div className="notice"><ShieldCheck size={17} /><p><b>Antes de cargarlo:</b> selecciona la placa correcta, confirma el GPIO del LED y revisa que el tamaño de pila sea adecuado. El código es un ejemplo educativo y no se ha ejecutado en hardware real.</p></div>
      </div>}

      {section === 'practicas' && <div className="content narrow">
        <div className="eyebrow">PROPUESTAS PARA EL MANUAL · ESP32</div><h1 className="page-title">Aprende con <em>prácticas.</em></h1><p className="page-lead">Estas prácticas amplían el borrador. Puedes marcar cada una como preparada mientras organizas el contenido y el material.</p>
        <div className="practice-summary"><div><div className="eyebrow">LISTA DE TRABAJO</div><h2>{practiceDone.length} de {practices.length} prácticas preparadas</h2></div><div className="progress-bar"><span style={{ width: (practiceDone.length / practices.length * 100) + '%' }} /></div></div>
        <div className="practice-grid">{practices.map((practice, index) => <article className="practice-card" key={practice.id}><div className="practice-card-top"><span className="practice-index">PRÁCTICA {String(index + 1).padStart(2, '0')}</span><span className="level-pill">{practice.level}</span></div><h3>{practice.title}</h3><p>{practice.text}</p><div className="practice-detail"><span>APRENDES</span><b>{practice.learn}</b></div><div className="practice-detail"><span>MATERIAL</span><b>{practice.parts}</b></div><button className={practiceDone.includes(practice.id) ? 'practice-check done' : 'practice-check'} onClick={() => setPracticeDone(practiceDone.includes(practice.id) ? practiceDone.filter(id => id !== practice.id) : [...practiceDone, practice.id])}>{practiceDone.includes(practice.id) ? <CheckCircle2 size={15} /> : <Check size={15} />}{practiceDone.includes(practice.id) ? 'Lista para integrar' : 'Marcar preparada'}</button></article>)}</div>
        <div className="notice"><Lightbulb size={18} /><p>Las prácticas son una propuesta editorial basada en los temas del manual y los ejemplos del prototipo. Ajusta el cableado, sensores y pines a las placas y componentes que tengas disponibles.</p></div>
      </div>}

      {section === 'evaluacion' && <div className="content narrow">
        <div className="eyebrow">REPASO · CONCEPTOS FUNDAMENTALES</div><h1 className="page-title">Comprueba lo <em>aprendido.</em></h1><p className="page-lead">Responde y revisa la explicación. Puedes volver a empezar cuando quieras.</p>
        <div className="quiz-card"><div className="quiz-count">PREGUNTA {String(quizIndex + 1).padStart(2, '0')} <span>{String(quizIndex + 1)} / {quizzes.length}</span></div><h2>{quizzes[quizIndex].question}</h2>{quizzes[quizIndex].options.map((option, index) => <button key={option} className={'answer ' + (answer === index ? index === quizzes[quizIndex].correct ? 'correct' : 'incorrect' : '')} onClick={() => setAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{answer === index && index === quizzes[quizIndex].correct && <CheckCircle2 size={17} />}</button>)}{answer !== null && <div className={answer === quizzes[quizIndex].correct ? 'feedback good' : 'feedback bad'}>{answer === quizzes[quizIndex].correct ? '¡Correcto! ' : 'Repasa esta idea. '}{quizzes[quizIndex].why}</div>}<div className="quiz-actions"><button className="secondary-btn" onClick={() => { setAnswer(null); setQuizIndex(0) }}>Reiniciar</button><button className="primary-btn" disabled={answer === null} onClick={() => { setAnswer(null); setQuizIndex((quizIndex + 1) % quizzes.length) }}>{quizIndex === quizzes.length - 1 ? 'Repetir repaso' : 'Siguiente pregunta'} <ArrowRight size={15} /></button></div></div>
        <div className="quiz-footnote"><BookOpen size={16} /><span>¿Necesitas repasar? <button className="text-link" onClick={() => { setTopicId('scheduler'); changeSection('conceptos') }}>Ver Scheduler y tareas <ArrowRight size={13} /></button></span></div>
      </div>}

      <footer className="footer"><span><span className="online-dot" /> FreeRTOS Lab <span className="footer-muted">· Prototipo para aprender con ESP32</span></span><span>Material de apoyo · Manual en desarrollo</span></footer>
    </main>
  </div>
}

export default App
