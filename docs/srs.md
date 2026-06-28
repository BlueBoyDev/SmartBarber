# 📑 Especificación de Requerimientos de Software (SRS)

## Proyecto: SmartBarber

Este documento describe detalladamente los requerimientos de software, de negocio y de calidad para **SmartBarber**, una plataforma *mobile-first* de agendamiento y gestión de citas para barberías en México. Sirve como referencia técnica base para el diseño UI/UX, desarrollo de código, modelado de bases de datos y ejecución de pruebas de aseguramiento de calidad (QA).

---

## 📋 1. Introducción y Contexto

### 1.1 Propósito
Describir formalmente los requerimientos del sistema SmartBarber para alinear el desarrollo técnico con los objetivos estratégicos de negocio y de los stakeholders.

### 1.2 Alcance del proyecto
SmartBarber es una plataforma móvil nativa (*iOS* y *Android*) que conecta a clientes locales con barberos y barberías independientes en México. Permite calendarizar, modificar y notificar citas en tiempo real de forma digital, eliminando los procesos manuales ineficientes (mensajería informal y llamadas telefónicas).

### 1.3 Glosario y Definiciones

| Término | Definición |
| :--- | :--- |
| **OTP** | *One-Time Password*. Código de verificación numérico de un solo uso transmitido por SMS para confirmar la identidad del dispositivo móvil. |
| **JWT** | *JSON Web Token*. Estándar de la industria (RFC 7519) utilizado para la autenticación segura y sin estado (*stateless*) entre cliente y servidor. |
| **MVP** | *Minimum Viable Product*. Conjunto mínimo de funcionalidades que permiten lanzar el producto al mercado para validación real con usuarios. |
| **RF** | Requerimiento Funcional. Declaración de un servicio o comportamiento específico que el sistema debe proveer. |
| **RNF** | Requerimiento No Funcional. Atributo de calidad, rendimiento o seguridad al que el sistema debe apegarse de forma obligatoria. |
| **HU** | Historia de Usuario. Representación ágil de una necesidad de negocio contada desde el punto de vista del usuario final. |
| **LFPDPPP** | Ley Federal de Protección de Datos Personales en Posesión de los Particulares (Marco regulatorio en México). |
| **SPEI** | Para transferencias interbancarias directas de bajo costo reguladas por el Banco de México. |

### 1.4 Contexto del mercado y diferenciador local
Las alternativas líderes en el sector (como Booksy, StyleSeat o Vagaro) han sido concebidas primordialmente para mercados angloparlantes y economías con un comportamiento de pago diferente al mexicano. Esto origina tres fricciones clave:
1. Interfaces en inglés o español parcial con anglicismos ajenos al modismo local.
2. Cobro de comisiones fijas por reserva que erosionan el margen del barbero independiente.
3. Métodos de pago limitados que omiten transferencias bancarias de bajo costo (como SPEI) o tarjetas de débito nacionales.

SmartBarber se posiciona en el mercado hispanohablante a través de un modelo freemium local de suscripción fija y herramientas de pago nacionales sin comisiones transaccionales por reserva.

---

## 📊 2. Análisis Competitivo

### 2.1 Metodología
Se instalaron y analizaron los flujos críticos de usuario (desde la perspectiva del barbero y el cliente) de tres competidores clave, recopilando además el feedback de usuarios en App Store y Google Play de 1 a 3 estrellas para capturar oportunidades de mejora directa.

### 2.2 Matriz comparativa de la industria

| Criterio | Booksy | StyleSeat | Vagaro | SmartBarber |
| :--- | :---: | :---: | :---: | :---: |
| **Agendamiento en línea** | Sí | Sí | Sí | **Sí (MVP)** |
| **Recordatorios automáticos** | SMS + correo | Solo correo | SMS + correo | **WhatsApp + Push** |
| **Pagos integrados** | Sí | Sí | Sí | **SPEI / Tarjeta MX** |
| **Español México** | Parcial | No | Parcial | **Nativo (Ventaja)** |
| **Plan gratuito** | Limitado | No | Trial 30 días | **Freemium real** |
| **Comisión por cita** | 0% | 30% del servicio | 0% | **0% (Tarifa fija)** |
| **Principal queja detectada** | Precio alto para LATAM | Comisión abusiva | Interfaz confusa | **— Oportunidad —** |

