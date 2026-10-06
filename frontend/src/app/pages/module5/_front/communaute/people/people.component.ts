import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IndexHeaderComponent } from '../../../../../components/index-header/index-header.component';
import { IndexFooterComponent } from '../../../../../components/index-footer/index-footer.component';
import { FollowService } from '../../../../../core/services/follow.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { UserSummary } from '../../../../../core/models/user-summary.model';
import { getUserIdFromToken } from '../../../../../core/services/token.helper';

@Component({
  selector: 'app-people',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, MatIconModule, IndexHeaderComponent, IndexFooterComponent],
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.css'],
})
export class PeopleComponent implements OnInit {

  activeTab   = 'all';
  searchQuery = '';
  loading     = true;
  inProgress  = new Set<number>();
  hoveredUserId: number | null = null;

  allUsers:       UserSummary[] = [];
  following:      UserSummary[] = [];
  followers:      UserSummary[] = [];
  displayedUsers: UserSummary[] = [];

  constructor(
    private followService: FollowService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void { 
  console.log('userId:', this.getCurrentUserId());
  console.log('current_user:', localStorage.getItem('current_user'));
  this.loadAll(); }

  private getCurrentUserId(): number { return getUserIdFromToken(); }

  private loadAll(): void {
    this.loading = true;
    const userId = this.getCurrentUserId();

    Promise.all([
      this.followService.getAllUsers().toPromise(),
      userId ? this.followService.getFollowing(userId).toPromise() : Promise.resolve([]),
      userId ? this.followService.getFollowers(userId).toPromise() : Promise.resolve([]),
    ]).then(([all, following, followers]) => {
      this.allUsers  = all       ?? [];
      this.following = following ?? [];
      this.followers = followers ?? [];
      this.loading   = false;
      this.applyFilter();
    }).catch(() => { this.loading = false; });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const source: UserSummary[] =
      this.activeTab === 'following' ? this.following :
      this.activeTab === 'followers' ? this.followers :
      this.allUsers;
    this.displayedUsers = q
      ? source.filter(u =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q))
      : [...source];
  }

  toggleFollow(user: UserSummary): void {
    if (this.inProgress.has(user.id)) return;
    this.inProgress.add(user.id);
    this.hoveredUserId = null;

    const wasFollowing = user.isFollowedByMe;

    const action$ = wasFollowing
      ? this.followService.unfollow(user.id)
      : this.followService.follow(user.id);

    action$.subscribe({
      next: () => {
  this.inProgress.delete(user.id);

  [this.allUsers, this.following, this.followers].forEach(list => {
    const found = list.find(u => u.id === user.id);
    if (found) {
      found.isFollowedByMe = !wasFollowing;
      // ✅ update the follower count immediately
      found.followersCount = wasFollowing
        ? found.followersCount - 1
        : found.followersCount + 1;
    }
  });

  if (!wasFollowing) {
    this.toast.success(`Now following ${user.fullName}!`);
    if (!this.following.find(u => u.id === user.id)) {
      this.following = [{ ...user, isFollowedByMe: true, followersCount: user.followersCount + 1 }, ...this.following];
    }
  } else {
    this.toast.success(`Unfollowed ${user.fullName}.`);
    this.following = this.following.filter(u => u.id !== user.id);
  }

  this.applyFilter();
},
      error: () => {
        this.inProgress.delete(user.id);
        this.toast.error('Could not update follow status. Please log in.');
      }
    });
  }

  getInitials(name: string): string {
    return (name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}