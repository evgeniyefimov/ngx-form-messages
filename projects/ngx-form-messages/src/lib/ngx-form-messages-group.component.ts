import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-form-messages-group',
  styleUrls: ['./ngx-form-messages-group.component.scss'],
  templateUrl: './ngx-form-messages-group.component.html',
})
export class NgxFormMessagesGroupComponent {
  @HostBinding('class')
  public readonly class = 'ngx-form-messages-group';
}
