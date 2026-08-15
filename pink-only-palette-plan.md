# Plan de recalibración cromática — Pink Pilates

## Objetivo

Actualizar **únicamente el sistema de color** de Pink Pilates para trabajar con la nueva familia de rosas entregada por la marca, sin modificar la estructura, la jerarquía de contenidos, las imágenes, las animaciones, la agenda, los breakpoints ni la navegación actual. La meta es que el sitio se sienta más suave y monocromático, pero conserve la intensidad editorial, el carácter premium y la legibilidad de una experiencia centrada en reservas móviles.

## Lectura de la paleta propuesta

La paleta tiene cinco valores que pertenecen a una misma familia. Por esa razón, el contraste no debe depender de distribuirlos por igual, sino de asignarles funciones estables y reservar el rosa más intenso para momentos decisivos.

| Rol de sistema | Color | Uso propuesto | Proporción orientativa |
| --- | --- | --- | --- |
| Base respirable | **Soft Blush** `#FFDBDB` | Fondo general, espacios de descanso, capas suaves del hero y superficie de lectura. | 35% |
| Panel editorial | **Pastel Pink** `#FDC3D1` | Transiciones entre bloques, fondos de secciones secundarias y superficies de apoyo. | 25% |
| Campo de marca | **Baby Pink** `#FDA8BF` | Bloques gráficos, fondos de módulos, tarjetas de contenido y áreas de ritmo visual. | 20% |
| Señal de energía | **Bubblegum Tint** `#FB8CAC` | Hero, áreas principales de alto impacto, llamados destacados y zonas de transición. | 15% |
| Acento de precisión | **Bubblegum Pink** `#FF5C89` | Estado activo, monograma, iconos, selección de agenda, pequeñas palabras de énfasis y detalles recurrentes. | 5% |

> La paleta puede ser enteramente rosa, pero necesita un **neutral funcional oscuro** ya existente para tipografía, bordes, formularios y contraste sobre los tonos medios e intensos. Ese tono no funcionará como color de marca adicional: será únicamente la tinta operativa que permite reservar, leer y navegar con claridad.

## Decisiones de contraste

Se conservará el negro tinta actual para texto, controles, bordes y superficies de agenda. Sobre `#FDA8BF`, `#FB8CAC` y `#FF5C89`, los textos y controles principales utilizarán tinta oscura; se evitará texto blanco sobre rosa saturado. `#FFDBDB` y `#FDC3D1` permitirán títulos y párrafos en tinta, mientras que `#FF5C89` se limitará a detalles o texto breve sobre los fondos muy claros.

La agenda seguirá siendo una superficie tinta con tipografía y bordes rosados claros; esto preserva el mayor contraste del sitio para su acción más importante. El CTA móvil fijo seguirá usando tinta como base, con un acento `#FF5C89` para el estado de reserva, de modo que conserve jerarquía sin competir con el contenido.

## Fases de implementación

### 1. Inventario y mapa de tokens

Se revisarán los tokens actuales para separar colores de marca, fondos, acentos, estados activos y neutrales funcionales. Se definirá una correspondencia directa desde los tokens actuales a los cinco tonos entregados, sin cambiar selectores, componentes ni layout.

### 2. Sustitución exclusiva de color

Se actualizarán las variables globales y los activos de identidad dependientes de color —wordmark, corazón de carga y favicon— al nuevo Bubblegum Pink. Hero, menú, monograma, bloques principales, elementos de reserva y estados interactivos recibirán sus roles de color según la tabla, sin modificar dimensiones, orden de secciones, espaciado, textos ni comportamiento.

### 3. Control de contraste funcional

Se revisarán de manera específica el encabezado, menú de pantalla completa, hero, agenda, selector de horarios, CTA fijo móvil, intro inmersiva, footer y estados hover/focus. La prioridad será que la acción de reservar conserve contraste inequívoco en móvil y que las etiquetas pequeñas no se pierdan en las superficies rosadas.

### 4. Validación visual responsive

Se comprobarán la página completa en escritorio y teléfono. La validación confirmará que los cinco rosas creen ritmo sin convertir cada sección en una experiencia aislada, que las imágenes no sufran cambios y que no aparezcan desbordes ni cambios estructurales.

### 5. Revisión de preferencia y checkpoint

Se presentará una única versión cromática para aprobación. Si el resultado se percibe demasiado suave, el único ajuste posterior será aumentar la presencia de `#FB8CAC` en campos principales, manteniendo los otros roles y sin tocar diseño ni contenido.

## Pruebas previstas

La comprobación incluirá compilación de tipos y producción, vista completa de escritorio, vista completa de móvil, legibilidad de agenda y CTA fijo, y verificación de la secuencia de carga con el corazón original recoloreado. Se revisarán específicamente textos sobre rosa medio e intenso para evitar contrastes débiles.

## Supuestos y riesgos

Se asume que la intención de “solo rosas” se refiere al sistema de marca y no elimina la tinta oscura necesaria para accesibilidad y operación de la agenda. No se editarán las fotografías existentes ni se alterará su composición; su tratamiento actual se mantendrá para no extender el encargo más allá de la paleta. Si la marca exige eliminar incluso la tinta oscura, habría que aprobar una segunda ronda con un rosa profundo adicional, porque los cinco tonos compartidos no sustituyen de forma segura el contraste de texto y controles.
