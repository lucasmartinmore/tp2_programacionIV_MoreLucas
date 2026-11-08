import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
// forkJoin = espera a que terminen VARIAS cosas
// timer = espera un tiempo; of = devuelve un valor ya listo
import { catchError, forkJoin, map, of, timer } from 'rxjs';
import { Auth } from '../../servicios/auth';

// Tiempo min que se ve la pantalla de carga (en milisegundos)
const TIEMPO_MINIMO_MS = 1800;

@Component({
  selector: 'app-cargando',
  styleUrl: './cargando.css',
  templateUrl: './cargando.html',
})
export class Cargando implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit() {
    // Validación del token: devuelve true si es valido y false si no 
    const validacion$ = this.auth.token()
      ? this.auth.autorizar().pipe(
          map(() => true), // el back respondio bien = token valido
          catchError(() => of(false)), // el back respondio con error (ej. 401) = no es valido
        )
      : of(false); // no hay token guardado

    // forkJoin espera a la validacion Y el tiempo min 
    // Recien cuando terminan ambas, sigue
    forkJoin([validacion$, timer(TIEMPO_MINIMO_MS)]).subscribe(([valido]) => {
      // Si no es valido, limpio la sesion que quedo guardada
      if (!valido) this.auth.logout();
      // valido = publicaciones; si no = login
      this.router.navigate([valido ? '/publicaciones' : '/login']);
    });
  }
}