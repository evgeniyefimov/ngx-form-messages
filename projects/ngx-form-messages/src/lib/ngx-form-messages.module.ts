import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveComponentModule } from '@ngrx/component';

import { LocalPipe } from './local.pipe';
import { NgxFormMessageComponent } from './ngx-form-message.component';
import { NgxFormMessagesGroupComponent } from './ngx-form-messages-group.component';
import { NgxFormMessagesComponent } from './ngx-form-messages.component';

const DECLARATIONS = [LocalPipe, NgxFormMessageComponent, NgxFormMessagesGroupComponent, NgxFormMessagesComponent];

@NgModule({
  declarations: DECLARATIONS,
  exports: DECLARATIONS,
  imports: [CommonModule, ReactiveComponentModule],
})
export class NgxFormMessagesModule {}
