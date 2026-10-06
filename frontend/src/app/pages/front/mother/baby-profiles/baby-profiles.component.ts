import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { BabyResponseDTO, BabyService } from "../../../../core/services/module6a/baby.service";

@Component({
  selector: "app-baby-profiles",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./baby-profiles.component.html",
  styleUrls: ["./baby-profiles.component.css"],
})
export class BabyProfilesComponent implements OnInit {
  babies: BabyResponseDTO[] = [];
  loading = false;
  error = "";
  searchTerm = "";
  genderFilter: "ALL" | "FEMALE" | "MALE" = "ALL";
  currentPage = 1;
  pageSize = 6;
  deletingId: number | null = null;

  constructor(private readonly babyService: BabyService) {}

  ngOnInit(): void {
    this.loadBabies();
  }

  reload(): void {
    this.loadBabies();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  setGenderFilter(filter: "ALL" | "FEMALE" | "MALE"): void {
    this.genderFilter = filter;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = "";
    this.genderFilter = "ALL";
    this.currentPage = 1;
  }

  deleteBaby(babyId: number, firstName?: string, lastName?: string): void {
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "this profile";
    const confirmed = window.confirm(`Delete ${fullName}? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    this.deletingId = babyId;
    this.error = "";

    this.babyService.deleteBaby(babyId).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadBabies();
      },
      error: () => {
        this.deletingId = null;
        this.error = "Unable to delete this profile right now.";
      },
    });
  }

  goToPage(page: number): void {
    const nextPage = Math.min(Math.max(page, 1), this.totalPages);
    this.currentPage = nextPage;
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  get filteredBabies(): BabyResponseDTO[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.babies.filter((baby) => {
      const gender = (baby.gender || "").toUpperCase();
      const matchesGender = this.genderFilter === "ALL" || gender === this.genderFilter;

      const matchesSearch = !search
        || Object.values(baby).some((value) => {
          if (value === null || value === undefined) {
            return false;
          }

          return String(value).toLowerCase().includes(search);
        });

      return matchesGender && matchesSearch;
    });
  }

  get paginatedBabies(): BabyResponseDTO[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredBabies.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBabies.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get hasMultiplePages(): boolean {
    return this.totalPages > 1;
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = (firstName || "").trim().charAt(0);
    const last = (lastName || "").trim().charAt(0);
    return `${first}${last}`.toUpperCase() || "BP";
  }

  private loadBabies(): void {
    this.loading = true;
    this.error = "";

    this.babyService.getMyBabies().subscribe({
      next: (babies) => {
        this.babies = babies;
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = "Unable to load babies right now.";
      },
    });
  }
}
