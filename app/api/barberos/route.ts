import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('barberos')
      .select(`
        id,
        descripcion,
        rating_promedio,
        activo,
        usuarios (
          nombre,
          foto_url
        ),
        horario_base (
          dia_semana,
          hora_inicio,
          hora_fin,
          activo
        )
      `)
      .eq('activo', true);

    if (error) throw error;

    // Formatear la respuesta para el frontend
    const barberos = data.map((b: any) => ({
      id: b.id,
      nombre: b.usuarios?.nombre || 'Barbero Desconocido',
      fotoUrl: b.usuarios?.foto_url,
      descripcion: b.descripcion,
      rating: b.rating_promedio,
      horarios: b.horario_base || []
    }));

    return NextResponse.json({ barberos });
  } catch (error) {
    console.error('Error fetching barberos:', error);
    return NextResponse.json({ error: 'Error al obtener barberos' }, { status: 500 });
  }
}
