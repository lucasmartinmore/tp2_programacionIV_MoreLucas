/**
 * Clase que hace un trabajo y que cualquier componente
 * puede pedir. Hay una unica instancia para toda la app (singleton)
 * Es el unico que habla con el back para registrar y loguear, y recuerda quien esta logueado
 * Se conecta por HTTP con el back (POST /auth/register y /auth/login); lo usan Registro, Login,
 * Navbar y MiPerfil.
 *
 * - ¿Por qué FormData en el registro? Porque viaja una imagen; un JSON no puede llevar archivos
 * - ¿Dónde guardás al usuario logueado? En un signal (avisa a la pantalla cuando cambia) y en localStorage
 *   (lo conserva al recargar). En el Sprint 3 se guarda también el token JWT
 */
import { Service, inject, signal } from '@angular/core';// 
import { HttpClient } from '@angular/common/http';// HttpClient = la herramienta de Angular para hacer peticiones HTTP
import { tap } from 'rxjs';// tap = operador de RxJS: permite "espiar" la respuesta (hacer algo con ella) sin modificarla
import { environment } from '../../environments/environment';// environment = objeto con la URL del back (cambia entre tu compu y producción)
import { Usuario } from '../models/usuario';

// Nombre con el que guardamos al usuario en localStorage (la "memoria" del navegador)
const CLAVE_STORAGE = 'usuarioDeMorfiApp';

@Service()
export class Auth {

  private http = inject(HttpClient);
  usuario = signal<Usuario | null>(this.leerGuardado());// Arranca con lo que haya en localStorage (o null si no hay nadie logueado)

  // Registro: recibe un FormData (datos del formulario + imagen) y lo manda al back
  // No hay que escribir el Content-Type a mano porque el navegador lo completa solo con FormData
  // Devuelve un Observable (petición que NO se hace hasta que alguien llama a .subscribe())
  register(datos: FormData) {
    // post<Usuario> = POST con la respuesta tipada como Usuario; datos es el cuerpo enviado
    return this.http.post<Usuario>(`${environment.apiUrl}/auth/register`, datos);
  }

  
  login(identificador: string, password: string) {// Login: manda contraseña como JSON
    // Empezamos la petición POST con un objeto { identificador, password } como cuerpo (se convierte en JSON)
    return this.http.post<Usuario>(`${environment.apiUrl}/auth/login`, { identificador, password })
      // pipe = encadena operadores sobre la respuesta; tap guarda al usuario SOLO si el back respondió bien (200)
      .pipe(tap((usuario) => this.guardar(usuario)));
  }

  // Cerrar sesión
  logout() {
    // Borramos al usuario de la memoria del navegador
    localStorage.removeItem(CLAVE_STORAGE);
    // Y del signal (null = nadie logueado); la navbar se actualiza sola
    this.usuario.set(null);
  }

  // Guarda al usuario en localStorage y en el signal
  private guardar(usuario: Usuario) {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(usuario));// localStorage solo guarda texto, por eso JSON.stringify convierte el objeto a texto
    this.usuario.set(usuario);// Actualizamos el signal para que las pantallas se enteren
  }

  // Lee lo guardado en localStorage; devuelve el usuario o null si no hay nada
  private leerGuardado(): Usuario | null {
    const guardado = localStorage.getItem(CLAVE_STORAGE);// getItem devuelve el texto guardado o null si no existe
    return guardado ? JSON.parse(guardado) : null;// Si hay texto, JSON.parse lo convierte de nuevo en objeto; si no, null
  }
}