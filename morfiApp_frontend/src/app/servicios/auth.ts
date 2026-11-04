import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// Router para llevar al login cuando vence la sesión
import { Router } from '@angular/router';
import { map, tap } from 'rxjs';// tap = "hacer algo con la respuesta sin cambiarla"; map = transformarla
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario';
import { ModalService } from './modal';// El modal para preguntar por la sesion 

// Lo que ahora devuelven login y registro
interface RespuestaAuth {
  usuario: Usuario;
  token: string;
}

// Claves con las que guardo en localStorage
const CLAVE_USUARIO = 'usuarioRedSocial';
const CLAVE_TOKEN = 'tokenRedSocial';
const AVISO_ANTES_DE_VENCER_MS = 10 * 1000; // 10 segundos

@Service()
export class Auth {
  // Herramientas que necesita este servicio (con inject(), como pide @Service)
  private http = inject(HttpClient);
  private modal = inject(ModalService);
  private router = inject(Router);

  // Usuario logueado (signal) o null; arranca con lo guardado
  usuario = signal<Usuario | null>(this.leerUsuario());
  // Temporizadores activos (para poder cancelarlos)
  private temporizadorAviso?: ReturnType<typeof setTimeout>;
  private temporizadorVencimiento?: ReturnType<typeof setTimeout>;

   

  // Registro: el back devuelve { usuario, token }
  // guardo la sesión y devuelvo el usuario
  register(datos: FormData) {
    return this.http.post<RespuestaAuth>(`${environment.apiUrl}/auth/register`, datos).pipe(
      tap((r) => this.guardarSesion(r)),
      map((r) => r.usuario),
    );
  }

  //Login: igual que el registro
  //los component reciben un usuario
  login(identificador: string, password: string) {
    return this.http.post<RespuestaAuth>(`${environment.apiUrl}/auth/login`, { identificador, password }).pipe(
      tap((r) => this.guardarSesion(r)),
      map((r) => r.usuario),
    );
  }

  // POST /auth/autorizar: Valido mi token
  //  Devuelvo mis datos actuales
  autorizar() {
    return this.http.post<Usuario>(`${environment.apiUrl}/auth/autorizar`, {}).pipe(
      tap((usuario) => {
        this.guardarUsuario(usuario);// Actualizo el usuario con los datos frescos
        // Reinicio los avisos segun el token guardado
        this.programarAvisos();
      }),
    );
  }

  // POST /auth/refrescar
  // pido un token nuevo (otros 15s)
  refrescar() {
    return this.http.post<{ token: string }>(`${environment.apiUrl}/auth/refrescar`, {}).pipe(
      tap((r) => {
        localStorage.setItem(CLAVE_TOKEN, r.token);
        this.programarAvisos();
      }),
    );
  }

  // Devuelve el token guardado (o null)
  // El interceptor lo usa en cada pedido
  token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  // Cierra la sesion 
  // borra todo y cancela los avisos
  logout() {
    this.cancelarAvisos();
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuario.set(null);
  }

  // Guarda token y usuario 
  // arranca el contador
  private guardarSesion(r: RespuestaAuth) {
    localStorage.setItem(CLAVE_TOKEN, r.token);
    this.guardarUsuario(r.usuario);
    this.programarAvisos();
  }

  // Guarda el usuario en localStorage y en el signal
  private guardarUsuario(usuario: Usuario) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  // Leo el usuario guardado (null si no hay)
  private leerUsuario(): Usuario | null {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    return guardado ? JSON.parse(guardado) : null;
  }

  // Lee "exp" (vencimiento, en segundos) del payload del token
  //  El payload es la parte del medio
  private vencimientoMs(): number | null {
    const token = this.token();
    if (!token) return null;
    try {
      // base64url
      // atob lo decodifica; JSON.parse lo convierte en objeto
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000; // exp está en segundos; lo paso a milisegundos
    } catch {
      return null;
    }
  }

  // Programa el aviso a vencer a los 5s
  // y el cierre de sesion al vencer
  private programarAvisos() {
    this.cancelarAvisos();
    const exp = this.vencimientoMs();
    if (!exp) return;
    // Cuanto falta para el aviso 
    // si ya pas, avisa enseguida
    const paraAviso = Math.max(0, exp - Date.now() - AVISO_ANTES_DE_VENCER_MS);
    const paraVencer = Math.max(0, exp - Date.now());
    this.temporizadorAviso = setTimeout(() => this.preguntarExtension(), paraAviso);
    this.temporizadorVencimiento = setTimeout(() => this.vencio(), paraVencer);
  }

  // Modal de confirmacion: si acepta, refresco el token 
  //el 401, si pasara, lo maneja el interceptor
  private preguntarExtension() {
    // El texto se arma con el valor de AVISO_ANTES_DE_VENCER_MS, asi nunca queda desactualizado
    const segundos = AVISO_ANTES_DE_VENCER_MS / 1000;
    const tiempo = segundos >= 60 ? `${segundos / 60} minutos` : `${segundos} segundos`;
    this.modal.confirmar('Tu sesión está por vencer', `Te quedan ${tiempo} de sesión. ¿Querés extenderla?`, () =>
      this.refrescar().subscribe({ error: () => {} }),
    );
  }

  // La sesion vencio
  // cierro y mando al login
  private vencio() {
    this.logout();
    this.modal.mostrar('info', 'Sesión vencida', 'Volvé a iniciar sesión.');
    this.router.navigate(['/login']);
  }

  // Cancela los temporizadores 
  private cancelarAvisos() {
    clearTimeout(this.temporizadorAviso);
    clearTimeout(this.temporizadorVencimiento);
  }
}