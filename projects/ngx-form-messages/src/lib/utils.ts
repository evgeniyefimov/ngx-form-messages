import { AbstractControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';

// https://github.com/microsoft/TypeScript/pull/12253#issuecomment-353494273
export function objectKeys<T extends object>(object: T): (keyof T)[] {
  return Object.keys(object) as (keyof T)[];
}

// https://github.com/angular/angular/issues/10887#issuecomment-547392548

/**
 * Extract arguments of function
 */
export type ArgumentsType<F> = F extends (...args: infer A) => any ? A : never;

/**
 * Creates an object like O. Optionally provide minimum set of properties P which the objects must share to conform
 */
type ObjectLike<O extends object, P extends keyof O = keyof O> = Pick<O, P>;

/*
 * Extract a touched changed observable from an abstract control
 * @param control AbstractControl like object with markAsTouched method
 */
export const extractTouchedChanges = (
  control: ObjectLike<AbstractControl, 'markAsTouched' | 'markAsUntouched'>,
): Observable<boolean> => {
  const prevMarkAsTouched = control.markAsTouched;
  const prevMarkAsUntouched = control.markAsUntouched;

  const touchedChanges$ = new Subject<boolean>();

  function nextMarkAsTouched(
    ...args: ArgumentsType<AbstractControl['markAsTouched']>
  ): void {
    touchedChanges$.next(true);
    prevMarkAsTouched.bind(control)(...args);
  }

  function nextMarkAsUntouched(
    ...args: ArgumentsType<AbstractControl['markAsUntouched']>
  ): void {
    touchedChanges$.next(false);
    prevMarkAsUntouched.bind(control)(...args);
  }

  control.markAsTouched = nextMarkAsTouched;
  control.markAsUntouched = nextMarkAsUntouched;

  return touchedChanges$;
};

export const extractDirtyChanges = (
  control: ObjectLike<AbstractControl, 'markAsDirty' | 'markAsPristine'>,
): Observable<boolean> => {
  const prevMarkAsDirty = control.markAsDirty;
  const prevMarkAsPristine = control.markAsPristine;

  const dirtyChanges$ = new Subject<boolean>();

  function nextMarkAsDirty(
    ...args: ArgumentsType<AbstractControl['markAsDirty']>
  ): void {
    dirtyChanges$.next(true);
    prevMarkAsDirty.bind(control)(...args);
  }

  function nextMarkAsPristine(
    ...args: ArgumentsType<AbstractControl['markAsPristine']>
  ): void {
    dirtyChanges$.next(false);
    prevMarkAsPristine.bind(control)(...args);
  }

  control.markAsDirty = nextMarkAsDirty;
  control.markAsPristine = nextMarkAsPristine;

  return dirtyChanges$;
};
