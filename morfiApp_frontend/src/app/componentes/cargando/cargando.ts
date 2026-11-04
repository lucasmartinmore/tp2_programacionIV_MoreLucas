import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../servicios/auth';

@Component({
  selector: 'app-cargando',
  styleUrl: './cargando.css',
  templateUrl: './cargando.html',
})
export class Cargando implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit() {
    // Sin token guardado no hay nada que validar ---> login
    if (!this.auth.token()) {
      this.router.navigate(['/login']);
      return;
    }
    // Con token: preguntamos al back si sigue siendo valido
    this.auth.autorizar().subscribe({
      // Valido ---> a publicaciones
      next: () => this.router.navigate(['/publicaciones']),
      // Invalido o vencido ---> login (el interceptor ya limpio la sesión)
      error: () => this.router.navigate(['/login']),
    });
  }
}