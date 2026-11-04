import type { Request } from 'express';
// Lo que guardo DENTRO del token (el "payload")
export interface PayloadJwt {
  sub: string;// sub: el _id del usuario 
  email: string;// email del usuario
  username: string;// nombre de usuario
  perfil: 'usuario' | 'administrador';// rol
}

// Un Request de Express al que el guard le agrega "user" con el payload ya verificado
export interface RequestConUsuario extends Request {
  user: PayloadJwt;// user = el payload del token que paso la verif
}