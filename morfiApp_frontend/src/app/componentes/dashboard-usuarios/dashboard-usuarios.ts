import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../servicios/auth';
import { UsuariosService } from '../../servicios/usuarios';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { PATRON_PASSWORD, clavesCoincidenValidator, fechaNoFuturaValidator } from '../../validators/usuario.validators';
import { Usuario } from '../../models/usuario';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-dashboard-usuarios',
  styleUrl: './dashboard-usuarios.css',
  templateUrl: './dashboard-usuarios.html',
})
export class DashboardUsuarios implements OnInit {
  private service = inject(UsuariosService);
  private modal = inject(ModalService);
  protected auth = inject(Auth);

  // Lista de usuarios y estados de carga
  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  enviando = signal(false);
  // Foto opcional del usuario nuevo
  archivo: File | null = null;

  // La contraseña va en una variable aparte porque "repetir contraseña" 
  // necesita compararse con ella (igual que en el registro)
  controlPassword = new FormControl('', [Validators.required, Validators.pattern(PATRON_PASSWORD)]);

  // Formulario de alta:
  // mismos datos que el registro 
  form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
    password: this.controlPassword,
    // Validator propio: compara con la contraseña
    repetirPassword: new FormControl('', [Validators.required, clavesCoincidenValidator(this.controlPassword)]),
    fechaNacimiento: new FormControl('', [Validators.required, fechaNoFuturaValidator()]),
    descripcion: new FormControl('', [Validators.maxLength(200)]),
    // nonNullable: al hacer reset() vuelve a 'usuario' y nunca queda null
    perfil: new FormControl<'usuario' | 'administrador'>('usuario', { nonNullable: true }),
  });

  // Al abrir la pantalla, traigo la lista
  ngOnInit() {
    this.cargar();
    // Si cambia la contraseña DESPUES de repetirla
    // hay que volver a comprobar que coincidan
    this.controlPassword.valueChanges.subscribe(() => this.form.controls.repetirPassword.updateValueAndValidity());
  }

  cargar() {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }

  // Mensaje de error de un campo de contraseña 
  // (null si esta bien o todavia no lo toco)
  mensaje(campo: string): string | null {
    const c = this.form.get(campo);
    if (!c || !c.touched || !c.errors) return null;
    if (c.hasError('required')) return 'Este campo es obligatorio';
    if (c.hasError('pattern')) return 'Mínimo 8 caracteres, una mayúscula y un número';
    // Error de mi validator propio: claves distintas
    if (c.hasError('losControlesNoCoinciden')) return 'Las contraseñas no coinciden';
    return 'Valor inválido';
  }

  // soy yo?
  //(no me puedo auto deshabilitar)
  esYo(u: Usuario) {
    return u._id === this.auth.usuario()?._id;
  }

  // Habilita o deshabilita
  // Para deshabilitar pido confirmacion
  alternar(u: Usuario) {
    if (u.activo) {
      this.modal.confirmar('Deshabilitar usuario', `¿Deshabilitar a @${u.username}? No podrá ingresar.`, () =>
        this.cambiar(this.service.deshabilitar(u._id)),
      );
    } else {
      this.cambiar(this.service.habilitar(u._id));
    }
  }

  // Ejecuta la peticion y reemplaza esa fila con el usuario actualizado que devuelve el back
  private cambiar(peticion: ReturnType<UsuariosService['habilitar']>) {
    peticion.subscribe({
      next: (actualizado) =>
        this.usuarios.update((lista) => lista.map((x) => (x._id === actualizado._id ? actualizado : x))),
      error: (err: HttpErrorResponse) => this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err)),
    });
  }

  alElegirArchivo(evento: Event) {
    this.archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
  }

  // Crea un usuario nuevo
  crear() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Separo repetirPassword del resto: es solo para el front 
    // y el back rechaza campos desconocidos (400)
    const { repetirPassword, ...datos } = this.form.getRawValue();

    const formData = new FormData();
    Object.entries(datos).forEach(([clave, valor]) => formData.append(clave, valor ?? ''));
    if (this.archivo) formData.append('imagenPerfil', this.archivo);

    this.enviando.set(true);
    this.service.crear(formData).subscribe({
      next: (nuevo) => {
        this.enviando.set(false);
        // Lo pongo arriba de la lista
        //  y limpioel form
        this.usuarios.update((lista) => [nuevo, ...lista]);
        this.form.reset();
        this.archivo = null;
        this.modal.mostrar('exito', 'Usuario creado', `@${nuevo.username} ya puede ingresar.`);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }
}