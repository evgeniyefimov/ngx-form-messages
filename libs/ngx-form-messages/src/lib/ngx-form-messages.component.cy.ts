import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { BehaviorSubject, of } from "rxjs";
import { NgxFormMessageComponent } from "./ngx-form-message.component";
import {
  NgxFormMessageConfig,
  NgxFormMessageConfigFactory,
  NGX_FORM_MESSAGE_CONFIG,
} from "./ngx-form-message.config";
import { NgxFormMessagesComponent } from "./ngx-form-messages.component";

export const assertPlaceholder = () => {
  // Explanation about \u00a0
  // https://docs.cypress.io/faq/questions/using-cypress-faq#How-do-I-get-an-element-s-text-contents
  cy.get("ngx-form-messages").should("have.text", "\u00a0");
};

export const assertErrorText = (text: string) => {
  cy.get("ngx-form-messages").should("have.text", text);
};

export const assertMultipleErrorText = (texts: string[]) => {
  texts.forEach((text, index) => {
    cy.get(".ngx-form-message-text").eq(index).should("have.text", text);
  });
  cy.get(".ngx-form-message-text").should("have.length", texts.length);
};

export const touchInput = () => {
  cy.get("input").click().blur();
};

export const typeInInput = (text: string) => {
  cy.get("input").type(text);
};

class FormBuilder {
  #validators: ValidatorFn[] = [];

  public setCustom(): FormBuilder {
    this.#validators.push(() => ({ custom: true }));

    return this;
  }

  public setMaxLength(maxLength: number): FormBuilder {
    this.#validators.push(Validators.maxLength(maxLength));

    return this;
  }

  public setMinLength(minLength: number): FormBuilder {
    this.#validators.push(Validators.minLength(minLength));

    return this;
  }

  public setPatternNumberOnly(): FormBuilder {
    this.#validators.push(Validators.pattern(/^-?(0|[1-9]\d*)?$/));

    return this;
  }

  public setRequired(): FormBuilder {
    this.#validators.push(Validators.required);

    return this;
  }

  public build(): FormGroup<{
    testControl: FormControl<string | null>;
  }> {
    return new FormGroup({
      testControl: new FormControl("", { validators: this.#validators }),
    });
  }
}

class TemplateBuilder {
  #projections: string[] = [];

  public setCustom(): TemplateBuilder {
    this.#projections.push(
      `<ngx-form-message [error]="'custom'">This is a custom message</ngx-form-message>`,
    );

    return this;
  }

  public setMinLength(): TemplateBuilder {
    this.#projections.push(
      `<ngx-form-message [error]="'minlength'">This is overrided min length message</ngx-form-message>`,
    );

    return this;
  }

  public build({
    hasSingleProperty,
    hasWhenProperty,
  }: {
    hasSingleProperty: boolean;
    hasWhenProperty: boolean;
  }): string {
    return `
      <form [formGroup]="form">
        <input formControlName="testControl" />
        <ngx-form-messages
          [control]="form.controls.testControl"
          ${hasSingleProperty ? '[single]="single"' : ""}
          ${hasWhenProperty ? '[when]="when"' : ""}>${this.#projections.join(
      "",
    )}</ngx-form-messages>
      </form>
    `;
  }
}

function setup({
  componentProperties,
  formBuilder,
  ngxFormMessageConfigFactory,
  templateBuilder,
}: {
  componentProperties: Partial<NgxFormMessagesComponent>;
  formBuilder: FormBuilder;
  ngxFormMessageConfigFactory?: NgxFormMessageConfigFactory;
  templateBuilder: TemplateBuilder;
}) {
  cy.mount<NgxFormMessagesComponent & { form: FormGroup }>(
    templateBuilder.build({
      hasSingleProperty: !!componentProperties.single,
      hasWhenProperty: !!componentProperties.when,
    }),
    {
      imports: [
        NgxFormMessageComponent,
        NgxFormMessagesComponent,
        ReactiveFormsModule,
      ],
      componentProperties: {
        ...componentProperties,
        form: formBuilder.build(),
      },
      providers: ngxFormMessageConfigFactory
        ? [
            {
              provide: NGX_FORM_MESSAGE_CONFIG,
              useValue: ngxFormMessageConfigFactory,
            },
          ]
        : [],
    },
  );
}

