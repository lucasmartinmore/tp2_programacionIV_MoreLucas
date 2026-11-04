/**
 * Validaciones propias. Funcion que mira el valor de un
 * campo y devuelve null si esta ok, o un objeto con el nombre del error si está mal ({ fechaFutura: true }).
 * Se usan en los formularios de Registro y Login.
 *
 * -como valido que las contraseñas sean iguales? Con clavesCoincidenValidator 
 * -se valida tambien en back? Sí: el front se puede saltear, por eso el back vuelve a validar con el DTO
 * -xq un validator es una funcion que devuelve otra funcion? Porque recibe "con quq comparar" y devuelve
 *   la función que Angular ejecuta con cada campo
 */

// AbstractControl: cualquier campo de un formulario; ValidationErrors: objeto de errores; ValidatorFn: tipo "función validadora"
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function clavesCoincidenValidator(controlACoincidir: AbstractControl): ValidatorFn {
  // Devolvemos la funcion que Angular ejecuta cada vez que cambia el campo "repetir contraseña"
  return (control: AbstractControl): ValidationErrors | null => {
    // Si los valores son distintos devolvemos el error; si son iguales, null (= todo bien)
    return control.value !== controlACoincidir.value ? { losControlesNoCoinciden: true } : null;
  };
}

// La fecha de nacimiento no puede ser posterior a hoy
export function fechaNoFuturaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Si el campo está vacio no opinamos (null);
    // de eso se ocupa el validator "required"
    if (!control.value) return null;
    // Convertimos el texto en fecha y la comparamos con hoy: si es mayor (futura) devolvemos el error
    return new Date(control.value) > new Date() ? { fechaFutura: true } : null;
  };
}
export const PATRON_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,}$/;