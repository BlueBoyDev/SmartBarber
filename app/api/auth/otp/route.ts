import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    // 1. Validar formato telefónico (10 dígitos en México)
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Ingresa un número de 10 dígitos válido.' }, { status: 400 });
    }

    const normalizedPhone = `+52${phone}`;

    // 2. Comprobar si el número está bloqueado temporalmente (anti-fuerza bruta)
    const { data: activeBlock, error: blockError } = await supabase
      .from('verificaciones_otp')
      .select('bloqueado_hasta')
      .eq('telefono', normalizedPhone)
      .gt('bloqueado_hasta', new Date().toISOString())
      .order('bloqueado_hasta', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (blockError) {
  // Agrega esta línea:
  console.error('blockError:', JSON.stringify(blockError));
  return NextResponse.json({ error: 'Error al verificar bloqueo de seguridad.' }, { status: 500 });
}

    if (activeBlock) {
      const minutesRemaining = Math.ceil(
        (new Date(activeBlock.bloqueado_hasta).getTime() - Date.now()) / 1000 / 60
      );
      return NextResponse.json({ 
        error: `Número bloqueado temporalmente. Intenta de nuevo en ${minutesRemaining} minuto(s).` 
      }, { status: 429 });
    }

    // 3. Generar un OTP aleatorio de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    // Tiempo de expiración a 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 4. Invalidar verifcaciones previas para este teléfono (evitar duplicados activos)
    await supabase
      .from('verificaciones_otp')
      .delete()
      .eq('telefono', normalizedPhone)
      .lt('expira_at', new Date().toISOString());

    // 5. Registrar el nuevo OTP en base de datos
    const { error: insertError } = await supabase
      .from('verificaciones_otp')
      .insert([
        {
          telefono: normalizedPhone,
          codigo_hash: otpHash,
          intentos: 0,
          expira_at: expiresAt
        }
      ]);

    if (insertError) {
      return NextResponse.json({ error: 'Error al registrar código de verificación.' }, { status: 500 });
    }

    // 6. Enviar OTP (Simulación local para portafolio)
    // Devolvemos el OTP generado en la respuesta para facilitar la prueba local al usuario.
    return NextResponse.json({
      success: true,
      message: 'Código de verificación SMS enviado (Simulación).',
      simulatedOTP: otpCode
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}
