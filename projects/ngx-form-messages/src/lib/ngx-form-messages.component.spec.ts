// tslint:disable: max-classes-per-file component-max-inline-declarations no-magic-numbers no-implicit-dependencies prefer-on-push-component-change-detection
import { Component } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  UntypedFormControl,
  UntypedFormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';

import {
  NgxFormMessageConfig,
  NGX_FORM_MESSAGE_CONFIG,
  WhenType,
} from './ngx-form-message.config';
import { NgxFormMessagesComponent } from './ngx-form-messages.component';
import { NgxFormMessagesModule } from './ngx-form-messages.module';

function setValidators(
  fixture: ComponentFixture<TestHostComponent>,
  newValidator: ValidatorFn | ValidatorFn[]
): void {
  fixture.componentInstance.form.controls['testControl'].setValidators(
    newValidator
  );
  fixture.componentInstance.form.controls[
    'testControl'
  ].updateValueAndValidity();
  fixture.detectChanges();
}

function makeInputTouched(fixture: ComponentFixture<TestHostComponent>): void {
  fixture.debugElement
    .query(By.css('input'))
    .triggerEventHandler('focus', undefined);
  fixture.debugElement
    .query(By.css('input'))
    .triggerEventHandler('blur', undefined);
  fixture.detectChanges();
}

function makeInputDirty(
  fixture: ComponentFixture<TestHostComponent>,
  value: unknown
): void {
  const inputEl = fixture.debugElement.query(By.css('input'));
  inputEl.nativeElement.value = value;
  inputEl.triggerEventHandler('input', { target: inputEl.nativeElement });
  fixture.detectChanges();
}

function getAllMessage(
  fixture: ComponentFixture<TestHostComponent>
): NodeListOf<Element> {
  const hostElement: HTMLElement = fixture.nativeElement;
  const messages = hostElement.querySelectorAll(`[ngx-form-message-error]`);

  return messages;
}

function getMessage(
  fixture: ComponentFixture<TestHostComponent>,
  error: string
): Element | null {
  const hostElement: HTMLElement = fixture.nativeElement;
  const message = hostElement.querySelector(
    `[ngx-form-message-error="${error}"]`
  );

  return message;
}

@Component({
  selector: 'ngx-test-host',
  template: ` <form [formGroup]="form">
    <input formControlName="testControl" />
    <ngx-form-messages
      [control]="form.controls.testControl"
      [single]="single"
      [when]="when"
    >
      <ngx-form-message [error]="'custom'"
        >This is a custom message</ngx-form-message
      >
      <ngx-form-message [error]="'phone'"
        >Invalid phone number</ngx-form-message
      >
      <ngx-form-message *ngIf="overridenMinEnable" [error]="'min'"
        >Overriden min error</ngx-form-message
      >
    </ngx-form-messages>
  </form>`,
})
class TestHostComponent {
  public overridenMinEnable?: boolean;
  public single?: boolean;
  public when?: WhenType;

  public readonly form = new UntypedFormGroup({
    testControl: new UntypedFormControl(),
  });
}

