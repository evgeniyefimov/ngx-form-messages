Angular components for validation messages, like ngMessages. Contains default messages for common errors which can be
overriden or extended through config or content projection. By default show errors when form is `submitted` or control
is `touched`, can be changed through `Input`.

### Install

1. install by running `npm i ngx-form-messages`
2. Add `NgxFormMessagesModule` to your module imports

### Basic usage

Just give it control, that's all.

```
<form [formGroup]="form">
  <input formControlName="controlName" />
    <ngx-form-messages [control]="form.controls.controlName">
    </ngx-form-messages>
</form>
```

### Api

`ngx-form-messages`

| Name      | Type                                                  | Description                                      |
| --------- | ----------------------------------------------------- | ------------------------------------------------ |
| [single]  | `boolean`                                             | Show only first error. Default `false`           |
| [control] | `AbstractFormControl`                                 | This field is required.                          |
| [when]    | <code>"touched" &#124; "dirty" &#124; "always"</code> | State of form control when to show error message |

`ngx-form-message`

| Name    | Type     | Description                                |
| ------- | -------- | ------------------------------------------ |
| [error] | `string` | Name of an error in abstract form control. |

### Config

NgxFormMessages has some predefined messages

- required: Field is required
- email: Invalid email address
- pattern: Field is invalid
- min: Field must be no less than ${min}
- max: Field must be no greater than ${max}
- minlength: Field must be longer than ${requiredLength} characters
- maxlength: Field must be no longer than ${requiredLength} characters

You can override existing messages or add custom messages if provide factory function for custom config through
InjectionToken.

```
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule , ReactiveFormsModule} from '@angular/forms';
import { AppComponent } from './app.component';
import { NGX_FORM_MESSAGE_CONFIG, NgxFormMessageConfig } from 'ngx-form-messages';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    NgxFormValidationsModule
  ],
  providers: [{
    provide: NGX_FORM_MESSAGE_CONFIG,
    useValue: (): NgxFormMessageConfig => {
      return {
        custom: () => "Custom error message"
        email: () => "Overridden email message",
      };
    },
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Factory function signature is:
`export type NgxFormMessageConfigFactory = () => NgxFormMessageConfig | Promise<NgxFormMessageConfig> | Observable<NgxFormMessageConfig>;`
So it can return simple object, promise or observable. In case of promise or observable you can change messages in time,
lib handles changes reactively.

Signature of config:

```
export type NgxFormMessageConfig = {
  readonly email?: (payload: boolean) => string;
  readonly max?: (payload: { actual: string | number, max: number }) => string;
  readonly maxlength?: (payload: { actualLength: number, requiredLength: number }) => string;
  readonly min?: (payload: { actual: string | number, min: number }) => string;
  readonly minlength?: (payload: { actualLength: number, requiredLength: number }) => string;
  readonly required?: (payload: boolean) => string;
  readonly pattern?: (payload: boolean) => string;
  readonly [key: string]: any;
}
```

### Projected messages

You can add new messages or override existing ones with content projection and `NgxFormMessageComponent`

```
<form [formGroup]="form">
  <input formControlName="controlName" />
  <ngx-form-messages [control]="form.controls.controlName">
    <ngx-form-message error="custom">This is a custom error</ngx-form-message>
    <ngx-form-message error="required">Override required error</ngx-form-message>
  </ngx-form-messages>
</form>
```
