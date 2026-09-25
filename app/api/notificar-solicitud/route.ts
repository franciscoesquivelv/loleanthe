import { NextResponse } from 'next/server';

/**
 * Aviso por correo de cada solicitud que entra por el sitio.
 *
 * Por qué existe: hasta hoy una solicitud solo se escribía en Firestore y
 * había que acordarse de entrar al admin a mirarla. Peor, cuando las reglas
 * la rechazaban se perdía sin dejar rastro. Este camino corre en el servidor,
 * no depende de las reglas de Firestore ni de la sesión del visitante, y es
 * el que decide si la solicitud se dio por recibida.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// El dominio de Resend funciona sin verificar nada. Cuando loleanthe.com esté
// verificado en Resend, basta con cambiar la variable a algo@loleanthe.com.
const REMITENTE_POR_DEFECTO = 'Loleanthe <onboarding@resend.dev>';

interface Cuerpo {
  name?: string;
  email?: string;
  phone?: string;
  buyerType?: string;
  volume?: string;
  message?: string;
  flowers?: { flowerName?: string }[];
  origen?: string;
}

function escapar(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fila(etiqueta: string, valor?: string): string {
  if (!valor) return '';
  return `<tr>
    <td style="padding:6px 16px 6px 0;color:#746C63;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${escapar(etiqueta)}</td>
    <td style="padding:6px 0;color:#12100E;font-size:15px">${escapar(valor)}</td>
  </tr>`;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.NOTIFICACION_EMAIL;

  if (!apiKey || !destino) {
    console.error('[notificar-solicitud] falta RESEND_API_KEY o NOTIFICACION_EMAIL');
    return NextResponse.json({ ok: false, motivo: 'sin_configurar' }, { status: 503 });
  }

  let datos: Cuerpo;
  try {
    datos = await request.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: 'json_invalido' }, { status: 400 });
  }

  // Mismos topes que las reglas de Firestore, para que un envío gigante no
  // pueda usar esta ruta como amplificador.
  const nombre = (datos.name ?? '').slice(0, 100).trim();
  const correo = (datos.email ?? '').slice(0, 200).trim();
  if (!nombre || !correo) {
    return NextResponse.json({ ok: false, motivo: 'faltan_datos' }, { status: 400 });
  }

  const variedades = (datos.flowers ?? [])
    .slice(0, 50)
    .map((f) => f.flowerName)
    .filter(Boolean)
    .join(', ');

  const mensaje = (datos.message ?? '').slice(0, 2000).trim();
  const asunto = `Solicitud de ${nombre}${variedades ? `: ${variedades.slice(0, 60)}` : ''}`;

  const html = `<div style="font-family:-apple-system,system-ui,sans-serif;background:#F2EFE8;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#FBF9F5;padding:32px">
    <p style="margin:0 0 24px;color:#746C63;font-size:11px;letter-spacing:0.22em;text-transform:uppercase">Nueva solicitud</p>
    <h1 style="margin:0 0 28px;font-family:Georgia,serif;font-weight:300;font-size:28px;line-height:1.1;color:#12100E">${escapar(nombre)}</h1>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #DED8CD">
      ${fila('Correo', correo)}
      ${fila('WhatsApp', (datos.phone ?? '').slice(0, 30))}
      ${fila('Negocio', (datos.buyerType ?? '').slice(0, 60))}
      ${fila('Volumen', (datos.volume ?? '').slice(0, 60))}
      ${fila('Variedades', variedades)}
      ${fila('Viene de', datos.origen === 'contacto' ? 'Formulario de contacto' : 'Página de cotización')}
    </table>
    ${
      mensaje
        ? `<p style="margin:24px 0 0;padding:16px;background:#F2EFE8;color:#12100E;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapar(mensaje)}</p>`
        : ''
    }
    <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #DED8CD">
      <a href="https://loleanthe.com/admin/dashboard" style="color:#12100E;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none">Abrir el panel</a>
    </p>
  </div>
</div>`;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NOTIFICACION_REMITENTE || REMITENTE_POR_DEFECTO,
        to: destino.split(',').map((d) => d.trim()),
        // Responder al correo contesta directo al cliente, sin copiar y pegar.
        reply_to: correo,
        subject: asunto,
        html,
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.error('[notificar-solicitud] Resend respondió', res.status, detalle);
      return NextResponse.json({ ok: false, motivo: 'resend_error' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notificar-solicitud] falló el envío:', err);
    return NextResponse.json({ ok: false, motivo: 'excepcion' }, { status: 502 });
  }
}
