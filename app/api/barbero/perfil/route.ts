import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/barbero/perfil?usuario_id=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuario_id = searchParams.get('usuario_id');

    if (!usuario_id) {
      return NextResponse.json({ error: 'usuario_id requerido.' }, { status: 400 });
    }

    const { data: barbero, error } = await supabaseAdmin
      .from('barberos')
      .select('id, descripcion, rating_promedio, direccion, activo')
      .eq('usuario_id', usuario_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Error al obtener perfil.' }, { status: 500 });
    }

    if (!barbero) {
      return NextResponse.json({ error: 'Perfil de barbero no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, barbero });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor.' }, { status: 500 });
  }
}

// PATCH /api/barbero/perfil
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { barbero_id, descripcion } = body;

    if (!barbero_id) {
      return NextResponse.json({ success: false, error: 'barbero_id requerido.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('barberos')
      .update({ descripcion })
      .eq('id', barbero_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: 'Error al actualizar descripción.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, barbero: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error en el servidor.' }, { status: 500 });
  }
}