### 2.3 Oportunidades estratégicas
* **Localización mexicana completa:** Expresiones adaptadas al mercado local (ej. "Cita" en lugar de "Booking", "Barbero" en lugar de "Stylist").
* **Uso prioritario de WhatsApp:** Envío de notificaciones directamente al canal de comunicación preferido en el país, lo que eleva la tasa de lectura frente al SMS estándar.
* **Onboarding optimizado:** Registro de usuario diseñado para finalizarse en un tiempo menor a 90 segundos.

---

## ⚙️ 3. Requerimientos Funcionales (RF)

### 3.1 Listado General de Requerimientos

| ID | Descripción | Actor | Módulo | Prioridad |
| :---: | :--- | :---: | :---: | :---: |
| **RF-01** | Registro con número de teléfono (verificación OTP) | Ambos | Auth | **Alta** |
| **RF-02** | Dos tipos de perfil: Cliente y Barbero con vistas distintas | Ambos | Auth | **Alta** |
| **RF-03** | El barbero puede subir fotos de cortes a su perfil (portafolio) | Barbero | Auth | Media |
| **RF-04** | El cliente ve horarios disponibles del barbero en calendario visual | Cliente | Agenda | **Alta** |
| **RF-05** | El cliente reserva cita seleccionando servicio, barbero, fecha y hora | Cliente | Agenda | **Alta** |
| **RF-06** | El cliente cancela o reagenda con al menos 2 horas de anticipación | Cliente | Agenda | **Alta** |
| **RF-07** | El barbero ve su agenda diaria y semanal con estado de cada cita | Barbero | Agenda | **Alta** |
| **RF-08** | El barbero configura horario de trabajo y bloquea días no disponibles | Barbero | Agenda | **Alta** |
| **RF-09** | Recordatorio al cliente 24h y 1h antes de su cita (WhatsApp o push) | Cliente | Notif. | **Alta** |
| **RF-10** | El barbero recibe notificación push al registrarse o cancelarse una cita | Barbero | Notif. | **Alta** |
| **RF-11** | El barbero crea y edita catálogo de servicios con nombre, duración y precio | Barbero | Servicios | **Alta** |
| **RF-12** | Cobro anticipado con tarjeta o SPEI al momento de reservar | Cliente | Pagos | Media |
| **RF-13** | El barbero ve historial de ingresos con filtro por semana y mes | Barbero | Pagos | Media |
| **RF-14** | El cliente califica (1-5 estrellas) y deja reseña tras completar una cita | Cliente | Calific. | Media |
| **RF-15** | El cliente busca barberos cercanos por geolocalización o código postal | Cliente | Búsqueda | Baja |

---

### 3.2 Ficha Detallada: RF-01 (Autenticación e Identidad)

| Campo | Detalle |
| :--- | :--- |
| **Descripción** | Permite registrarse o iniciar sesión de manera rápida utilizando un número telefónico celular de 10 dígitos activo en México, validado a través de un código OTP enviado por mensaje de texto. |
| **Actores** | Cliente no registrado, Barbero no registrado. |
| **Prioridad** | Alta — MVP. |
| **Precondiciones** | El usuario cuenta con señal de red celular activa para la recepción de mensajes SMS y su número no tiene una sesión bloqueada. |
| **Postcondiciones** | Se inicializa el perfil de la cuenta, se otorga una sesión activa mediante un JSON Web Token (JWT) y se arranca el onboarding de acuerdo al rol. |
| **Dependencias** | Pasarela de comunicación SMS (ej. Twilio o Vonage), base de datos PostgreSQL, servicio JWT. |

#### Criterios de aceptación (RF-01)
* El input del teléfono restringe la entrada a caracteres puramente numéricos de exactamente 10 dígitos.
* El backend agrega automáticamente el prefijo telefónico del país (`+52`) antes del procesamiento del envío.
* El OTP cuenta con una longitud fija de 6 dígitos numéricos aleatorios y una vigencia de 5 minutos desde su generación.
* Mecanismo de reintento protegido: tras 3 ingresos incorrectos consecutivos de OTP, el número se congela de forma automática durante 15 minutos para evitar ataques de fuerza bruta.
* Si el número móvil ingresado ya se encuentra registrado, la interfaz reconduce al usuario hacia el flujo de inicio de sesión (*login*).
* El botón para solicitar reenvío de OTP se mantendrá inactivo con un temporizador de 30 segundos una vez solicitada la verificación.

