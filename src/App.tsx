import { useMemo, useState } from 'react'
import { Activity, ArrowRight, BookOpen, CheckCircle2, ChevronRight, Code2, Cpu, GraduationCap, House, Lightbulb, Play, RotateCcw, StepForward, Terminal } from 'lucide-react'

type Section = 'inicio' | 'lecciones' | 'scheduler' | 'codigo' | 'evaluacion'
const lessons = [
  { title: '¿Qué es FreeRTOS?', time: '10 min', description: 'Comprende qué es un RTOS y cómo organiza un programa en tareas.' },
  { title: 'Tu primera tarea', time: '15 min', description: 'Crea una tarea con xTaskCreate() y aprende a usar vTaskDelay().' },
  { title: 'Prioridades y Scheduler', time: '20 min', description: 'Observa los estados de las tareas y cómo se planifica la CPU.' },
  { title: 'Colas y comunicación', time: '20 min', description: 'Intercambia datos entre tareas mediante queues.' },
  { title: 'Interrupciones y semáforos', time: '25 min', description: 'Aprende a sincronizar tareas con eventos externos.' },
]
const sourceCode = `// FreeRTOS: primera tarea
const int LED_PIN = 2;

void TaskLED(void *pvParameters) {
  pinMode(LED_PIN, OUTPUT);

  for (;;) {
    digitalWrite(LED_PIN, HIGH);
    vTaskDelay(pdMS_TO_TICKS(500));

    digitalWrite(LED_PIN, LOW);
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}

void setup() {
  xTaskCreate(
    TaskLED,
    "TaskLED",
    2048,
    NULL,
    1,
    NULL
  );
}

void loop() {
  // La tarea LED trabaja de forma independiente.
}`
function App() {
  const [section, setSection] = useState<Section>('inicio')
  const [board, setBoard] = useState('ESP32')
  const [cycle, setCycle] = useState(0)
  const [ledPriority, setLedPriority] = useState(1)
  const [serialPriority, setSerialPriority] = useState(2)
  const [lesson, setLesson] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const runningTask = useMemo(() => ledPriority === serialPriority ? (cycle % 2 === 0 ? 'LED' : 'SERIAL') : (ledPriority > serialPriority ? 'LED' : 'SERIAL'), [cycle, ledPriority, serialPriority])
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(sourceCode); setCopied(true); window.setTimeout(() => setCopied(false), 1600) }
    catch { setCopied(false) }
  }
  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'Inicio', icon: <House size={16} /> },
    { id: 'lecciones', label: 'Lecciones', icon: <BookOpen size={16} /> },
    { id: 'scheduler', label: 'Scheduler', icon: <Activity size={16} /> },
    { id: 'codigo', label: 'Código', icon: <Code2 size={16} /> },
    { id: 'evaluacion', label: 'Evaluación', icon: <GraduationCap size={16} /> },
  ]
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Cpu size={25}/></div><div><strong>FreeRTOS <span>Lab</span></strong><small>LEARN · BUILD · EXPERIMENT</small></div></div>
      <div className="side-label">PLATAFORMA</div>
      <nav>{navItems.map(item => <button key={item.id} className={section === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setSection(item.id)}>{item.icon}<span>{item.label}</span>{section === item.id && <ChevronRight size={15} className="nav-chevron"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="online-dot"/> Prototipo educativo <span className="version">v0.1</span></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">LABORATORIO <span>/</span> <b>{navItems.find(n => n.id === section)?.label.toUpperCase()}</b></div><div className="board-picker"><span>PLACA</span><select value={board} onChange={e => setBoard(e.target.value)}><option>ESP32</option><option>ESP32-C6</option></select><span className="status-dot"/></div></header>
      {section === 'inicio' && <div className="content">
        <div className="hero"><div className="eyebrow"><span className="pulse"/> RUTA DE APRENDIZAJE · NIVEL INICIAL</div><h1>De cero a <em>FreeRTOS.</em></h1><p>Aprende sistemas operativos en tiempo real, comprende el Scheduler y lleva tus primeros programas al ESP32.</p><div className="hero-actions"><button className="primary-btn" onClick={() => {setLesson(0);setSection('lecciones')}}>Comenzar a aprender <ArrowRight size={17}/></button><button className="secondary-btn" onClick={() => setSection('scheduler')}><Activity size={16}/> Probar simulador</button></div><div className="hero-grid"><div className="hero-grid-lines"/><div className="chip-illustration"><Cpu size={76} strokeWidth={1}/><span>RTOS</span></div><div className="chip-label label-a">TASK MANAGEMENT</div><div className="chip-label label-b">REAL-TIME SYSTEMS</div></div></div>
        <div className="section-heading"><div><div className="eyebrow">TU ESPACIO DE TRABAJO</div><h2>Continúa aprendiendo</h2></div><span className="muted">5 módulos iniciales</span></div>
        <div className="module-grid">{lessons.slice(0,3).map((item,i)=><button className="module-card" key={item.title} onClick={() => {setLesson(i);setSection('lecciones')}}><div className="module-top"><span className="module-number">0{i+1}</span><span className="module-time">{item.time}</span></div><div className="module-icon">{i===0?<BookOpen/>:i===1?<Code2/>:<Activity/>}</div><h3>{item.title}</h3><p>{item.description}</p><div className="module-link">Abrir módulo <ArrowRight size={15}/></div></button>)}</div>
        <div className="bottom-note"><Lightbulb size={18}/><p><b>Aprende haciendo.</b> Cada lección combina una explicación breve, un ejemplo de código y una práctica interactiva.</p></div>
      </div>}
      {section === 'lecciones' && <div className="content narrow"><div className="eyebrow">FUNDAMENTOS · MÓDULO {String(lesson+1).padStart(2,'0')}</div><h1 className="page-title">{lessons[lesson].title}</h1><p className="page-lead">{lessons[lesson].description}</p><div className="lesson-layout"><div className="lesson-list">{lessons.map((item,i)=><button key={item.title} onClick={() => setLesson(i)} className={lesson===i?'lesson-item selected':'lesson-item'}><span className="lesson-index">{String(i+1).padStart(2,'0')}</span><span><b>{item.title}</b><small>{item.time}</small></span><ChevronRight size={16}/></button>)}</div><article className="lesson-body"><div className="eyebrow">CONCEPTO CLAVE</div>{lesson===0?<><h2>¿Qué es un RTOS?</h2><p>FreeRTOS es un sistema operativo en tiempo real diseñado para sistemas embebidos. Permite dividir un programa en tareas independientes y administrar el uso de la CPU.</p><div className="concept"><b>Task</b><p>Una unidad de trabajo independiente, por ejemplo leer un sensor o controlar un LED.</p></div><div className="concept"><b>Scheduler</b><p>El planificador decide qué tarea lista puede ejecutarse según las prioridades y el estado de cada tarea.</p></div><div className="concept"><b>Prioridad</b><p>Indica la importancia relativa de una tarea. En la configuración habitual, una tarea lista de mayor prioridad puede desplazar a una de menor prioridad.</p></div></>:lesson===1?<><h2>Tu primera tarea</h2><p>La función <code>xTaskCreate()</code> crea una tarea. Normalmente la tarea contiene un bucle y utiliza <code>vTaskDelay()</code> para bloquearse durante un intervalo.</p><pre><code>{'void TaskLED(void *pvParameters) {\\n  for (;;) {\\n    digitalWrite(LED_PIN, !digitalRead(LED_PIN));\\n    vTaskDelay(pdMS_TO_TICKS(500));\\n  }\\n}'}</code></pre></>:lesson===2?<><h2>¿Quién usa la CPU?</h2><p>Las tareas pueden estar listas, ejecutándose o bloqueadas. El Scheduler selecciona entre las tareas listas. Una tarea bloqueada por un retardo no compite por la CPU hasta que el retardo termina.</p><button className="primary-btn" onClick={() => setSection('scheduler')}>Abrir simulador <ArrowRight size={16}/></button></>:lesson===3?<><h2>Comunicación entre tareas</h2><p>Las colas permiten enviar datos de una tarea a otra de manera sincronizada.</p><pre><code>{'xQueueSend(miCola, &dato, portMAX_DELAY);\\nxQueueReceive(miCola, &dato, portMAX_DELAY);'}</code></pre></>:<><h2>Eventos y sincronización</h2><p>Los semáforos y las interrupciones permiten sincronizar el software con eventos del hardware. Dentro de una ISR deben utilizarse las API específicas para interrupciones.</p><pre><code>{'xSemaphoreGiveFromISR(semaforo, &despertar);'}</code></pre></>}<div className="lesson-footer"><button className="secondary-btn" disabled={lesson===0} onClick={() => setLesson(lesson-1)}>Anterior</button><button className="primary-btn" onClick={() => lesson<4?setLesson(lesson+1):setSection('evaluacion')}>{lesson===4?'Ir a evaluación':'Siguiente lección'} <ArrowRight size={16}/></button></div></article></div></div>}
      {section === 'scheduler' && <div className="content narrow"><div className="eyebrow">LABORATORIO VISUAL</div><h1 className="page-title">Scheduler <em>simulator.</em></h1><p className="page-lead">Cambia las prioridades y avanza ciclo por ciclo para explorar la planificación. Este es un modelo didáctico, no una ejecución real del RTOS.</p><div className="sim-layout"><section className="panel"><div className="panel-header"><div><span className="eyebrow">CPU · {board}</span><h2>Estado del procesador</h2></div><span className="pill green">SIMULADO</span></div><div className="cpu-display"><div className="cpu-icon"><Cpu size={32}/></div><div><small>CICLO ACTUAL</small><strong>{String(cycle).padStart(2,'0')}</strong></div><div className="running"><small>EJECUTANDO</small><strong>{runningTask==='LED'?'TaskLED':'TaskSerial'}</strong></div></div><div className="execution-track"><div className="track-label"><span>CPU ocupada</span><span>100% del intervalo conceptual</span></div><div className="track"><span/></div></div><h3 className="panel-subtitle">Tareas del sistema</h3><div className="task-row"><div className="task-symbol"><Lightbulb size={19}/></div><div className="task-info"><b>TaskLED</b><small>Control de LED · Prioridad {ledPriority}</small></div><span className={runningTask==='LED'?'pill green':'pill'}>{runningTask==='LED'?'RUNNING':'READY'}</span></div><div className="task-row"><div className="task-symbol"><Terminal size={19}/></div><div className="task-info"><b>TaskSerial</b><small>Salida serial · Prioridad {serialPriority}</small></div><span className={runningTask==='SERIAL'?'pill green':'pill'}>{runningTask==='SERIAL'?'RUNNING':'READY'}</span></div><div className="priority-controls"><label>Prioridad TaskLED <b>{ledPriority}</b></label><input type="range" min="0" max="5" value={ledPriority} onChange={e=>setLedPriority(Number(e.target.value))}/><div className="range-labels"><span>0 · Baja</span><span>5 · Alta</span></div><label>Prioridad TaskSerial <b>{serialPriority}</b></label><input type="range" min="0" max="5" value={serialPriority} onChange={e=>setSerialPriority(Number(e.target.value))}/><div className="range-labels"><span>0 · Baja</span><span>5 · Alta</span></div></div><div className="sim-actions"><button className="primary-btn" onClick={()=>setCycle(cycle+1)}><StepForward size={16}/> Siguiente ciclo</button><button className="secondary-btn" onClick={()=>setCycle(0)}><RotateCcw size={16}/> Reiniciar</button></div></section><aside className="panel side-panel"><div className="eyebrow">OBSERVA Y APRENDE</div><h3>¿Qué está pasando?</h3><p>{ledPriority===serialPriority?'Las tareas tienen la misma prioridad. El modelo alterna las tareas por ciclo para ilustrar el reparto de CPU.':`${runningTask==='LED'?'TaskLED':'TaskSerial'} tiene mayor prioridad y es seleccionada porque el modelo supone que ambas tareas están listas.`}</p><div className="tip"><Lightbulb size={18}/><p><b>Importante</b><br/>En un sistema real, una tarea de prioridad alta que esté bloqueada no se ejecuta. El Scheduler considera el estado de las tareas, no solo sus prioridades.</p></div><div className="state-legend"><span><i className="legend-running"/> Running · Ejecutándose</span><span><i className="legend-ready"/> Ready · Lista</span><span><i className="legend-blocked"/> Blocked · Bloqueada</span></div></aside></div></div>}
      {section === 'codigo' && <div className="content narrow"><div className="eyebrow">ARDUINO IDE · C++</div><h1 className="page-title">Tu primer <em>programa.</em></h1><p className="page-lead">Una tarea que hace parpadear un LED sin mantener toda la lógica dentro de loop().</p><div className="code-panel"><div className="code-header"><div className="file-dot"/><span>primera_tarea.ino</span><button className="copy-btn" onClick={copyCode}>{copied?<CheckCircle2 size={15}/>:<Code2 size={15}/>} {copied?'Copiado':'Copiar código'}</button></div><pre><code>{sourceCode}</code></pre></div><div className="explain-grid"><div className="concept"><b><code>xTaskCreate()</code></b><p>Crea la tarea y define su pila, nombre, parámetros y prioridad.</p></div><div className="concept"><b><code>vTaskDelay()</code></b><p>Bloquea temporalmente la tarea para permitir que otras tareas listas puedan ejecutarse.</p></div></div><div className="warning"><Lightbulb size={18}/><p><b>Antes de cargarlo:</b> confirma qué GPIO corresponde al LED de tu placa. En algunas placas ESP32-C6 el GPIO 2 no controla un LED integrado. Verifica también los requisitos de pila de tu configuración.</p></div><button className="primary-btn" onClick={()=>setSection('scheduler')}>Explorar el Scheduler <ArrowRight size={16}/></button></div>}
      {section === 'evaluacion' && <div className="content narrow"><div className="eyebrow">EVALUACIÓN · FUNDAMENTOS</div><h1 className="page-title">Comprueba lo <em>aprendido.</em></h1><p className="page-lead">Pregunta 1 · Selecciona la función de vTaskDelay().</p><div className="quiz-card"><div className="quiz-count">PREGUNTA 01 <span>FUNDAMENTOS</span></div><h2>¿Cuál es la función de <code>vTaskDelay()</code>?</h2>{['Crear una nueva tarea','Bloquear temporalmente la tarea que la llama','Cambiar la prioridad de todas las tareas','Reiniciar el microcontrolador'].map((option,i)=><button key={option} className={'answer '+(answer===i?(i===1?'correct':'incorrect'):'')} onClick={()=>setAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{option}{answer===i&&(i===1?<CheckCircle2 size={17}/>:null)}</button>)}{answer!==null&&<div className={answer===1?'feedback good':'feedback bad'}>{answer===1?'¡Correcto! La tarea queda bloqueada durante el tiempo solicitado.':'No exactamente. Revisa la lección “Tu primera tarea” e inténtalo de nuevo.'}</div>}<button className="secondary-btn" onClick={()=>{setAnswer(null);setSection('lecciones');setLesson(1)}}>Repasar la lección</button></div></div>}
      <footer className="footer"><span><span className="online-dot"/> FreeRTOS Lab <span className="footer-muted">· Prototipo educativo v0.1</span></span><span>Hecho para aprender sistemas embebidos</span></footer>
    </main>
  </div>
}
export default App
