import {
  ChangeDetectionStrategy,
  Component,
  Input,
  TemplateRef,
  ViewChild,
} from "@angular/core";

import { NgxFormMessageConfig } from "./ngx-form-message.config";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "ngx-form-message",
  standalone: true,
  templateUrl: "./ngx-form-message.component.html",
})
export class NgxFormMessageComponent {
  @Input()
  public error?: keyof NgxFormMessageConfig;

  @ViewChild(TemplateRef, { static: true })
  public templateRef!: TemplateRef<unknown>;
}