#### Reglas de negocio (RF-01)
* **RN-01:** Cada número telefónico celular solo puede estar enlazado a un único perfil de usuario activo a la vez.
* **RN-02:** Un mismo número de teléfono puede operar perfiles independientes de Cliente y Barbero (cuentas y vistas separadas).
* **RN-03:** Los códigos OTP nunca deben persistirse en texto plano. En la base de datos se almacena únicamente el hash criptográfico junto al timestamp correspondiente.
* **RN-04:** Un número telefónico validado y activo no podrá ser editado de forma libre por el usuario sin completar una nueva comprobación SMS de seguridad.

#### Flujo de Procesamiento Principal (RF-01)
1. **Paso 1:** El usuario introduce su número de 10 dígitos en la pantalla de bienvenida.
2. **Paso 2:** El cliente frontend valida la longitud del número mediante una expresión regular.
3. **Paso 3:** Se realiza la petición al backend para enviar el OTP de 6 dígitos mediante SMS.
4. **Paso 4:** El usuario introduce el código recibido.
5. **Paso 5:** El backend verifica la validez e intentos.
6. **Paso 6:** El usuario elige su perfil final (Cliente o Barbero) y completa el onboarding obligatorio de configuración inicial.

#### Matriz de Casos de Prueba (RF-01)

| ID | Tipo | Escenario | Resultado esperado |
| :---: | :---: | :--- | :--- |
| **CP-01** | Exitoso | Captura de número de 10 dígitos válido y código OTP ingresado correctamente. | Creación de cuenta exitosa y redirección con inyección de JWT. |
| **CP-02** | Error | Captura de un número incompleto (longitud menor a 10 dígitos). | El campo muestra error de validación e impide el envío HTTP. |
| **CP-03** | Alterno | El número telefónico ingresado ya está registrado. | Redirección al flujo de Login en lugar de Onboarding. |
| **CP-04** | Error | Código OTP introducido erróneamente en 3 intentos continuos. | Bloqueo temporal de solicitudes para ese número por 15 minutos. |
| **CP-05** | Error | Ingreso del código OTP correcto pasados los 5 minutos de vigencia. | Mensaje indicando código caducado y habilitación del botón de reenvío. |
| **CP-06** | Error | Reenvío del código OTP antes de que expire la cuenta regresiva de 30 segundos. | El botón de acción permanece inhabilitado mostrando los segundos restantes. |

---

## 🛡️ 4. Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales definen los atributos de calidad indispensables para la experiencia de usuario y la resiliencia tecnológica del sistema.

| ID | Categoría | Descripción |
| :---: | :---: | :--- |
| **RNF-01** | **Rendimiento** | Las pantallas de cara al cliente final deben cargar en menos de 2 segundos en redes móviles 4G. El backend soportará 500 peticiones por segundo concurrentes sin experimentar latencias mayores a 300ms. |
| **RNF-02** | **Compatibilidad** | La aplicación cliente funcionará nativamente en dispositivos iOS 14+ y Android 10+. La interfaz de gestión web soportará las versiones actuales de Chrome, Safari y Firefox. |
| **RNF-03** | **Seguridad** | Cifrado obligatorio en tránsito mediante protocolo TLS 1.3 y en reposo para datos sensibles. Las contraseñas de administración se procesarán con hashes de bcrypt. Cumplimiento absoluto con la ley de protección de datos (LFPDPPP). |
| **RNF-04** | **Usabilidad** | El flujo de reserva completo no debe exceder de 4 pantallas táctiles o un promedio de 3 minutos de duración en usuarios nuevos. Toda la interfaz gráfica estará configurada en español mexicano. |
| **RNF-05** | **Disponibilidad** | Estabilidad del sistema garantizada del 99.5% mensual. Las tareas programadas de mantenimiento de bases de datos y servidores se realizarán entre las 2:00 am y las 5:00 am del huso horario del Centro de México (CST). |
| **RNF-06** | **Escalabilidad** | Arquitectura en microservicios o Serverless que permita escalar horizontalmente los recursos del servidor para tolerar hasta 10,000 registros activos sin necesidad de rediseño arquitectónico. |

---

## 👥 5. Historias de Usuario (User Stories)

