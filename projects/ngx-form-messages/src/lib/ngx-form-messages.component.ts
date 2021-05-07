import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Inject,
  Input,
  Optional,
  QueryList,
  ɵisObservable,
  ɵisPromise,
} from '@angular/core';
import { AbstractControl, FormGroupDirective, ValidationErrors } from '@angular/forms';
import { combineLatest, from, Observable, of, ReplaySubject } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

import { NgxFormMessageComponent } from './ngx-form-message.component';
import {
  NgxFormMessageConfig,
  NgxFormMessageConfigFactory,
  NGX_FORM_MESSAGE_CONFIG,
  WhenType,
} from './ngx-form-message.config';
import { extractDirtyChanges, extractTouchedChanges, objectKeys } from './utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-form-messages',
  styleUrls: ['./ngx-form-messages.component.scss'],
  templateUrl: './ngx-form-messages.component.html',
})
export class NgxFormMessagesComponent implements AfterContentInit {
  public readonly afterContentInit$: Observable<void>;
  public readonly control$: Observable<AbstractControl | undefined>;
  public readonly cutomFormMessageComponentList$: Observable<ReadonlyArray<NgxFormMessageComponent>>;
  public readonly errors$: Observable<ValidationErrors | undefined>;
  public readonly isVisible$: Observable<boolean>;
  public readonly ngxFormMessageConfig$: Observable<Required<NgxFormMessageConfig>>;
  public readonly staticErrorList$: Observable<ReadonlyArray<keyof NgxFormMessageConfig>>;
  public readonly when$: Observable<WhenType>;

  @Input()
  public single?: boolean | null;

  @ContentChildren(NgxFormMessageComponent)
  private readonly ngxFormMessageCustomList!: QueryList<NgxFormMessageComponent>;

  private readonly afterContentInitSource = new ReplaySubject<void>(1);
  private readonly controlSource = new ReplaySubject<AbstractControl | undefined>(1);
  private readonly whenSource = new ReplaySubject<WhenType>(1);

  constructor(
    private readonly formGroupDirective: FormGroupDirective,
    @Inject(NGX_FORM_MESSAGE_CONFIG) @Optional() ngxFormMessageConfigFactory: NgxFormMessageConfigFactory | undefined,
  ) {
    this.afterContentInit$ = this.afterContentInitSource.asObservable();
    this.control$ = this.controlSource.asObservable();
    this.when$ = this.whenSource.asObservable();

    const externalNgxFormMessageConfig$ = this.getNgxFormMessagesConfig(ngxFormMessageConfigFactory);

    this.ngxFormMessageConfig$ = externalNgxFormMessageConfig$.pipe(
      map((ngxFormMessageConfig) => this.getInitialNgxFormMessagConfig(ngxFormMessageConfig)),
    );

    this.staticErrorList$ = this.ngxFormMessageConfig$.pipe(map(objectKeys));

    this.cutomFormMessageComponentList$ = this.afterContentInitSource.asObservable().pipe(
      switchMap(() => {
        return this.ngxFormMessageCustomList.changes.pipe(startWith(this.ngxFormMessageCustomList.toArray()));
      }),
    );

    const status$ = this.control$.pipe(
      switchMap((control) => {
        if (!control) {
          return of(false);
        }

        return control.statusChanges.pipe(
          /**
           * @description status changes are not emitted on creation, but control may be already invalid so we manually start observable
           * May be related to https://github.com/angular/angular/issues/14542
           */
          startWith(control.status),
        );
      }),
    );

    this.errors$ = status$.pipe(
      switchMap(() => {
        return this.control$.pipe(
          map((control) => {
            return control?.errors ?? undefined;
          }),
        );
      }),
    );

    const isSubmitted$ = this.formGroupDirective.ngSubmit.pipe(
      startWith(undefined),
      map(() => {
        return this.formGroupDirective.submitted;
      }),
    );

    const touched$ = this.control$.pipe(
      switchMap((control) => {
        if (!control) {
          return of(false);
        }

        return extractTouchedChanges(control).pipe(startWith(control.touched));
      }),
    );

    const dirty$ = this.control$.pipe(
      switchMap((control) => {
        if (!control) {
          return of(false);
        }

        return extractDirtyChanges(control).pipe(startWith(control.dirty));
      }),
    );

    const state$ = combineLatest([touched$, dirty$]).pipe(
      map(([touched, dirty]) => {
        return {
          dirty,
          touched,
        };
      }),
    );

    const whenCondition$ = combineLatest([this.when$, state$]).pipe(
      map(([when, state]) => {
        switch (when) {
          case 'dirty':
            return state.dirty;
          case 'touched':
            return state.touched;
          case 'always':
          default:
            return true;
        }
      }),
    );

    this.isVisible$ = combineLatest([whenCondition$, isSubmitted$, status$]).pipe(
      map(([whenCondition, isSubmitted, status]) => {
        return (whenCondition || isSubmitted) && status !== 'PENDING';
      }),
    );
  }