describe('NgxFormMessagesComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [NgxFormMessagesModule, ReactiveFormsModule],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Test valid form', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should contain only placeholder', () => {
      const ngxFormMessagesElement: HTMLElement = fixture.debugElement.query(
        By.directive(NgxFormMessagesComponent)
      ).nativeElement;
      expect(ngxFormMessagesElement.textContent).toContain('');
    });
  });

  describe('Test when changes', () => {
    beforeEach(() => {
      setValidators(fixture, Validators.required);
    });

    it('test when is always', fakeAsync(() => {
      component.when = 'always';
      tick();
      fixture.detectChanges();
      const message = getMessage(fixture, 'required');
      expect(message).toBeTruthy();
    }));

    it('test when is undefined', () => {
      const message = getMessage(fixture, 'required');
      expect(message).toBeFalsy();
    });

    it('test when is undefined for touched input', () => {
      makeInputTouched(fixture);
      const message = getMessage(fixture, 'required');
      expect(message).toBeTruthy();
    });

    it('test when is undefined for dirty input', () => {
      makeInputDirty(fixture, 'hello world');
      const message = getMessage(fixture, 'required');
      expect(message).toBeFalsy();
    });

    it('test when is dirty', () => {
      component.when = 'dirty';
      fixture.detectChanges();
      const message = getMessage(fixture, 'required');
      expect(message).toBeFalsy();
    });

    it('test when is dirty for touched input', () => {
      component.when = 'dirty';
      fixture.detectChanges();
      makeInputTouched(fixture);
      const message = getMessage(fixture, 'required');
      expect(message).toBeFalsy();
    });

    it('test when is dirty for dirty input', () => {
      component.when = 'dirty';
      fixture.detectChanges();
      makeInputDirty(fixture, '');
      const message = getMessage(fixture, 'required');
      expect(message).toBeTruthy();
    });

    it('test when is dirty for valid dirty input', () => {
      component.when = 'dirty';
      fixture.detectChanges();
      makeInputDirty(fixture, 'hellow world');
      const message = getMessage(fixture, 'required');
      expect(message).toBeFalsy();
    });
  });

  describe('Test amount of validation messages', () => {
    beforeEach(() => {
      component.when = 'always';
      fixture.detectChanges();
    });

    it('should have only required message', () => {
      setValidators(fixture, Validators.required);
      const nodeList = getAllMessage(fixture);
      expect(nodeList.length).toBe(1);
    });

    it('should have only pattern message', () => {
      setValidators(fixture, [Validators.pattern(/^-?(0|[1-9]\d*)?$/)]);
      makeInputDirty(fixture, 'Hello');
      const nodeList = getAllMessage(fixture);
      expect(nodeList.length).toBe(1);
    });

    it('should have required and pattern messages', () => {
      setValidators(fixture, [
        Validators.minLength(10),
        Validators.pattern(/^-?(0|[1-9]\d*)?$/),
      ]);
      makeInputDirty(fixture, 'Hello');
      const nodeList = getAllMessage(fixture);
      expect(nodeList.length).toBe(2);
    });

    it('should have required and pattern errors, but shows only required message', () => {
      setValidators(fixture, [
        Validators.minLength(10),
        Validators.pattern(/^-?(0|[1-9]\d*)?$/),
      ]);
      makeInputDirty(fixture, 'Hello');
      component.single = true;
      fixture.detectChanges();
      const nodeList = getAllMessage(fixture);
      expect(nodeList.length).toBe(1);
    });
  });

  describe('Test projected content', () => {
    beforeEach(() => {
      component.when = 'always';
      fixture.detectChanges();
    });

    it('should have correct custom message', () => {
      setValidators(fixture, () => ({ custom: true }));
      const message = getMessage(fixture, 'custom');
      expect(message).toBeTruthy();
    });

    it('should have projected and static messages', () => {
      setValidators(fixture, [Validators.required, () => ({ custom: true })]);
      const nodeList = getAllMessage(fixture);
      expect(nodeList.length).toBe(2);
    });
  });

  describe('Test form state transitions', () => {
    it('should hide error message when form become valid', () => {
      setValidators(fixture, Validators.required);
      makeInputDirty(fixture, 'Hello world');
      const message = getMessage(fixture, 'required');
      expect(message).toBeFalsy();
    });
  });

  describe('Test default text messages', () => {
    beforeEach(() => {
      component.when = 'always';
      fixture.detectChanges();
    });

    it('should have correct email message', () => {
      setValidators(fixture, Validators.email);
      makeInputDirty(fixture, 'Hello world');
      const message = getMessage(fixture, 'email');
      expect(message?.textContent).toBe('Invalid email address');
    });

    it('should have correct max message', () => {
      setValidators(fixture, Validators.max(5));
      makeInputDirty(fixture, 10);
      const message = getMessage(fixture, 'max');
      expect(message?.textContent).toBe('Field must be no greater than 5');
    });

    it('should have correct maxlength message', () => {
      setValidators(fixture, Validators.maxLength(5));
      makeInputDirty(fixture, 'Hello world');
      const message = getMessage(fixture, 'maxlength');
      expect(message?.textContent).toBe(
        'Field must be no longer than 5 characters'
      );
    });

    it('should have correct min message', () => {
      setValidators(fixture, Validators.min(10));
      makeInputDirty(fixture, 5);
      const message = getMessage(fixture, 'min');
      expect(message?.textContent).toBe('Field must be no less than 10');
    });

    it('should have correct minlength message', () => {
      setValidators(fixture, Validators.minLength(10));
      makeInputDirty(fixture, 'Hello');
      const message = getMessage(fixture, 'minlength');
      expect(message?.textContent).toBe(
        'Field must be longer than 10 characters'
      );
    });

    it('should have correct required message', () => {
      setValidators(fixture, Validators.required);
      const message = getMessage(fixture, 'required');
      expect(message?.textContent).toBe('Field is required');
    });

    it('should have correct pattern message', () => {
      setValidators(fixture, Validators.pattern(/^-?(0|[1-9]\d*)?$/));
      makeInputDirty(fixture, 'Hello');
      const message = getMessage(fixture, 'pattern');
      expect(message?.textContent).toBe('Field is invalid');
    });
  });
});

describe('Test custom config', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [NgxFormMessagesModule, ReactiveFormsModule],
      providers: [
        {
          provide: NGX_FORM_MESSAGE_CONFIG,
          useValue: (): Promise<NgxFormMessageConfig> => {
            return Promise.resolve({
              email: () => 'Overridden email message',
            });
          },
        },
      ],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    component.when = 'always';
    fixture.detectChanges();

    return fixture.whenStable().then(() => {
      fixture.detectChanges();
    });
  });

  it('should have correct overriden email message', fakeAsync(() => {
    setValidators(fixture, Validators.email);
    makeInputDirty(fixture, 'Hello world');
    tick();
    fixture.detectChanges();
    const message = getMessage(fixture, 'email');
    expect(message?.textContent).toBe('Overridden email message');
  }));

  it("should have correct required message which wasn't overriden", fakeAsync(() => {
    setValidators(fixture, Validators.required);
    tick();
    fixture.detectChanges();
    const message = getMessage(fixture, 'required');
    expect(message?.textContent).toBe('Field is required');
  }));

  it('should have correct overriden min message by projected content', fakeAsync(() => {
    component.overridenMinEnable = true;
    setValidators(fixture, Validators.min(10));
    makeInputDirty(fixture, 5);
    tick();
    fixture.detectChanges();
    const message = getMessage(fixture, 'min');
    expect(message?.textContent).toBe('Overriden min error');
  }));
});

describe('Test custom config with Observable', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [NgxFormMessagesModule, ReactiveFormsModule],
      providers: [
        {
          provide: NGX_FORM_MESSAGE_CONFIG,
          useValue: (): Observable<NgxFormMessageConfig> => {
            return of({
              email: () => 'Overridden email message',
            });
          },
        },
      ],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    component.when = 'always';
    fixture.detectChanges();

    return fixture.whenStable().then(() => {
      fixture.detectChanges();
    });
  });

  it('should have correct overriden email message', fakeAsync(() => {
    setValidators(fixture, Validators.email);
    makeInputDirty(fixture, 'Hello world');
    tick();
    fixture.detectChanges();
    const message = getMessage(fixture, 'email');
    expect(message?.textContent).toBe('Overridden email message');
  }));
});
