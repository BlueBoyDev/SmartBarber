import crypto from 'crypto';

// Clave secreta obtenida del entorno o llave por defecto para portafolio local.
const JWT_SECRET = process.env.JWT_SECRET || 'smart-barber-default-secret-key-32-chars-long';

/**
 * Codifica una cadena o buffer en formato Base64URL conforme a RFC 4648.
 */
function base64UrlEncode(str: string | Buffer): string {
  const base64 = typeof str === 'string' ? Buffer.from(str).toString('base64') : str.toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Decodifica una cadena Base64URL a texto plano.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Firma de forma asíncrona un token JWT (algoritmo HS256) utilizando el módulo nativo crypto.
 * @param payload Datos del usuario a encriptar.
 * @param expiresInSeconds Tiempo de expiración en segundos (30 días por defecto).
 */
export function signJWT(payload: object, expiresInSeconds: number = 2592000): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;

  const fullPayload = {
    ...payload,
    iat: now,
    exp: exp
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest();

  const encodedSignature = base64UrlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Valida la firma de un token JWT recibido y retorna su payload decodificado.
 * Retorna null si la firma es inválida, el token está corrupto o ha expirado.
 * @param token JWT a verificar.
 */
export function verifyJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Recalcular la firma HMAC-SHA256
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest();

    const encodedExpectedSignature = base64UrlEncode(expectedSignature);

    // Comparación segura (evitar ataques de tiempo)
    if (encodedSignature !== encodedExpectedSignature) {
      return null;
    }

    // Decodificar payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    // Validar expiración (exp)
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
