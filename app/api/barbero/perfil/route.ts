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
    const { barbero_id, usuario_id, descripcion, nombre, direccion } = body;

    if (!barbero_id) {
      return NextResponse.json({ success: false, error: 'barbero_id requerido.' }, { status: 400 });
    }

    // Actualizar barberos (descripcion y direccion)
    const updateDataBarbero: any = {};
    if (descripcion !== undefined) updateDataBarbero.descripcion = descripcion;
    if (direccion !== undefined) updateDataBarbero.direccion = direccion;

    const { data: barberoData, error: barberoError } = await supabaseAdmin
      .from('barberos')
      .update(updateDataBarbero)
      .eq('id', barbero_id)
      .select()
      .single();

    if (barberoError) {
      return NextResponse.json({ success: false, error: 'Error al actualizar perfil de barbero.' }, { status: 500 });
    }

    // Actualizar usuarios (nombre) si se proporciona
    if (nombre !== undefined && usuario_id) {
      const { error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .update({ nombre })
        .eq('id', usuario_id);
      
      if (usuarioError) {
        return NextResponse.json({ success: false, error: 'Error al actualizar nombre de usuario.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, barbero: barberoData, nombre_actualizado: nombre });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error en el servidor.' }, { status: 500 });
  }
}