import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barberoId = searchParams.get('barbero_id');

    if (!barberoId) {
      return NextResponse.json({ success: false, error: 'barbero_id es requerido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('servicios')
      .select('*')
      .eq('barbero_id', barberoId)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, servicios: data });
  } catch (error) {
    console.error('Error fetching servicios:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener servicios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barbero_id, nombre, duracion_min, precio } = body;

    if (!barbero_id || !nombre || !duracion_min || !precio) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (duracion_min < 15 || duracion_min % 15 !== 0) {
      return NextResponse.json({ success: false, error: 'La duración debe ser múltiplo de 15' }, { status: 400 });
    }

    if (precio < 10) {
      return NextResponse.json({ success: false, error: 'El precio mínimo es $10' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('servicios')
      .insert([{ barbero_id, nombre, duracion_min, precio, activo: true }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, servicio: data });
  } catch (error) {
    console.error('Error creating servicio:', error);
    return NextResponse.json({ success: false, error: 'Error al crear servicio' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, duracion_min, precio } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de servicio es requerido' }, { status: 400 });
    }

    if (duracion_min && (duracion_min < 15 || duracion_min % 15 !== 0)) {
      return NextResponse.json({ success: false, error: 'La duración debe ser múltiplo de 15' }, { status: 400 });
    }

    if (precio !== undefined && precio < 10) {
      return NextResponse.json({ success: false, error: 'El precio mínimo es $10' }, { status: 400 });
    }

    const updates: any = {};
    if (nombre) updates.nombre = nombre;
    if (duracion_min) updates.duracion_min = duracion_min;
    if (precio !== undefined) updates.precio = precio;

    const { data, error } = await supabaseAdmin
      .from('servicios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, servicio: data });
  } catch (error) {
    console.error('Error updating servicio:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar servicio' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de servicio es requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('servicios')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting servicio:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar servicio' }, { status: 500 });
  }
}
