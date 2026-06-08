import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';


// ─── GET: obtener jornada base + bloqueos del mes ───────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const barbero_id = searchParams.get('barbero_id');
  const mes = searchParams.get('mes'); // formato YYYY-MM

  if (!barbero_id) {
    return NextResponse.json({ success: false, error: 'barbero_id requerido' }, { status: 400 });
  }

  // Jornada base
  const { data: jornadaBase, error: errBase } = await supabaseAdmin
    .from('horario_base')
    .select('*')
    .eq('barbero_id', barbero_id)
    .order('dia_semana');

  if (errBase) {
    return NextResponse.json({ success: false, error: errBase.message }, { status: 500 });
  }

  // Bloqueos del mes (si se proporciona)
  let bloqueos: object[] = [];
  if (mes) {
    const inicio = `${mes}-01`;
    // último día del mes
    const [anio, numMes] = mes.split('-').map(Number);
    const ultimoDia = new Date(anio, numMes, 0).getDate();
    const fin = `${mes}-${String(ultimoDia).padStart(2, '0')}`;

    const { data: bloqueosMes, error: errBloqueos } = await supabaseAdmin
      .from('horarios_bloqueados')
      .select('*')
      .eq('barbero_id', barbero_id)
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha')
      .order('hora_inicio');

    if (errBloqueos) {
      return NextResponse.json({ success: false, error: errBloqueos.message }, { status: 500 });
    }
    bloqueos = bloqueosMes ?? [];
  }

  return NextResponse.json({ success: true, jornadaBase: jornadaBase ?? [], bloqueos });
}

// ─── POST: crear o actualizar jornada base / agregar bloqueo ─────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tipo, barbero_id } = body;

  if (!barbero_id) {
    return NextResponse.json({ success: false, error: 'barbero_id requerido' }, { status: 400 });
  }

  // --- Guardar jornada base ---
  if (tipo === 'jornada') {
    const { dias } = body as {
      dias: { dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[];
      tipo: string;
      barbero_id: string;
    };

    if (!dias || !Array.isArray(dias)) {
      return NextResponse.json({ success: false, error: 'dias[] requerido' }, { status: 400 });
    }

    const rows = dias.map(d => ({ ...d, barbero_id }));

    // Upsert por barbero_id + dia_semana
    const { error } = await supabaseAdmin
      .from('horario_base')
      .upsert(rows, { onConflict: 'barbero_id,dia_semana' });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // --- Agregar bloqueo ---
  if (tipo === 'bloqueo') {
    const { fecha, hora_inicio, hora_fin, motivo } = body as {
      fecha: string;
      hora_inicio?: string;
      hora_fin?: string;
      motivo?: string;
      tipo: string;
      barbero_id: string;
    };

    if (!fecha) {
      return NextResponse.json({ success: false, error: 'fecha requerida' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('horarios_bloqueados')
      .insert({
        barbero_id,
        fecha,
        hora_inicio: hora_inicio ?? null,
        hora_fin: hora_fin ?? null,
        motivo: motivo ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, bloqueo: data });
  }

  return NextResponse.json({ success: false, error: 'tipo inválido. Usa "jornada" o "bloqueo"' }, { status: 400 });
}

// ─── DELETE: eliminar un bloqueo ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'id del bloqueo requerido' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('horarios_bloqueados')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
