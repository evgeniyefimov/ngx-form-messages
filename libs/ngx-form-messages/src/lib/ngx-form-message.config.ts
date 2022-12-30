import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export enum When {
  dirty = "dirty",
  touched = "touched",
  always = "always",
}

export type WhenType = `${When}`;

export enum NgxFormMessageErrors {
  email = "email",
  max = "max",
  maxlength = "maxlength",
  min = "min",
  minlength = "minlength",
  required = "required",
  pattern = "pattern",
}

export type NgxFormMessageErrorsType = `${NgxFormMessageErrors}`;

export type NgxFormMessageConfig = {
  readonly email?: (payload: boolean) => string;
  readonly max?: (payload: { actual: string | number; max: number }) => string;
  readonly maxlength?: (payload: {
    actualLength: number;
    requiredLength: number;
  }) => string;
  readonly min?: (payload: { actual: string | number; min: number }) => string;
  readonly minlength?: (payload: {
    actualLength: number;
    requiredLength: number;
  }) => string;
  readonly required?: (payload: boolean) => string;
  readonly pattern?: (payload: boolean) => string;
  readonly [key: string]: any;
};

export type NgxFormMessageConfigFactory = () =>
  | NgxFormMessageConfig
  | Promise<NgxFormMessageConfig>
  | Observable<NgxFormMessageConfig>;

export const NGX_FORM_MESSAGE_CONFIG =
  new InjectionToken<NgxFormMessageConfigFactory>("NGX_FORM_MESSAGE_CONFIG");