| ID | Prioridad | Historia de usuario | Criterios de aceptación |
| :---: | :---: | :--- | :--- |
| **HU-01** | **Alta** | **Como** cliente,<br>**quiero** ver los horarios disponibles de mi barbero favorito,<br>**para** poder elegir el que mejor se acomode a mi día. | • Calendario interactivo integrado que renderiza la disponibilidad real en tiempo de ejecución.<br>• Los bloques de tiempo ocupados o fuera de servicio se renderizan visualmente inactivos.<br>• Capacidad de filtrar las horas de atención por fecha específica. |
| **HU-02** | **Alta** | **Como** cliente,<br>**quiero** recibir un recordatorio antes de mi cita,<br>**para** no olvidarla y evitar cargos por no asistir. | • Notificaciones automatizadas emitidas 24 horas y 1 hora previo a la fecha establecida.<br>• Integración directa con mensajería de WhatsApp e inyección de notificaciones push móviles.<br>• El contenido detalla nombre del barbero asignado, costo, hora y dirección. |
| **HU-03** | **Alta** | **Como** barbero,<br>**quiero** ver mi agenda del día en una sola pantalla,<br>**para** saber cuántos clientes tengo y prepararme con tiempo. | • Dashboard de administración consolidado (vistas tipo lista lineal y calendario expandido).<br>• Tarjetas de cita detallando cliente, número telefónico, servicios agendados y duraciones.<br>• Control táctil para cambiar el estatus de la reserva a "Completado" o "Cancelado". |
| **HU-04** | **Alta** | **Como** barbero,<br>**quiero** definir mis servicios con precio y duración,<br>**para** que los clientes sepan exactamente qué ofrezco antes de reservar. | • Interfaz web/móvil para registrar, modificar o dar de baja servicios del catálogo.<br>• Atributos obligatorios: título del servicio, precio base y duración en bloques de minutos.<br>• Los cambios aplicados se reflejan inmediatamente en el flujo de citas de cara al cliente. |
| **HU-05** | **Media** | **Como** cliente,<br>**quiero** poder cancelar mi cita desde la app,<br>**para** avisar al barbero sin tener que llamarle. | • Cancelaciones directas permitidas con un límite de hasta 2 horas antes de la cita.<br>• Disparo de notificación push inmediata al panel del barbero.<br>• Liberación automática e inmediata del horario en la base de datos de reservas. |

---

## 🎨 6. Principios de Diseño y Flujo de Interfaces

### 6.1 Principios de diseño
El diseño de SmartBarber se rige por tres directrices fundamentales:

| Principio | Definición | Implicación en diseño |
| :--- | :--- | :--- |
| **Velocidad** | El usuario nuevo agenda su primera cita en menos de 3 minutos (RNF-04). | Flujos cortos de máximo 5 pasos. Sin pantallas de bienvenida innecesariamente largas. Onboarding diferido en el flujo. |
| **Claridad** | Interfaz completamente en español mexicano, sin anglicismos innecesarios. | Terminología local: 'Agendar cita' en lugar de 'Book appointment'. Iconos acompañados con etiqueta de texto siempre. |
| **Confianza** | El cliente siente que sus datos y pagos están protegidos desde el primer contacto. | Verificación visible por SMS. Indicadores claros de cifrado y seguridad en pantallas de pago. Políticas de privacidad accesibles. |

---

### 6.2 Recorrido del Cliente (MVP: 5 Pantallas Críticas)

#### 1. Pantalla de Registro (`P-01`)
* **Objetivo:** Registrar cuentas nuevas utilizando un número telefónico celular mexicano de 10 dígitos.
* **Elementos UI:** 
  - Campo de entrada telefónica con máscara automática: `(55) 1234-5678`.
  - Prefijo internacional `+52` fijo y no editable.
  - Botón principal de llamada a la acción: *"Enviar código"*, inactivo hasta validar la expresión regular del campo telefónico.
  - Selector exclusivo del rol de perfil: *Cliente* / *Barbero*.
* **Estados Visuales:**
  - *Inicial:* Campos vacíos. Botón deshabilitado. Placeholder activo.
  - *Escribiendo:* Input con borde púrpura de foco. Contador de caracteres numéricos.
  - *Error:* Input con borde rojo. Mensaje de retroalimentación: *"Ingresa 10 dígitos válidos"*.
  - *Cargando:* Botón muestra spinner inactivo. Entrada bloqueada mientras se transmite la API.

#### 2. Pantalla de Verificación OTP (`P-02`)
* **Objetivo:** Validar la propiedad e identidad del número telefónico.
* **Elementos UI:**
  - Número de teléfono parcialmente enmascarado para validación visual (`55 **** 5678`).
  - Bloque de 6 cajas de entrada individuales de un dígito, con salto automático de foco al teclear.
  - Contador regresivo en tiempo real (`4:59` a `0:00`).
  - Mensaje de intentos: *"3 intentos restantes"*.
  - Enlace de retorno *"Cambiar número"*.

