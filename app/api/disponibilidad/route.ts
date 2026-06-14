import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barberoId = searchParams.get('barbero_id');
    const fecha = searchParams.get('fecha'); // Formato YYYY-MM-DD

    if (!barberoId || !fecha) {
      return NextResponse.json({ error: 'Faltan parámetros: barbero_id, fecha' }, { status: 400 });
    }

    const targetDate = new Date(`${fecha}T12:00:00`);
    const diaSemana = targetDate.getDay(); // 0 (Dom) - 6 (Sáb)

    // 1. Obtener la jornada base del día
    let { data: jornada } = await supabaseAdmin
      .from('horario_base')
      .select('*')
      .eq('barbero_id', barberoId)
      .eq('dia_semana', diaSemana)
      .maybeSingle();

    if (!jornada) {
      // Verificar si el barbero tiene alguna configuración
      const { count } = await supabaseAdmin
        .from('horario_base')
        .select('*', { count: 'exact', head: true })
        .eq('barbero_id', barberoId);
      
      if (count === 0) {
        // Fallback a horario por defecto: L-S 09:00 - 19:00, Dom inactivo
        jornada = {
          activo: diaSemana !== 0,
          hora_inicio: '09:00',
          hora_fin: '19:00'
        };
      }
    }

    if (!jornada || !jornada.activo) {
      return NextResponse.json({ horarios: [] }); // Día libre
    }

    // 2. Obtener bloqueos de ese día
    const { data: bloqueos } = await supabaseAdmin
      .from('horarios_bloqueados')
      .select('*')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha);

    // Si hay un bloqueo de día completo (hora_inicio es null), retornar vacío
    if (bloqueos && bloqueos.some(b => b.hora_inicio === null)) {
      return NextResponse.json({ horarios: [] });
    }

    // 3. Obtener citas agendadas de ese día
    // fecha_hora viene en UTC o zona local, buscaremos las que coincidan con la fecha
    // Lo más seguro es usar like en la conversión de texto o buscar el rango
    // Para simplificar, obtenemos las del día completo (considerando UTC offsets)
    const fechaInicioIso = new Date(`${fecha}T00:00:00`).toISOString();
    const fechaFinIso = new Date(new Date(`${fecha}T00:00:00`).getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data: citas } = await supabaseAdmin
      .from('citas')
      .select('fecha_hora, servicios(duracion_min)')
      .eq('barbero_id', barberoId)
      .gte('fecha_hora', fechaInicioIso)
      .lt('fecha_hora', fechaFinIso);

    // 4. Generar franjas (slots de 30 min) entre hora_inicio y hora_fin de la jornada
    const slots = [];
    let [hInicio, mInicio] = jornada.hora_inicio.split(':').map(Number);
    let [hFin, mFin] = jornada.hora_fin.split(':').map(Number);

    let currentTime = hInicio * 60 + mInicio;
    const endTime = hFin * 60 + mFin;

    // Helper para convertir string "HH:MM:SS" de BD a minutos
    const timeStrToMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const slotDuration = 30; // Minutos por slot

    while (currentTime < endTime) {
      const slotStart = currentTime;
      const slotEnd = currentTime + slotDuration;

      // Checar si coincide con un bloqueo específico (solapamiento de intervalos)
      const isBlocked = bloqueos?.some(b => {
        if (!b.hora_inicio || !b.hora_fin) return false;
        const bStart = timeStrToMins(b.hora_inicio);
        const bEnd = timeStrToMins(b.hora_fin);
        return slotStart < bEnd && bStart < slotEnd;
      });

      // Checar si coincide con una cita (solapamiento de intervalos)
      const isBooked = citas?.some(c => {
        const citaDate = new Date(c.fecha_hora);
        const citaStart = citaDate.getHours() * 60 + citaDate.getMinutes();
        const duracion = (c.servicios as any)?.duracion_min || 30; 
        const citaEnd = citaStart + duracion;
        return slotStart < citaEnd && citaStart < slotEnd;
      });

      if (!isBlocked && !isBooked) {
        const h = Math.floor(currentTime / 60);
        const m = currentTime % 60;
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayHH = displayH.toString().padStart(2, '0');
        
        // Guardamos el raw "HH:MM" (24h) y el display "HH:MM AM/PM"
        slots.push({
          raw: `${hh}:${mm}`,
          display: `${displayHH}:${mm} ${period}`
        });
      }

      currentTime += 30; // 30 min cada slot
    }

    return NextResponse.json({ horarios: slots });
  } catch (error) {
    console.error('Error calculando disponibilidad:', error);
    return NextResponse.json({ error: 'Error al calcular disponibilidad' }, { status: 500 });
  }
}
