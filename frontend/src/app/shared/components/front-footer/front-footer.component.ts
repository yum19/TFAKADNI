import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-front-footer',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIcon],
  templateUrl: './front-footer.component.html',
  styleUrls: ['./front-footer.component.scss']
})
export class FrontFooterComponent {
  session = inject(SessionService);
}
