import { Injectable } from '@angular/core';
import { PermissionDefinition, PartnerLink, PartnerPermission } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PartnerPermissionService {

  hasPermission(link: PartnerLink | null | undefined, permissionType: string): boolean {
    if (!link?.permissions?.length) {
      return false;
    }

    return link.permissions.some(
      permission => permission.permissionType === permissionType && permission.allowed === true
    );
  }

  filterAcceptedLinksWithPermission(links: PartnerLink[], permissionType: string): PartnerLink[] {
    return links.filter(link => link.status === 'ACCEPTED' && this.hasPermission(link, permissionType));
  }

  toDefinitions(permissionTypes: string[], existingPermissions: PartnerPermission[] = []): PermissionDefinition[] {
    const lookup = new Map(existingPermissions.map(permission => [permission.permissionType, permission.allowed]));

    return permissionTypes.map(permissionType => ({
      permissionType,
      allowed: lookup.get(permissionType) ?? false,
      label: this.humanize(permissionType)
    }));
  }

  humanize(permissionType: string): string {
    return permissionType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