describe("NgxFormMessagesComponent", () => {
  describe("Test valid form without validators", () => {
    it("should contain only placeholder", () => {
      // Arrange
      setup({
        componentProperties: {},
        formBuilder: new FormBuilder(),
        templateBuilder: new TemplateBuilder(),
      });

      // Assert
      assertPlaceholder();
    });
  });

  describe("Test when property", () => {
    describe("untouched input", () => {
      it("should show error when 'when' property is always", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setRequired(),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertErrorText("Field is required");
      });

      it("should show placeholder when 'when' property is touched", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "touched",
          },
          formBuilder: new FormBuilder().setRequired(),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertPlaceholder();
      });

      it("should show placeholder when 'when' property is dirty", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "dirty",
          },
          formBuilder: new FormBuilder().setRequired(),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertPlaceholder();
      });
    });

    describe("touched input", () => {
      it("should show error when 'when' property is always", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setRequired(),
          templateBuilder: new TemplateBuilder(),
        });

        // Act
        touchInput();

        // Assert
        assertErrorText("Field is required");
      });

      it("should show error when 'when' property is touched", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "touched",
          },
          formBuilder: new FormBuilder().setRequired(),
          templateBuilder: new TemplateBuilder(),
        });

        // Act
        touchInput();

        // Assert
        assertErrorText("Field is required");
      });

      it("should show placeholder when 'when' property is dirty", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "dirty",
          },
          formBuilder: new FormBuilder().setRequired(),
          templateBuilder: new TemplateBuilder(),
        });

        // Act
        touchInput();

        // Assert
        assertPlaceholder();
      });
    });

    describe("dirty input", () => {
      it("should show error when 'when' property is always", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setMinLength(10),
          templateBuilder: new TemplateBuilder(),
        });

        // Act
        typeInInput("John Doe");

        // Assert
        assertErrorText("Field must be longer than 10 characters");
      });

      it("should show placeholder when 'when' property is touched", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "touched",
          },
          formBuilder: new FormBuilder().setMinLength(10),
          templateBuilder: new TemplateBuilder(),
        });

        // Act
        typeInInput("John Doe");

        // Assert
        assertPlaceholder();
      });

      it("should show placeholder when 'when' property is dirty", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "dirty",
          },
          formBuilder: new FormBuilder().setMinLength(10),
          templateBuilder: new TemplateBuilder(),
        });

        // Act
        typeInInput("John Doe");

        // Assert
        assertErrorText("Field must be longer than 10 characters");
      });
    });
  });

  describe("Test single property", () => {
    it("should show min length and pattern errors", () => {
      // Arrange
      setup({
        componentProperties: {
          single: false,
          when: "always",
        },
        formBuilder: new FormBuilder().setMinLength(10).setPatternNumberOnly(),
        templateBuilder: new TemplateBuilder(),
      });

      // Act
      typeInInput("John Doe");

      // Assert
      assertMultipleErrorText([
        "Field must be longer than 10 characters",
        "Field is invalid",
      ]);
    });

    it("should show only min length when single property enabled", () => {
      // Arrange
      setup({
        componentProperties: {
          single: true,
          when: "always",
        },
        formBuilder: new FormBuilder().setMinLength(10).setPatternNumberOnly(),
        templateBuilder: new TemplateBuilder(),
      });

      // Act
      typeInInput("John Doe");

      // Assert
      assertMultipleErrorText(["Field must be longer than 10 characters"]);
    });
  });

  describe("Test projection", () => {
    it("should show custom projected and static message", () => {
      // Arrange
      setup({
        componentProperties: {
          when: "always",
        },
        formBuilder: new FormBuilder().setCustom().setMinLength(10),
        templateBuilder: new TemplateBuilder().setCustom(),
      });

      // Act
      typeInInput("John Doe");

      // Assert
      assertMultipleErrorText([
        "This is a custom message",
        "Field must be longer than 10 characters",
      ]);
    });

    it("should override static message by projected", () => {
      // Arrange
      setup({
        componentProperties: {
          when: "always",
        },
        formBuilder: new FormBuilder().setPatternNumberOnly().setMinLength(10),
        templateBuilder: new TemplateBuilder().setMinLength(),
      });

      // Act
      typeInInput("John Doe");

      // Assert
      assertMultipleErrorText([
        "This is overrided min length message",
        "Field is invalid",
      ]);
    });
  });

  describe("Test form state transitions", () => {
    it("should show placeholder when transit to valid state from invalid", () => {
      // Arrange
      setup({
        componentProperties: {
          when: "always",
        },
        formBuilder: new FormBuilder().setMinLength(10),
        templateBuilder: new TemplateBuilder(),
      });

      // Act
      typeInInput("Hello, John Doe");

      // Assert
      assertPlaceholder();
    });

    it("should show error when transit to invalid state from valid", () => {
      // Arrange
      setup({
        componentProperties: {
          when: "always",
        },
        formBuilder: new FormBuilder().setMaxLength(10),
        templateBuilder: new TemplateBuilder(),
      });

      // Act
      typeInInput("Hello, John Doe");

      // Assert
      assertErrorText("Field must be no longer than 10 characters");
    });
  });

  describe("Test custom config", () => {
    describe("Object config", () => {
      it("should add custom error message", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setCustom().setRequired(),
          ngxFormMessageConfigFactory: () => ({
            custom: () => "Custom message from config",
          }),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertMultipleErrorText([
          "Custom message from config",
          "Field is required",
        ]);
      });

      it("should override static error message", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setRequired(),
          ngxFormMessageConfigFactory: () => ({
            required: () => "Overrided required message from config",
          }),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertErrorText("Overrided required message from config");
      });
    });

    describe("Promise config", () => {
      it("should add custom error message", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setCustom().setRequired(),
          ngxFormMessageConfigFactory: () =>
            Promise.resolve({
              custom: () => "Custom message from config",
            }),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertMultipleErrorText([
          "Custom message from config",
          "Field is required",
        ]);
      });

      it("should override static error message", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setRequired(),
          ngxFormMessageConfigFactory: () =>
            Promise.resolve({
              required: () => "Overrided required message from config",
            }),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertErrorText("Overrided required message from config");
      });
    });

    describe("Observable config", () => {
      it("should add custom error message", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setCustom().setRequired(),
          ngxFormMessageConfigFactory: () =>
            of({
              custom: () => "Custom message from config",
            }),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertMultipleErrorText([
          "Custom message from config",
          "Field is required",
        ]);
      });

      it("should override static error message", () => {
        // Arrange
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setRequired(),
          ngxFormMessageConfigFactory: () =>
            of({
              required: () => "Overrided required message from config",
            }),
          templateBuilder: new TemplateBuilder(),
        });

        // Assert
        assertErrorText("Overrided required message from config");
      });

      it("should change text on observable changes", () => {
        // Arrange
        const config: NgxFormMessageConfig = {
          required: () => "Message on init",
        };
        const subject = new BehaviorSubject(config);
        setup({
          componentProperties: {
            when: "always",
          },
          formBuilder: new FormBuilder().setRequired(),
          ngxFormMessageConfigFactory: () => subject.asObservable(),
          templateBuilder: new TemplateBuilder(),
        });

        // Act & Assert
        cy.get("ngx-form-messages")
          .should("have.text", "Message on init")
          .then(() => {
            subject.next({
              required: () => "Updated message",
            });
          })
          .then(() =>
            cy.get("ngx-form-messages").should("have.text", "Updated message"),
          );
      });
    });
  });
});