#### 3. Pantalla de Búsqueda de Barbero (`P-03`)
* **Objetivo:** Buscar y localizar barberos disponibles dentro de la cercanía del cliente.
* **Elementos UI:**
  - Pestañas de filtración rápida: *Cerca* | *Favoritos* | *Buscar*.
  - Barra de búsqueda por texto (nombre de barbero o colonia).
  - Tarjeta resumida del barbero: fotografía, nombre, distancia calculada, estrellas de reputación y etiqueta de disponibilidad (*"Libre ahora"* en verde, *"Próximo disponible: 3:00 PM"* en ámbar, *"Sin disponibilidad"* en gris).

#### 4. Pantalla de Agendamiento (`P-05`)
* **Objetivo:** Configuración y confirmación del servicio, fecha y hora de la cita.
* **Elementos UI:**
  - Catálogo de servicios en chips interactivos (el activo se ilumina en fondo púrpura).
  - Selector de fechas deslizante con flechas laterales.
  - Grid de horarios: bloques disponibles se muestran con contorno gris y bloques ocupados están deshabilitados.
  - Botón flotante inferior: Resumen en tiempo real del servicio y precio seleccionado para proceder.

#### 5. Pantalla de Confirmación (`P-06`)
* **Objetivo:** Validar el registro de la cita.
* **Elementos UI:**
  - Animación de éxito (círculo de confirmación verde).
  - Tarjeta de resumen de cita (nombre del profesional, fecha, hora, costo y dirección del establecimiento).
  - Aviso de recordatorio automatizado por WhatsApp.
  - Accesos directos: *"Agregar a mi calendario"* e *"Ir a mis citas"*.

---

### 6.3 Recorrido del Barbero (MVP: 4 Pantallas Críticas)

#### 1. Agenda del Día (`P-08`)
* **Objetivo:** Control operativo diario del flujo de clientes asignados.
* **Elementos UI:**
  - Selector semanal de navegación de fechas mediante deslizamiento lateral.
  - Tarjetas de cita ordenadas cronológicamente con barras de color lateral según estado: Completada (verde), En curso (púrpura), Pendiente (ámbar), Cancelada (rojo).
  - Acciones táctiles rápidas para marcar como completado o cancelación.
  - Botón flotante *"Bloquear hora"* para pausar la disponibilidad por motivos personales.

#### 2. Catálogo de Servicios (`P-09`)
* **Objetivo:** Administrar los precios y duración de los servicios.
* **Elementos UI:**
  - Lista de servicios activos e inactivos.
  - Formulario modal de creación/edición con entradas para nombre del servicio, duración (múltiplos de 15 minutos, mínimo 15) y precio (mínimo $10.00 MXN).
  - Control tipo interruptor (*toggle*) para suspender servicios sin borrarlos del historial de citas.

#### 3. Notificación de Nueva Cita (`P-10`)
* **Objetivo:** Alertar al barbero sobre cambios en su agenda.
* **Elementos UI:**
  - Notificación push del sistema operativo detallando cliente, horario y servicio.
  - Pantalla modal de detalle rápido al abrir la alerta con botones de acción *"Aceptar"* y *"Ver agenda"*.

#### 4. Historial de Ingresos (`P-11`)
* **Objetivo:** Monitoreo financiero del negocio.
* **Elementos UI:**
  - Filtros rápidos por tiempo: *Esta semana* / *Este mes*.
  - Indicador financiero de ingresos totales y variación en porcentaje comparada con el periodo previo.
  - Gráfico de barras interactivo diario del rendimiento de ventas.

---

### 6.4 Inventario General de Pantallas del MVP

