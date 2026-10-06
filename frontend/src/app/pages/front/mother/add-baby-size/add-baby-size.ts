import { Component, OnInit } from '@angular/core';
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
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BabyService, BabyRequestDTO } from '../../../../core/services/module6a/baby.service';

type Step1Data = {
  gender: 'FEMALE' | 'MALE';
  firstName: string;
  lastName: string;
  birthPlace: string;
  birthDate: string;
};

@Component({
  selector: 'app-add-baby-size',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-baby-size.html',
  styleUrls: ['./add-baby-size.css']
})
export class AddBabySize implements OnInit {
  form: FormGroup;
  gender: 'FEMALE' | 'MALE' | '' = '';
  step1Data: Step1Data | null = null;

  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  isSubmitting = false;
  submitError = '';
  submitSuccess = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private babyService: BabyService
  ) {
    this.form = this.fb.group({
      birthWeight: ['', [Validators.required, this.decimalValidator(2.5, 4, 3)]],
      birthHeight: ['', [Validators.required, this.decimalValidator(46, 54, 1)]],
      bloodType: ['', Validators.required],
      deliveryType: ['', Validators.required],
      gestationalAgeAtBirth: ['', [Validators.required, this.integerValidator(24, 42)]],
      notes: ['', [Validators.maxLength(500)]],
      photoUrl: ['']
    });
  }

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { step1Data?: Step1Data } | undefined;

    if (state?.step1Data) {
      this.step1Data = state.step1Data;
      this.gender = state.step1Data.gender ?? '';
    } else if (history.state?.step1Data) {
      this.step1Data = history.state.step1Data as Step1Data;
      this.gender = history.state.step1Data.gender ?? '';
    } else {
      this.router.navigate(['/mother/add-baby']);
    }
  }

  get backgroundImage(): string {
    return this.gender === 'FEMALE'
      ? 'assets/img/formulairebaby1.png'
      : 'assets/img/formulairebaby1.png';
  }

  get themeClass(): string {
    return this.gender === 'FEMALE' ? 'theme-girl' : 'theme-boy';
  }

  goBack(): void {
    this.router.navigate(['/mother/add-baby'], {
      state: {
        step1Data: this.step1Data
      }
    });
  }

  nextStep(): void {
    this.submitBaby();
  }

  submitBaby(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.step1Data) {
      this.submitError = 'Step 1 data is missing.';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    const payload: BabyRequestDTO = {
      firstName: this.step1Data.firstName?.trim(),
      lastName: this.step1Data.lastName?.trim(),
      birthDate: this.step1Data.birthDate,
      gender: this.step1Data.gender,
      birthPlace: this.step1Data.birthPlace?.trim() || null,
      birthWeight: Number(this.form.value.birthWeight),
      birthHeight: Number(this.form.value.birthHeight),
      bloodType: this.form.value.bloodType?.trim() || null,
      deliveryType: this.form.value.deliveryType?.trim() || null,
      gestationalAgeAtBirth: Number(this.form.value.gestationalAgeAtBirth),
      photoUrl: this.form.value.photoUrl || null,
      notes: this.form.value.notes?.trim() || null
    };

    console.log('photoUrl length =', payload.photoUrl?.length || 0);
    console.log('Final payload sent to backend:', payload);

    this.babyService.createBaby(payload).subscribe({
      next: (response: unknown) => {
        console.log('Baby created successfully:', response);
        this.isSubmitting = false;
        this.submitSuccess = 'Baby created successfully.';
        this.router.navigate(['/mother/baby-profiles']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error creating baby:', error);
        this.isSubmitting = false;

        const errorBody = error.error as { message?: string; error?: string } | null;

        this.submitError =
          errorBody?.message ||
          errorBody?.error ||
          error.message ||
          'An error occurred while creating the baby.';
      }
    });
  }

  allowDecimalInput(event: Event, controlName: 'birthWeight' | 'birthHeight'): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(',', '.');

    value = value.replace(/[^0-9.]/g, '');

    const firstDotIndex = value.indexOf('.');
    if (firstDotIndex !== -1) {
      value =
        value.substring(0, firstDotIndex + 1) +
        value.substring(firstDotIndex + 1).replace(/\./g, '');
    }

    this.form.get(controlName)?.setValue(value, { emitEvent: false });
    input.value = value;
  }

  allowWeeksInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    this.form.get('gestationalAgeAtBirth')?.setValue(value, { emitEvent: false });
    input.value = value;
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      this.selectedImageFile = null;
      this.imagePreview = null;
      this.form.get('photoUrl')?.setValue('');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.selectedImageFile = null;
      this.imagePreview = null;
      this.submitError = 'Accepted formats: PNG, JPG, JPEG, WEBP';
      input.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      this.selectedImageFile = null;
      this.imagePreview = null;
      this.submitError = 'Image size must not exceed 5MB';
      input.value = '';
      return;
    }

    this.submitError = '';
    this.selectedImageFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxWidth = 600;
        const maxHeight = 600;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.submitError = 'Unable to process image.';
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        this.imagePreview = compressedBase64;
        this.form.get('photoUrl')?.setValue(compressedBase64);

        console.log('Compressed image length:', compressedBase64.length);
      };

      img.onerror = () => {
        this.submitError = 'Invalid image file.';
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  removeImage(fileInput?: HTMLInputElement): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.form.get('photoUrl')?.setValue('');

    if (fileInput) {
      fileInput.value = '';
    }
  }

  private decimalValidator(min: number, max: number, maxDecimals: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null;
      }

      const normalized = String(value).replace(',', '.');

      if (!/^\d+(\.\d+)?$/.test(normalized)) {
        return { invalidNumber: true };
      }

      const num = Number(normalized);

      if (isNaN(num)) {
        return { invalidNumber: true };
      }

      if (num < min) {
        return { minValue: { min } };
      }

      if (num > max) {
        return { maxValue: { max } };
      }

      const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
      if (decimals > maxDecimals) {
        return { tooManyDecimals: true };
      }

      return null;
    };
  }

  private integerValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null;
      }

      if (!/^\d+$/.test(String(value))) {
        return { invalidNumber: true };
      }

      const num = Number(value);

      if (num < min) {
        return { minValue: { min } };
      }

      if (num > max) {
        return { maxValue: { max } };
      }

      return null;
    };
  }
}