  @Input()
  public set control(value: AbstractControl | undefined | null) {
    this.controlSource.next(value ?? undefined);
  }

  /*
   * By default Angular checks the dirty state on changes. So as the user types, the value is changed and the dirty state is set to true.
   * The touched state is not changed until the user leaves the field. It's like an "on lost focus" event. So as the user types, the dirty state is true but the touched state will be false. When the user leaves the field, both the dirty state and touched state will be true.
   * So if you want an error message to appear/disappear as the user is typing OR if the user just tabs/moves through the field, you will want to check both.
   */
  @Input()
  public set when(value: WhenType | undefined | null) {
    this.whenSource.next(value ?? 'touched');
  }

  public canShow(
    errorKey: keyof NgxFormMessageConfig,
    errors: ValidationErrors | undefined,
    single: boolean | undefined,
  ): boolean {
    if (!errors) {
      return false;
    }

    if (single) {
      const firstError = Object.keys(errors)[0];

      return firstError === errorKey;
    }

    return !!errors[errorKey];
  }

  public getText(
    errorKey: keyof NgxFormMessageConfig,
    errors: ValidationErrors | undefined,
    ngxFormMessageConfig: Required<NgxFormMessageConfig> | undefined,
  ): string {
    const error = errors ? errors[errorKey] : undefined;

    return ngxFormMessageConfig ? ngxFormMessageConfig[errorKey](error) : '';
  }

  public identifyNgxFormMessageComponent(
    _index: number,
    ngxFormMessageComponent: NgxFormMessageComponent & Required<Pick<NgxFormMessageComponent, 'error'>>,
  ): string | number {
    return ngxFormMessageComponent.error;
  }

  public identifyStaticError(_index: number, staticError: keyof NgxFormMessageConfig): string | number {
    return staticError;
  }

  public ngAfterContentInit(): void {
    this.afterContentInitSource.next();
  }

  private getNgxFormMessagesConfig(
    ngxFormMessageConfigFactory:
      | (() => NgxFormMessageConfig | Promise<NgxFormMessageConfig> | Observable<NgxFormMessageConfig>)
      | undefined,
  ): Observable<NgxFormMessageConfig | undefined> {
    const ngxFormMessageConfig$ =
      typeof ngxFormMessageConfigFactory === 'function' ? ngxFormMessageConfigFactory() : undefined;

    if (ɵisObservable(ngxFormMessageConfig$)) {
      return ngxFormMessageConfig$;
    }

    if (ɵisPromise(ngxFormMessageConfig$)) {
      return from(ngxFormMessageConfig$);
    }

    return of(ngxFormMessageConfig$);
  }

  //
  private getInitialNgxFormMessagConfig(
    ngxFormMessageConfig: NgxFormMessageConfig | undefined,
  ): Required<NgxFormMessageConfig> {
    return {
      ...ngxFormMessageConfig,
      email:
        ngxFormMessageConfig?.email ??
        (() => {
          return 'Invalid email address';
        }),
      max:
        ngxFormMessageConfig?.max ??
        (({ max }) => {
          return `Field must be no greater than ${max}`;
        }),
      maxlength:
        ngxFormMessageConfig?.maxlength ??
        (({ requiredLength }) => {
          return `Field must be no longer than ${requiredLength} characters`;
        }),
      min:
        ngxFormMessageConfig?.min ??
        (({ min }) => {
          return `Field must be no less than ${min}`;
        }),
      minlength:
        ngxFormMessageConfig?.minlength ??
        (({ requiredLength }) => {
          return `Field must be longer than ${requiredLength} characters`;
        }),
      required:
        ngxFormMessageConfig?.required ??
        (() => {
          return 'Field is required';
        }),
      pattern:
        ngxFormMessageConfig?.pattern ??
        (() => {
          return 'Field is invalid';
        }),
    };
  }
}