| ID | Pantalla | Actor | Descripción | RF Relacionados |
| :---: | :--- | :---: | :--- | :---: |
| **P-01** | Registro | Ambos | Ingreso de número telefónico y rol inicial. | RF-01, RF-02 |
| **P-02** | Validación OTP | Ambos | Verificación mediante código de 6 dígitos enviado por SMS. | RF-01 |
| **P-03** | Búsqueda Barberos | Cliente | Grid de barberos y su disponibilidad. | RF-04, RF-15 |
| **P-04** | Perfil Barbero | Cliente | Galería de fotos, catálogo de servicios y reseñas. | RF-03, RF-11, RF-14 |
| **P-05** | Configurar Cita | Cliente | Selección específica de fecha, hora y servicio. | RF-05 |
| **P-06** | Confirmación Cita | Cliente | Notificación visual de éxito y resumen de cita. | RF-05, RF-09 |
| **P-07** | Listado de Citas | Cliente | Historial de citas agendadas por el cliente. | RF-06 |
| **P-08** | Agenda Profesional | Barbero | Agenda interactiva diaria/semanal para gestión. | RF-07, RF-08 |
| **P-09** | Gestión de Catálogo | Barbero | Modificación de precios, nombres y duraciones. | RF-11 |
| **P-10** | Detalle Cita Recibida | Barbero | Ficha técnica de cita abierta desde notificación. | RF-10 |
| **P-11** | Panel de Ingresos | Barbero | Visualización financiera de ganancias semanales/mensuales. | RF-13 |
| **P-12** | Edición Perfil | Ambos | Ajustes de datos generales y carga de portafolio. | RF-03 |

---

## 🏗️ 7. Arquitectura de Software por Capas

### 7.1 Stack Tecnológico Homologado

| Capa | Tecnología | Justificación de Selección |
| :--- | :--- | :--- |
| **Desarrollo Móvil** | React Native 0.74 | Código unificado para iOS y Android que reduce un 40% el tiempo de desarrollo. Gran comunidad y soporte estable de módulos de UI. |
| **Panel Administrativo** | React 18 + Vite | Velocidad de compilación óptima, ligereza y reusabilidad de componentes web. |
| **Backend & API** | Node.js + Express | Servidor ligero ideal para arquitecturas de Route Handlers / Serverless de alta velocidad de respuesta y fácil integración. |
| **Base de Datos** | PostgreSQL 16 (Supabase) | Motor relacional robusto con soporte nativo de UUID, transacciones ACID y excelente integridad referencial. |
| **Caché y Sesiones** | Redis 7 | Almacenamiento rápido en memoria con TTL automático, idóneo para validar OTPs en menos de 5 minutos y controlar cuotas de llamadas API (*rate limiting*). |
| **Almacenamiento** | Cloudflare R2 | Persistencia de imágenes del catálogo de barberos sin costos asociados a transferencia de salida de datos (*egress*). |
| **Pasarela de Pagos** | Conekta | API local optimizada para pagos mediante SPEI y tarjetas en México de forma segura. |
| **Servicio OTP** | Twilio Verify | Servicio robusto con baja latencia para envío y validación de SMS internacionales y locales. |
| **Mensajería Externa** | Meta Cloud API | API oficial de WhatsApp para despachar recordatorios programados sin redirecciones complejas. |

---

### 7.2 Arquitectura Física por Capas

El backend expone una REST API estructurada bajo protocolo cifrado HTTPS y TLS 1.3:

1. **Capa de Clientes (Presentación):** Clientes nativos móviles (iOS/Android) y aplicación administrativa web corporativa.
2. **Capa API Gateway:** Canal único para todas las llamadas del cliente. Procesa autenticación JWT, políticas CORS, enrutamiento seguro y control de límite de tasa de peticiones (*rate limiting*).
3. **Capa lógica de Servicios:** 
   - *Auth Service:* Maneja flujos de inicio, creación de tokens JWT e intercomunicación con Redis para validación OTP.
   - *Booking Service:* Control del estado de la agenda, bloqueos y gestión del calendario.
   - *Notif Service:* Motor de despacho de WhatsApps y notificaciones Push operado por tareas programadas (*cron jobs*).
   - *Payment Service:* Gestión de transacciones mediante Conekta y recepción de webhooks de pago.
4. **Capa de Persistencia (Datos):** Instancia relacional PostgreSQL (Supabase), memoria en caché Redis y CDN de Cloudflare R2.

---

## 🗄️ 8. Modelo de Datos y Especificación de BD

El diseño lógico de base de datos se estructura en **Tercera Forma Normal (3FN)**, implementando UUIDs como llaves primarias en lugar de enteros autoincrementales para mitigar riesgos de seguridad por enumeración (*enumeration attacks*).

### 8.1 Catálogo y Diccionario de Tablas

#### 1. Tabla: `usuarios`
Almacena la información de identidad e inicio de sesión de todos los miembros del sistema.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador único autogenerado por base de datos. |
| **telefono** | VARCHAR(13) | UNIQUE, NOT NULL | Teléfono con prefijo internacional (ej. `+521234567890`). |
| **nombre** | VARCHAR(100) | NOT NULL | Nombre completo provisto en registro. |
| **foto_url** | TEXT | Opcional | Enlace a Cloudflare R2 de la foto de perfil del usuario. |
| **tipo** | ENUM (`cliente`, `barbero`) | NOT NULL | Define las vistas de acceso y permisos de navegación. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Marca de tiempo de registro con zona horaria. |

