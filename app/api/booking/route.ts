import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Recibir la información del cliente
    const body = await request.json();
    const { service, date, time, name, phone } = body;

    // Validación Básica (Seguridad Backend)
    if (!name || phone.length < 10) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    // 2. Aquí iría la lógica oficial con Supabase para insertar a la base de datos
    // await supabase.from('citas').insert([{ service, date, time, name, phone, status: 'pending' }]);

    // 3. Simulación de envío de SMS (OTP)
    // Para no generar costos en el portafolio, fingimos un retraso de red de 2 segundos.
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Respondemos con éxito
    return NextResponse.json({ 
      success: true, 
      message: 'Código SMS de verificación enviado (simulación)',
      simulatedOTP: '1234'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}
