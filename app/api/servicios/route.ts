import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barberoId = searchParams.get('barbero_id');

    let query = supabaseAdmin.from('servicios').select('*').eq('activo', true);

    if (barberoId) {
      query = query.eq('barbero_id', barberoId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ servicios: data });
  } catch (error) {
    console.error('Error fetching servicios:', error);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}
