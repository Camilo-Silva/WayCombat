import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  resetForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      this.markFormGroupTouched(this.resetForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const newPassword = this.resetForm.value.password;
      
      const result = await this.authService.updatePassword(newPassword);
      
      if (result.success) {
        this.successMessage = '✅ Contraseña actualizada exitosamente. Redirigiendo al inicio...';
        
        // Esperar 2 segundos y redirigir
        setTimeout(() => {
          this.router.navigate(['/acceso-instructores']);
        }, 2000);
      } else {
        this.errorMessage = result.message || 'Error al actualizar la contraseña.';
      }
      
    } catch (error: any) {
      console.error('Error al resetear contraseña:', error);
      this.errorMessage = error?.message || 'Error al actualizar la contraseña. El enlace puede haber expirado.';
    } finally {
      this.isLoading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancelReset(): void {
    this.router.navigate(['/acceso-instructores']);
  }
}
