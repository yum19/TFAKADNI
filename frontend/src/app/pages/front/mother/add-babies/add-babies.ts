import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-add-babies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-babies.html',
  styleUrls: ['./add-babies.css']
})
export class AddBabies implements AfterViewInit, OnDestroy {
  form: FormGroup;
  today = new Date().toISOString().split('T')[0];

  isMapPopupOpen = false;
  isLoadingPlace = false;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      gender: ['', Validators.required],

      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.pattern(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/)
        ]
      ],

      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.pattern(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/)
        ]
      ],

      birthPlace: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(200)
        ]
      ],

      birthDate: [
        '',
        [
          Validators.required,
          this.noFutureDateValidator()
        ]
      ]
    });
  }

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
  }

  selectGender(gender: 'FEMALE' | 'MALE'): void {
    this.form.patchValue({ gender });
    this.form.get('gender')?.markAsTouched();
  }

  isGenderSelected(gender: 'FEMALE' | 'MALE'): boolean {
    return this.form.get('gender')?.value === gender;
  }

  goBack(): void {
    this.router.navigate(['/mother/babies']);
  }

  nextStep(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const step1Data = {
      gender: this.form.value.gender,
      firstName: this.form.value.firstName?.trim(),
      lastName: this.form.value.lastName?.trim(),
      birthPlace: this.form.value.birthPlace?.trim(),
      birthDate: this.form.value.birthDate
    };

    this.router.navigate(['/mother/add-baby-size'], {
      state: {
        step1Data
      }
    });
  }

  onlyLetters(event: Event, controlName: 'firstName' | 'lastName'): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '');
    this.form.get(controlName)?.setValue(input.value, { emitEvent: false });
  }

  openMapPopup(): void {
    this.isMapPopupOpen = true;
    this.form.get('birthPlace')?.markAsTouched();

    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  closeMapPopup(): void {
    this.isMapPopupOpen = false;
    this.destroyMap();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  async useCurrentLocation(): Promise<void> {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (this.map) {
          this.map.setView([lat, lng], 14);
        }

        await this.selectPlaceFromCoords(lat, lng);
      },
      () => {
        alert('Unable to get your current location.');
      }
    );
  }

  private initMap(): void {
    if (!this.isMapPopupOpen) {
      return;
    }

    this.destroyMap();

    this.map = L.map('birthPlaceMap', {
      center: [36.8065, 10.1815],
      zoom: 6
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      await this.selectPlaceFromCoords(lat, lng);
    });

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  private destroyMap(): void {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async selectPlaceFromCoords(lat: number, lng: number): Promise<void> {
    this.isLoadingPlace = true;

    try {
      if (this.marker && this.map) {
        this.map.removeLayer(this.marker);
      }

      if (this.map) {
        this.marker = L.marker([lat, lng]).addTo(this.map);
      }

      const placeName = await this.reverseGeocode(lat, lng);

      this.form.patchValue({
        birthPlace: placeName
      });

      this.form.get('birthPlace')?.markAsTouched();
      this.form.get('birthPlace')?.updateValueAndValidity();

      this.closeMapPopup();
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      alert('Unable to get the selected place.');
    } finally {
      this.isLoadingPlace = false;
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    const address = data.address || {};

    const detailedAddress = this.composeAddressLabel(address);

    return (
      detailedAddress ||
      data.display_name ||
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    );
  }

  private composeAddressLabel(address: Record<string, string | undefined>): string {
    const streetLine = [
      address['house_number'],
      address['road'],
      address['neighbourhood'],
      address['suburb'],
      address['city_district']
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const localityLine = [
      address['city'],
      address['town'],
      address['village'],
      address['municipality'],
      address['county'],
      address['state_district'],
      address['state']
    ].filter(Boolean);

    const parts = [streetLine, ...localityLine, address['country']]
      .filter(Boolean)
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));

    return parts.join(', ');
  }

  private fixLeafletIcons(): void {
    const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
    const iconUrl = 'assets/leaflet/marker-icon.png';
    const shadowUrl = 'assets/leaflet/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = iconDefault;
  }

  private noFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const selectedDate = new Date(control.value);
      const today = new Date();

      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        return { futureDate: true };
      }

      return null;
    };
  }
}