-- Contenido real de pinkpilates.cl para Barré, Mat Pilates, Baile Entretenido y Vals
-- Novios, extraído directo de esas páginas del WordPress viejo. Idempotente (se puede
-- correr más de una vez sin duplicar nada, sólo actualiza estas 4 filas por slug).
--
-- Correr contra producción (Neon) con:
--   psql "$DATABASE_URL" -f scripts/content-real-class-types.sql
-- o pegar el contenido directo en /admin/clases si prefieres cargarlo a mano.
--
-- Probado primero contra la base local antes de entregarlo.

UPDATE class_types SET
  short_description = 'Ballet, Pilates y ejercicios funcionales de bajo impacto',
  description = 'El Barré es un método elegante y transformador que combina la gracia del ballet clásico, la precisión del Pilates y ejercicios funcionales de bajo impacto. Creado en 1959 por la bailarina alemana Lotte Berk en Londres, combina el trabajo de barra de ballet con movimientos de rehabilitación y fortalecimiento del core.

En clase trabajamos con pulsos precisos, micro-movimientos y contracciones isométricas al ritmo de música motivadora. La barra de ballet es el apoyo principal para el control y la alineación; se trabaja piernas, glúteos, abdomen y brazos, mejorando postura, equilibrio y flexibilidad.

Implementos: barra de ballet, mat, pesas livianas, booty band, overball, magic ring y sliders.

Beneficios: tonifica sin generar volumen, mejora la postura, fortalece el core profundo y el piso pélvico, aumenta la flexibilidad y coordinación, y mejora la capacidad aeróbica.',
  default_duration_min = 55,
  default_capacity = 10
WHERE slug = 'barre';

UPDATE class_types SET
  short_description = '34 ejercicios originales en colchoneta',
  description = 'El Mat Pilates nace de la mano de Joseph Pilates: 34 ejercicios originales en colchoneta que usan el peso del propio cuerpo, con énfasis en el trabajo profundo del core y la conexión mente-cuerpo.

Apto para todos los niveles, desde principiantes hasta alumnas avanzadas.

Implementos: mat, toning balls, bandas elásticas, overball, magic ring.

Beneficios: fortalece el core y estabiliza la columna, corrige la postura y alivia el dolor de espalda, mejora la flexibilidad y el equilibrio, tonifica sin generar volumen, mejora la coordinación y la respiración, reduce el estrés y ayuda a prevenir lesiones.',
  default_duration_min = 55,
  default_capacity = 10
WHERE slug = 'mat-pilates';

UPDATE class_types SET
  short_description = 'Salsa, merengue, bachata y reggaetón con cardio',
  description = 'El Baile Entretenido es una clase vibrante y llena de energía donde el ejercicio se transforma en pura diversión. Coreografía dinámica con salsa, merengue, bachata, samba, reggaetón y otros ritmos, combinada con cardio explosivo.

Beneficios por clase: quema entre 400 y 500 calorías, mejora la salud cardiovascular y circulatoria, desarrolla coordinación, ritmo y conciencia corporal, aporta bienestar mental por las endorfinas, tonifica piernas, glúteos, core y brazos, y mejora postura y flexibilidad.

No necesitas experiencia previa, sólo ganas de moverte — es un ambiente alegre, inclusivo y sin presión.',
  default_duration_min = 55,
  default_capacity = 15
WHERE slug = 'baile-entretenido';

UPDATE class_types SET
  short_description = 'Vals tradicional para el primer baile de tu matrimonio',
  description = '¡Futuros novios, hagan de su primer baile un momento inolvidable lleno de elegancia, conexión y naturalidad! Enseñamos vals tradicional a parejas: pasos básicos, tiempo musical, giros y levantamientos.

Sesión individual (1 hora): repaso de pasos y fluidez — $45.000.

Coreografía completa: incluye 4 ensayos de 2 horas, creación paso a paso, ensayo general en Viña del Mar (si el evento es local), arreglo musical personalizado y protocolo completo — $400.000.

Recomendamos prepararse con anticipación, sin nervios ni improvisaciones. También puedes incluir a tus padres para un momento de entrada especial.',
  drop_in_price_clp = 45000,
  default_duration_min = 60,
  default_capacity = 2
WHERE slug = 'vals-novios';