#### 2. Tabla: `barberos`
Detalla las propiedades operativas particulares de los barberos inscritos.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador único del perfil. |
| **usuario_id** | UUID | FOREIGN KEY | Enlace a `usuarios.id` (Borrado en cascada). |
| **descripcion** | TEXT | Opcional | Resumen profesional visible al cliente. |
| **rating_promedio** | DECIMAL(3,2) | DEFAULT 0.00 | Reputación acumulada calculada automáticamente. |
| **direccion** | VARCHAR(255) | NOT NULL | Ubicación física del establecimiento comercial. |
| **lat** | FLOAT8 | NOT NULL | Latitud geográfica para búsquedas de proximidad. |
| **lng** | FLOAT8 | NOT NULL | Longitud geográfica para búsquedas de proximidad. |
| **activo** | BOOLEAN | DEFAULT TRUE | Estatus operativo del barbero para búsquedas en app. |

#### 3. Tabla: `servicios`
Estructura el catálogo de servicios administrable por cada barbero.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador del servicio. |
| **barbero_id** | UUID | FOREIGN KEY | Enlace a `barberos.id` (Borrado en cascada). |
| **nombre** | VARCHAR(100) | NOT NULL | Nombre comercial del servicio (ej. "Afeitado Clásico"). |
| **duracion_min** | INTEGER | CHECK (>= 15) | Duración en bloques mínimos de 15 minutos. |
| **precio** | DECIMAL(8,2) | CHECK (>= 10.00) | Costo en pesos mexicanos (MXN) del servicio. |
| **activo** | BOOLEAN | DEFAULT TRUE | Control para activar o suspender disponibilidad del servicio. |

#### 4. Tabla: `citas`
Tabla principal de agendamientos del MVP.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador único del agendamiento. |
| **cliente_id** | UUID | FOREIGN KEY | Enlace a `usuarios.id` del cliente. |
| **barbero_id** | UUID | FOREIGN KEY | Enlace a `barberos.id` del barbero asignado. |
| **servicio_id** | UUID | FOREIGN KEY | Enlace a `servicios.id` para capturar precio base original. |
| **fecha_hora** | TIMESTAMPTZ | NOT NULL | Estampa horaria UTC de agendamiento. |
| **estado** | ENUM | NOT NULL | Estatus: `pendiente`, `confirmada`, `en_curso`, `completada`, `cancelada`. |
| **notas** | TEXT | Opcional | Comentarios o peticiones del cliente. |

#### 5. Tabla: `pagos`
Registra las transacciones financieras asociadas a las citas.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador único del pago. |
| **cita_id** | UUID | FOREIGN KEY, UNIQUE | Enlace a `citas.id` (Acción restrictiva para auditorías). |
| **monto** | DECIMAL(8,2) | CHECK (>= 0) | Monto final neto en MXN transferido. |
| **metodo** | ENUM (`tarjeta`, `spei`, `efectivo`) | NOT NULL | Canal transaccional utilizado por el cliente. |
| **referencia_ext** | VARCHAR(100) | UNIQUE | ID provisto por la pasarela Conekta. |
| **estado** | ENUM | NOT NULL | Estatus: `pendiente`, `pagado`, `reembolsado`, `fallido`. |
| **pagado_at** | TIMESTAMPTZ | Opcional | Fecha de acreditación de fondos. |

#### 6. Tabla: `calificaciones`
Almacena las evaluaciones del servicio provistas por los clientes tras completar sus citas.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador único del registro. |
| **cita_id** | UUID | FOREIGN KEY, UNIQUE | Enlace a `citas.id` (Garantiza una sola reseña por cita). |
| **cliente_id** | UUID | FOREIGN KEY | Enlace a `usuarios.id` para fines de auditoría. |
| **estrellas** | INTEGER | CHECK (BETWEEN 1 AND 5) | Reputación en rango numérico de 1 a 5. |
| **comentario** | VARCHAR(500) | Opcional | Reseña escrita. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de registro del feedback. |

