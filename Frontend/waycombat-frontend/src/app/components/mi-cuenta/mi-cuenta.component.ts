import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/auth.models';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mi-cuenta.component.html',
  styleUrl: './mi-cuenta.component.css'
})
export class MiCuentaComponent implements OnInit {
  private authService = inject(AuthService);

  isAuthenticated: boolean = false;
  currentUser: Usuario | null = null;
  isChangingPassword: boolean = false;
  editingProfile: boolean = false;
  
  // Variables para edición de perfil
  editedUserName: string = '';
  isUpdatingProfile: boolean = false;

  // Contraseñas
  passwordData: PasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Visibilidad de contraseñas
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Toast notifications
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    if (this.isAuthenticated) {
      this.currentUser = this.authService.getCurrentUser();
      // Inicializar el nombre editable con el nombre actual
      if (this.currentUser) {
        this.editedUserName = this.currentUser.nombre;
      }
    }
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.showToastMessage('Las contraseñas no coinciden', 'error');
      return;
    }

    this.isChangingPassword = true;

    try {
      // Mapear datos del formulario al formato esperado por el backend
      const request = {
        contraseñaActual: this.passwordData.currentPassword,
        nuevaContraseña: this.passwordData.newPassword
      };

      await this.authService.changePassword(request).toPromise();
      
      this.showToastMessage('Contraseña cambiada exitosamente', 'success');
      this.resetPasswordForm();
      
    } catch (error: any) {
      const message = error?.error?.message || 'Error al cambiar la contraseña';
      this.showToastMessage(message, 'error');
      console.error('Error changing password:', error);
    } finally {
      this.isChangingPassword = false;
    }
  }

  resetPasswordForm(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  toggleEditProfile(): void {
    if (this.editingProfile) {
      // Cancelar edición - restaurar valor original
      if (this.currentUser) {
        this.editedUserName = this.currentUser.nombre;
      }
    }
    this.editingProfile = !this.editingProfile;
  }

  async updateProfile(): Promise<void> {
    if (!this.currentUser || !this.editedUserName.trim()) {
      this.showToastMessage('El nombre no puede estar vacío', 'error');
      return;
    }

    // Verificar si realmente cambió el nombre
    if (this.editedUserName.trim() === this.currentUser.nombre) {
      this.editingProfile = false;
      return;
    }

    this.isUpdatingProfile = true;

    try {
      // Crear objeto con los datos actualizados
      const updatedUser: Usuario = {
        ...this.currentUser,
        nombre: this.editedUserName.trim()
      };

      await this.authService.updateProfile(updatedUser).toPromise();
      
      // Actualizar el usuario local
      this.currentUser = updatedUser;
      this.editingProfile = false;
      
      this.showToastMessage('Perfil actualizado exitosamente', 'success');
      
    } catch (error: any) {
      const message = error?.error?.message || 'Error al actualizar el perfil';
      this.showToastMessage(message, 'error');
      console.error('Error updating profile:', error);
      
      // Restaurar valor original en caso de error
      if (this.currentUser) {
        this.editedUserName = this.currentUser.nombre;
      }
    } finally {
      this.isUpdatingProfile = false;
    }
  }

  logout(): void {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      this.authService.logout();
      this.showToastMessage('Sesión cerrada exitosamente', 'success');
      // Redirigir al usuario (esto se podría hacer con Router)
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }

  private showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast(): void {
    this.showToast = false;
  }
}
