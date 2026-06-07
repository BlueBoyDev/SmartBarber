import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(request: Request) {
  try {
    const { usuario_id, nombre } = await request.json();

    if (!usuario_id || !nombre || nombre.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre inválido.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ nombre: nombre.trim() })
      .eq('id', usuario_id);

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar el nombre.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error en el servidor.' }, { status: 500 });
  }
}