#### 7. Tabla: `verificaciones_otp`
Gestiona el estado y validación de los códigos SMS enviados a los usuarios para el registro e inicio de sesión.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador único del registro OTP. |
| **telefono** | VARCHAR | NOT NULL | Número de teléfono asociado al código. |
| **codigo_hash** | VARCHAR | NOT NULL | Hash criptográfico del OTP de 6 dígitos. |
| **intentos** | INTEGER | DEFAULT 0 | Contador para mitigar ataques de fuerza bruta. |
| **expira_at** | TIMESTAMPTZ | NOT NULL | Marca de tiempo límite de validez del OTP. |
| **bloqueado_hasta** | TIMESTAMPTZ | Opcional | Tiempo de penalización tras exceder intentos. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de generación del código. |

#### 8. Tabla: `codigos_invitacion`
Sistema de referidos o accesos exclusivos al registro de nuevos usuarios.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador del código. |
| **codigo** | VARCHAR | UNIQUE, NOT NULL | Código alfanumérico que el usuario debe ingresar. |
| **usado** | BOOLEAN | DEFAULT FALSE | Bandera para indicar si el código ya fue reclamado. |
| **usado_por** | VARCHAR | Opcional | Referencia de quién redimió el código. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |

#### 9. Tabla: `horario_base`
Estructura semanal estática de horas hábiles que cada barbero configura.

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador único del bloque. |
| **barbero_id** | UUID | FOREIGN KEY | Enlace al perfil del barbero (`barberos.id`). |
| **dia_semana** | SMALLINT | CHECK (0 - 6) | Representación numérica (0=Domingo, 6=Sábado). |
| **hora_inicio** | TIME | NOT NULL | Hora de apertura del turno. |
| **hora_fin** | TIME | NOT NULL | Hora de cierre del turno. |
| **activo** | BOOLEAN | DEFAULT TRUE | Habilita o deshabilita este día de la semana. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación del bloque. |

#### 10. Tabla: `horarios_bloqueados`
Excepciones temporales a la agenda (vacaciones, comida, eventos personales).

| Campo | Tipo de Datos | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | Identificador de la excepción. |
| **barbero_id** | UUID | FOREIGN KEY | Enlace al perfil del barbero (`barberos.id`). |
| **fecha** | DATE | NOT NULL | Fecha exacta del bloqueo de agenda. |
| **hora_inicio** | TIME | Opcional | Inicio del bloqueo (si es NULL asume día completo). |
| **hora_fin** | TIME | Opcional | Fin del bloqueo. |
| **motivo** | VARCHAR | Opcional | Razón personal o administrativa del bloqueo. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación. |

---

### 8.2 Integridad y Relaciones

- **Relación Usuarios - Barberos:** Tipo `1:1 opcional`. Un registro de usuario enlazado como barbero cuenta con exactamente un registro en la tabla `barberos`.
- **Relación Citas - Pagos:** Tipo `1:1 opcional`. Una cita de agendamiento genera como máximo un pago. Se implementa restricción de borrado `ON DELETE RESTRICT` en la llave foránea para fines contables y de auditoría interna de ingresos.
- **Relación Citas - Calificaciones:** Tipo `1:1 opcional`. Una cita de agendamiento solo puede ser calificada una única vez.

---

## 📈 9. Plan de Implementación y Sprints

El ciclo de desarrollo técnico se divide en 5 bloques programados secuenciales:

* **Sprint 1 (Autenticación e Identidad):** Implementación de base de datos relacional y configuración del servidor de caché Redis. Desarrollo de flujo de entrada de registro e inicio de sesión SMS con verificación OTP y generación de tokens JWT (`RF-01`, `RF-02`).
* **Sprint 2 (Servicios y Disponibilidad):** Creación del catálogo de servicios del barbero. Desarrollo del calendario lógico en frontend y lógica de slots libres y ocupados en backend (`RF-04`, `RF-08`, `RF-11`).
* **Sprint 3 (Motor de Reservas):** Flujo de agendamiento, confirmación táctil del cliente, panel de agenda para el profesional y cancelación lógica de citas (`RF-05`, `RF-06`, `RF-07`).
* **Sprint 4 (Pagos e Ingresos):** Integración con la pasarela de pagos Conekta para pagos SPEI/Tarjeta. Registro de transacciones y panel analítico de ingresos semanal del barbero (`RF-12`, `RF-13`).
* **Sprint 5 (Notificaciones y Reputación):** Inserción del motor de calificaciones. Integración de mensajería automatizada Meta WhatsApp Cloud API y alertas automáticas mediante FCM (`RF-09`, `RF-10`, `RF-14`).
