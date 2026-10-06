import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../../core/services/partner.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { PartnerLink, PermissionDefinition, PregnancyContext } from '../../../../core/models/api.models';
import { PartnerPermissionService } from '../../../../core/services/partner-permission.service';

@Component({
  selector: 'app-mother-collaboration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collaboration.component.html',
  styleUrls: ['./collaboration.component.scss']
})
export class MotherCollaborationComponent {
  private partnerService = inject(PartnerService);
  permissionService = inject(PartnerPermissionService);
  private notify = inject(NotifyService);

  context: PregnancyContext = { id: null, source: 'none' };
  links: PartnerLink[] = [];
  partnerId?: number;
  permissionTypes: string[] = [];
  permissions: PermissionDefinition[] = [];
  editingLinkId?: number;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.partnerService.getPregnancyContext().subscribe({ next: ctx => this.context = ctx });

    this.partnerService.getPermissionTypes().subscribe({
      next: types => {
        this.permissionTypes = types;
        this.permissions = this.permissionService.toDefinitions(types, this.permissions);
      },
      error: () => this.notify.error('Unable to load permission catalog.')
    });

    this.partnerService.getMyMotherLinks().subscribe({
      next: data => this.links = data
    });
  }

  saveManualContext(): void {
    this.partnerService.setManualPregnancyId(this.context.id);
    this.notify.success('Pregnancy context saved locally for this frontend session.');
  }

  editLink(link: PartnerLink): void {
    this.editingLinkId = link.id;
    this.permissions = this.permissionService.toDefinitions(this.permissionTypes, link.permissions);
    this.notify.info(`Editing permissions for pregnancy #${link.pregnancyId}.`);
  }

  resetPermissionDraft(): void {
    this.editingLinkId = undefined;
    this.permissions = this.permissionService.toDefinitions(this.permissionTypes);
  }

  createInvite(): void {
    if (!this.partnerId || !this.context.id) {
      this.notify.error('Partner ID and pregnancy context are required.');
      return;
    }

    const payload = {
      partnerId: this.partnerId,
      pregnancyId: this.context.id,
      permissions: this.permissions.map(({ label, ...rest }) => rest)
    };

    this.partnerService.createInvite(payload).subscribe({
      next: () => {
        this.notify.success('Invite created successfully.');
        this.partnerId = undefined;
        this.resetPermissionDraft();
        this.reload();
      },
      error: () => this.notify.error('Invite could not be created. Check role, pregnancy ID and backend ownership rules.')
    });
  }

  updatePermissions(link: PartnerLink): void {
    this.partnerService.updatePermissions(link.id, this.permissions.map(({ label, ...rest }) => rest)).subscribe({
      next: () => {
        this.notify.success('Permissions updated.');
        this.reload();
      },
      error: () => this.notify.error('Permission update failed.')
    });
  }
}
