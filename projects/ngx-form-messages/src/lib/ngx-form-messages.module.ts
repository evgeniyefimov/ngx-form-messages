import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxLocalPipeModule } from 'ngx-local-pipe';

import { NgxFormMessageComponent } from './ngx-form-message.component';
import { NgxFormMessagesGroupComponent } from './ngx-form-messages-group.component';
import { NgxFormMessagesComponent } from './ngx-form-messages.component';

const DECLARATIONS = [NgxFormMessageComponent, NgxFormMessagesGroupComponent, NgxFormMessagesComponent];

@NgModule({
  declarations: DECLARATIONS,
  exports: DECLARATIONS,
  imports: [CommonModule, NgxLocalPipeModule],
})
export class NgxFormMessagesModule {}
