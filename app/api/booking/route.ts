import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Extraemos barberoId y rawTime (que es el "14:30" real)
    const { service, serviceId, date, rawTime, name, phone, barberoId } = body;

    // Validación Básica
    if (!name || phone.length < 10 || !barberoId || !serviceId || !rawTime || !date) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    // 1. Validar/Crear Cliente
    const normalizedPhone = `+52${phone}`;
    let clienteId = null;
    
    // Primero, verificamos si existe un usuario con este teléfono
    const { data: user } = await supabase
      .from('usuarios')
      .select('id')
      .eq('telefono', normalizedPhone)
      .maybeSingle();

    if (user) {
      clienteId = user.id;
    } else {
      // Si no existe, creamos el usuario tipo cliente
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert([{ telefono: normalizedPhone, nombre: name, tipo: 'cliente' }])
        .select('id')
        .single();
        
      if (createError) throw createError;
      clienteId = newUser.id;
    }

    // 2. Combinar fecha (ISO 8601) con hora
    // date viene como string YYYY-MM-DD
    const fechaHora = new Date(`${date}T${rawTime}:00`).toISOString();

    // 3. Insertar la cita en la base de datos
    const { error: insertError } = await supabase
      .from('citas')
      .insert([{
        cliente_id: clienteId,
        barbero_id: barberoId,
        servicio_id: serviceId,
        fecha_hora: fechaHora,
        estado: 'pendiente'
      }]);

    if (insertError) {
      console.error('Error insertando cita:', insertError);
      return NextResponse.json({ error: 'Error al registrar la cita.' }, { status: 500 });
    }

    // 4. Simulación de SMS (como estaba en el portfolio original)
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({ 
      success: true, 
      message: 'Cita guardada correctamente y SMS simulado',
      simulatedOTP: '1234'
    });

  } catch (error) {
    console.error('Error in /api/booking:', error);
    return NextResponse.json({ error: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}
