import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-acceso-instructores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './acceso-instructores.component.html',
  styleUrl: './acceso-instructores.component.css'
})
export class AccesoInstructoresComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab: 'login' | 'register' = 'login';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  showForgotPasswordForm = false;
  showContactAdminForm = false;
  forgotPasswordMessage = '';

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotPasswordForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForms();
    
    // Redirigir si ya está autenticado
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/mixs']);
    }
  }

  private initializeForms(): void {
    // Formulario de Login
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required]]
    });

    // Formulario de Registro
    this.registerForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContraseña: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Formulario de Recuperar Contraseña
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Validador personalizado para verificar que las contraseñas coincidan
  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('contraseña');
    const confirmPassword = control.get('confirmarContraseña');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remover el error de passwordMismatch si las contraseñas coinciden
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.resetForms();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  showContactAdmin(event: Event): void {
    event.preventDefault();
    this.showContactAdminForm = true;
    this.errorMessage = '';
  }

  hideContactAdmin(): void {
    this.showContactAdminForm = false;
  }

  // Métodos comentados de forgot password
  /*
  showForgotPassword(event: Event): void {
    event.preventDefault();
    this.showForgotPasswordForm = true;
    this.errorMessage = '';
    this.forgotPasswordMessage = '';
  }

  hideForgotPassword(): void {
    this.showForgotPasswordForm = false;
    this.forgotPasswordForm.reset();
    this.forgotPasswordMessage = '';
  }
  */

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const loginData = this.loginForm.value;
      const result = await this.authService.login(loginData);
      
      if (result.success) {
        // Redirigir según el rol del usuario
        const userRole = this.authService.getUserRole();
        if (userRole === 'Admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/mixs']);
        }
      } else {
        this.errorMessage = result.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      }
    } catch (error: any) {
      this.errorMessage = error?.message || 'Error de conexión. Por favor, intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const registerData = {
        nombre: this.registerForm.value.nombre,
        email: this.registerForm.value.email,
        contraseña: this.registerForm.value.contraseña
      };

      const result = await this.authService.register(registerData);
      
      if (result.success) {
        // Cambiar a pestaña de login y mostrar mensaje de éxito
        this.activeTab = 'login';
        this.resetForms();
        // Aquí podrías mostrar un toast o mensaje de éxito
        this.errorMessage = '';
        
        // Pre-llenar el email en el formulario de login
        this.loginForm.patchValue({ email: registerData.email });
        
        // Mostrar mensaje temporal de éxito
        const successMessage = 'Registro exitoso. Ya puedes iniciar sesión con tu cuenta.';
        setTimeout(() => {
          // Mostrar mensaje en algún lugar o usar un toast service
          console.log(successMessage);
        }, 100);
      } else {
        this.errorMessage = result.message || 'Error al registrar la cuenta. Por favor, intenta nuevamente.';
      }
    } catch (error: any) {
      this.errorMessage = error?.message || 'Error de conexión. Por favor, intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  /*
  async onForgotPassword(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isLoading = true;
    this.forgotPasswordMessage = '';

    try {
      const email = this.forgotPasswordForm.value.email;
      
      // Simulación de envío de email (implementar según backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.forgotPasswordMessage = `Se ha enviado un enlace de recuperación a ${email}. Revisa tu bandeja de entrada y spam.`;
      this.forgotPasswordForm.reset();
      
    } catch (error: any) {
      this.forgotPasswordMessage = 'Error al enviar el email de recuperación. Por favor, intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }
  */

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private resetForms(): void {
    this.loginForm.reset();
    this.registerForm.reset();
    this.forgotPasswordForm.reset();
    this.showForgotPasswordForm = false;
    this.showContactAdminForm = false;
    this.forgotPasswordMessage = '';
  }
}
