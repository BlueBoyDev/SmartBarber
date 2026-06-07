import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/barbero/citas?barbero_id=xxx&fecha=2026-06-06
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barbero_id = searchParams.get('barbero_id');
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];

    if (!barbero_id) {
      return NextResponse.json({ error: 'barbero_id requerido.' }, { status: 400 });
    }

    const fechaInicio = `${fecha}T00:00:00.000Z`;
    const fechaFin = `${fecha}T23:59:59.999Z`;

    const { data: citas, error } = await supabaseAdmin
      .from('citas')
      .select(`
        id,
        fecha_hora,
        estado,
        notas,
        cliente:cliente_id (
          id,
          nombre,
          telefono
        ),
        servicio:servicio_id (
          id,
          nombre,
          duracion_min,
          precio
        )
      `)
      .eq('barbero_id', barbero_id)
      .gte('fecha_hora', fechaInicio)
      .lte('fecha_hora', fechaFin)
      .order('fecha_hora', { ascending: true });

    if (error) {
      console.error('Error citas:', error);
      return NextResponse.json({ error: 'Error al obtener las citas.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, citas: citas || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor.' }, { status: 500 });
  }
}

// PATCH /api/barbero/citas  → actualizar estado de una cita
export async function PATCH(request: Request) {
  try {
    const { cita_id, estado } = await request.json();

    const estadosValidos = ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada'];
    if (!cita_id || !estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('citas')
      .update({ estado })
      .eq('id', cita_id);

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar la cita.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor.' }, { status: 500 });
  }
}