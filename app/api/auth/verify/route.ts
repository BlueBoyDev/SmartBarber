import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { signJWT } from '@/lib/jwt';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { phone, otp, role, codigoInvitacion } = await request.json();

    if (!phone || !otp || !role) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    if (!['cliente', 'barbero'].includes(role)) {
      return NextResponse.json({ error: 'Rol no valido.' }, { status: 400 });
    }

    const normalizedPhone = `+52${phone}`;
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    let codigoData: { id: string; usado: boolean; usado_por: string | null } | null = null;

    if (role === 'barbero') {
      console.log('Buscando usuario con telefono:', normalizedPhone);
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id, tipo')
        .eq('telefono', normalizedPhone)
        .maybeSingle();

      console.log('existingUser encontrado:', existingUser);
      const esBarberoExistente = existingUser?.tipo === 'barbero';
      console.log('esBarberoExistente:', esBarberoExistente);

      if (!esBarberoExistente) {
        if (!codigoInvitacion) {
          return NextResponse.json({ error: 'Codigo de invitacion requerido.' }, { status: 400 });
        }
        const { data: codigo, error: codigoError } = await supabase
          .from('codigos_invitacion')
          .select('id, usado, usado_por')
          .eq('codigo', codigoInvitacion.trim().toUpperCase())
          .maybeSingle();

        if (codigoError || !codigo) {
          return NextResponse.json({ error: 'Codigo de invitacion invalido.' }, { status: 403 });
        }
        if (codigo.usado) {
          return NextResponse.json({ error: 'Este codigo de invitacion ya fue utilizado.' }, { status: 403 });
        }
        codigoData = codigo;
      }
    }

    const { data: verification, error: selectError } = await supabase
      .from('verificaciones_otp')
      .select('*')
      .eq('telefono', normalizedPhone)
      .gt('expira_at', new Date().toISOString())
      .or(`bloqueado_hasta.is.null,bloqueado_hasta.lt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: 'Error al buscar el codigo de verificacion.' }, { status: 500 });
    }
    if (!verification) {
      return NextResponse.json({ error: 'Codigo de verificacion inexistente, caducado o bloqueado.' }, { status: 400 });
    }

    if (verification.codigo_hash !== otpHash) {
      const newAttempts = verification.intentos + 1;
      if (newAttempts >= 3) {
        const blockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabase.from('verificaciones_otp').update({ intentos: newAttempts, bloqueado_hasta: blockUntil }).eq('id', verification.id);
        return NextResponse.json({ error: 'Codigo incorrecto. Limite de intentos excedido. Numero bloqueado por 15 minutos.' }, { status: 429 });
      } else {
        await supabase.from('verificaciones_otp').update({ intentos: newAttempts }).eq('id', verification.id);
        return NextResponse.json({ error: `Codigo incorrecto. Te quedan ${3 - newAttempts} intento(s).` }, { status: 400 });
      }
    }

    await supabase.from('verificaciones_otp').delete().eq('id', verification.id);

    let { data: user, error: userError } = await supabase
      .from('usuarios').select('*').eq('telefono', normalizedPhone).maybeSingle();

    if (userError) {
      return NextResponse.json({ error: 'Error al consultar la existencia del usuario.' }, { status: 500 });
    }

    if (user && user.tipo !== role) {
      const mensajes: Record<string, string> = {
        barbero: 'Este numero esta registrado como cliente. Inicia sesion en la pagina principal.',
        cliente: 'Este numero esta registrado como barbero. Usa el portal de barberos.'
      };
      return NextResponse.json({ error: mensajes[role] || 'Rol incorrecto.' }, { status: 403 });
    }

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
        .insert([{ telefono: normalizedPhone, nombre: 'Usuario Nuevo', tipo: role }])
        .select().single();

      if (insertError) {
        return NextResponse.json({ error: 'Error al registrar la cuenta de usuario.' }, { status: 500 });
      }
      user = newUser;

      if (role === 'barbero') {
        const { error: barberInsertError } = await supabase.from('barberos').insert([{
          usuario_id: user.id,
          descripcion: 'Barbero registrado en la plataforma.',
          direccion: 'Av. Chapultepec 80, Guadalajara, Jal.',
          lat: 20.6725, lng: -103.3688, activo: true
        }]);
        if (barberInsertError) {
          return NextResponse.json({ error: 'Error al inicializar el perfil de barbero.' }, { status: 500 });
        }
        if (codigoData) {
          await supabase.from('codigos_invitacion').update({ usado: true, usado_por: normalizedPhone }).eq('id', codigoData.id);
        }
      }
    }

    const token = signJWT({ id: user.id, telefono: user.telefono, tipo: user.tipo, nombre: user.nombre });

    return NextResponse.json({
      success: true,
      message: 'Verificacion exitosa.',
      user: { id: user.id, nombre: user.nombre, telefono: user.telefono, tipo: user.tipo, fotoUrl: user.foto_url },
      token,
      isNewUser
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ocurrio un error en el servidor.' }, { status: 500 });
  }
}