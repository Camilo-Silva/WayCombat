import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // Para ngModel en el modal
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { MixService } from '../../services/mix.service';
import { Usuario } from '../../models/auth.models';
import { Mix, ArchivoMix, CreateMixRequest, UpdateMixRequest, CreateArchivoMixRequest, UpdateArchivoMixRequest } from '../../models/mix.models';

interface UsuarioMixPermiso {
  usuarioId: number;
  mixId: number;
  activo: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private mixService = inject(MixService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // Estado de la vista
  activeTab: 'mixs' | 'usuarios' | 'permisos' = 'mixs';
  isLoading = false;
  isCreatingMix = false;
  editingMixId: number | null = null;
  showDriveHelp = false;

  // Datos
  mixs: Mix[] = [];
  usuarios: Usuario[] = [];
  permisos: UsuarioMixPermiso[] = [];

  // Filtros y búsqueda de usuarios
  searchText: string = '';
  filterMixsAsignados: 'todos' | 'con-mixs' | 'sin-mixs' = 'todos';
  usuariosFiltrados: Usuario[] = [];

  // Filtros y búsqueda para matriz de permisos
  searchTextPermisos: string = '';
  filterMixsAsignadosPermisos: 'todos' | 'con-mixs' | 'sin-mixs' = 'todos';
  usuariosFiltradosPermisos: Usuario[] = [];

  // Modal de eliminación de usuario
  userToDelete: Usuario | null = null;
  deleteConfirmationText: string = '';

  // Modal de agregar archivo
  showArchivoModal = false;
  archivoModalForm: FormGroup;
  editingArchivoIndex: number | null = null;
  archivosTemporales: any[] = [];

  // Formularios
  mixForm: FormGroup;
  
  constructor() {
    this.mixForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required]],
      activo: [true],
      archivos: this.fb.array([])
    });

    this.archivoModalForm = this.fb.group({
      nombre: ['', [Validators.required]],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      tipo: ['audio', [Validators.required]],
      descripcion: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  // ====== GESTIÓN DE PESTAÑAS ======
  setActiveTab(tab: 'mixs' | 'usuarios' | 'permisos'): void {
    this.activeTab = tab;
    // Ya no cargamos datos condicionalmente, todo se carga al inicio
  }

  // ====== CARGA DE DATOS ======
  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      // Cargar todos los datos necesarios al inicio
      await Promise.all([
        this.loadMixs(),
        this.loadUsuarios(),
        this.loadPermisos()
      ]);
      
      // Sincronizar datos después de cargar todo
      this.syncUserMixData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMixs(): Promise<void> {
    try {
      console.log('🔍 AdminDashboard: Cargando mixs desde adminService...');
      // Cargar TODOS los mixs desde el admin service
      this.mixs = await this.adminService.getMixs();
      console.log('✅ AdminDashboard: Mixs cargados:', this.mixs);
    } catch (error) {
      console.error('❌ AdminDashboard: Error loading mixs:', error);
      this.loadMockMixs();
    }
  }

  private loadMockMixs(): void {
    // Datos mock para desarrollo
    this.mixs = [
      {
        id: 1,
        titulo: 'Mix Principiantes',
        descripcion: 'Primer mix para estudiantes',
        fechaCreacion: new Date(),
        activo: true,
        archivos: [
          {
            id: 1,
            mixId: 1,
            nombre: 'track1.mp3',
            url: 'https://drive.google.com/file/d/example1',
            tipo: 'Audio',
            mimeType: 'audio/mpeg',
            tamañoBytes: 5242880,
            orden: 1,
            fechaCreacion: new Date(),
            activo: true
          },
          {
            id: 2,
            mixId: 1,
            nombre: 'video1.mp4',
            url: 'https://drive.google.com/file/d/example2',
            tipo: 'Video',
            mimeType: 'video/mp4',
            tamañoBytes: 52428800,
            orden: 2,
            fechaCreacion: new Date(),
            activo: true
          }
        ]
      }
    ];
  }

  async loadUsuarios(): Promise<void> {
    try {
      this.usuarios = await this.adminService.getUsuarios();
    } catch (error) {
      console.error('Error loading usuarios:', error);
    }
  }

  async loadPermisos(): Promise<void> {
    try {
      this.permisos = await this.adminService.getPermisos();
    } catch (error) {
      console.error('Error loading permisos:', error);
    }
  }

  // ====== SINCRONIZACIÓN DE DATOS ======
  syncUserMixData(): void {
    // Calcular la cantidad de mixs asignados por usuario basándose en los permisos
    this.usuarios.forEach(usuario => {
      const mixsAsignados = this.permisos.filter(permiso => 
        permiso.usuarioId === usuario.id && permiso.activo
      ).length;
      
      // Agregar la propiedad mixsAsignados si no existe
      (usuario as any).mixsAsignados = mixsAsignados;
    });
    
    console.log('✅ Datos sincronizados - Usuarios con mixs asignados:', this.usuarios);
    
    // Aplicar filtros después de sincronizar
    this.applyFilters();
    this.applyFiltersPermisos();
  }

  // ====== FILTROS Y BÚSQUEDA ======
  applyFilters(): void {
    let usuariosFiltrados = [...this.usuarios];

    // Filtro por texto de búsqueda (nombre o email)
    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por mixs asignados
    if (this.filterMixsAsignados === 'con-mixs') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        this.getPermisosActivosCount(usuario.id!) > 0
      );
    } else if (this.filterMixsAsignados === 'sin-mixs') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        this.getPermisosActivosCount(usuario.id!) === 0
      );
    }

    this.usuariosFiltrados = usuariosFiltrados;
  }

  onSearchTextChange(): void {
    this.applyFilters();
  }

  onFilterMixsAsignadosChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterMixsAsignados = 'todos';
    this.applyFilters();
  }

  // ====== FILTROS Y BÚSQUEDA PARA MATRIZ DE PERMISOS ======
  applyFiltersPermisos(): void {
    let usuariosFiltrados = [...this.usuarios];

    // Filtro por texto de búsqueda (nombre o email)
    if (this.searchTextPermisos.trim()) {
      const searchLower = this.searchTextPermisos.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por mixs asignados
    if (this.filterMixsAsignadosPermisos === 'con-mixs') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        this.getPermisosActivosCount(usuario.id!) > 0
      );
    } else if (this.filterMixsAsignadosPermisos === 'sin-mixs') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        this.getPermisosActivosCount(usuario.id!) === 0
      );
    }

    this.usuariosFiltradosPermisos = usuariosFiltrados;
  }

  onSearchTextPermisosChange(): void {
    this.applyFiltersPermisos();
  }

  onFilterMixsAsignadosPermisosChange(): void {
    this.applyFiltersPermisos();
  }

  clearFiltersPermisos(): void {
    this.searchTextPermisos = '';
    this.filterMixsAsignadosPermisos = 'todos';
    this.applyFiltersPermisos();
  }

  // ====== MÉTODOS AUXILIARES PARA ESTADÍSTICAS ======
  get usuariosActivos(): number {
    return this.usuarios.filter(u => u.activo).length;
  }

  get usuariosInactivos(): number {
    return this.usuarios.filter(u => !u.activo).length;
  }

  get usuariosConMixs(): number {
    return this.usuarios.filter(u => this.getPermisosActivosCount(u.id!) > 0).length;
  }

  get usuariosSinMixs(): number {
    return this.usuarios.filter(u => this.getPermisosActivosCount(u.id!) === 0).length;
  }

  // ====== GESTIÓN DE ARCHIVOS EN FORMULARIO ======
  get archivosFormArray(): FormArray {
    return this.mixForm.get('archivos') as FormArray;
  }

  createArchivoFormGroup(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required]],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      tipo: ['audio', [Validators.required]],
      descripcion: ['']
    });
  }

  addArchivo(): void {
    this.archivosFormArray.push(this.createArchivoFormGroup());
  }

  removeArchivo(index: number): void {
    this.archivosFormArray.removeAt(index);
  }

  // ====== GESTIÓN DE MODAL DE ARCHIVO ======
  openArchivoModal(): void {
    this.showArchivoModal = true;
    this.editingArchivoIndex = null;
    this.archivoModalForm.reset({
      nombre: '',
      url: '',
      tipo: 'audio',
      descripcion: '',
      activo: true
    });
    this.showDriveHelp = false;
  }

  closeArchivoModal(): void {
    this.showArchivoModal = false;
    this.editingArchivoIndex = null;
    this.showDriveHelp = false;
  }

  editArchivoFromTable(index: number): void {
    const archivo = this.archivosTemporales[index];
    this.editingArchivoIndex = index;
    this.showArchivoModal = true;
    this.archivoModalForm.patchValue(archivo);
  }

  saveArchivoFromModal(): void {
    if (this.archivoModalForm.valid) {
      const archivoData = this.archivoModalForm.value;
      
      if (this.editingArchivoIndex !== null) {
        // Editar archivo existente - preservar ID si existe
        const archivoExistente = this.archivosTemporales[this.editingArchivoIndex];
        this.archivosTemporales[this.editingArchivoIndex] = {
          ...archivoData,
          id: archivoExistente.id // Preservar el ID del archivo existente
        };
      } else {
        // Agregar nuevo archivo
        this.archivosTemporales.push(archivoData);
      }
      
      this.closeArchivoModal();
    }
  }

  removeArchivoFromTable(index: number): void {
    this.archivosTemporales.splice(index, 1);
  }

  convertDriveUrlInModal(): void {
    const urlControl = this.archivoModalForm.get('url');
    if (urlControl?.value) {
      const convertedUrl = this.processUrlConversion(urlControl.value);
      if (convertedUrl) {
        urlControl.setValue(convertedUrl);
      }
    }
  }

  private processUrlConversion(currentUrl: string): string | null {
    if (!currentUrl) {
      alert('Por favor, ingresa primero una URL de Google Drive');
      return null;
    }

    // Detectar si es URL de Google Drive
    if (currentUrl.includes('drive.google.com/file/d/')) {
      try {
        // Extraer el ID del archivo de Google Drive
        const match = currentUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        
        if (match && match[1]) {
          const fileId = match[1];
          // Convertir a URL directa para descarga/reproducción
          const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          // Mostrar mensaje de éxito
          alert('✅ URL convertida exitosamente!\n\nAhora el archivo se puede reproducir directamente en la aplicación.');
          return directUrl;
        } else {
          alert('❌ No se pudo extraer el ID del archivo.\n\nAsegúrate de que la URL sea del formato:\nhttps://drive.google.com/file/d/ID_DEL_ARCHIVO/view');
          return null;
        }
      } catch (error) {
        console.error('Error converting Drive URL:', error);
        alert('❌ Error al convertir la URL. Por favor, verifica el formato.');
        return null;
      }
    } else if (currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be') || currentUrl.includes('music.youtube.com')) {
      alert('✅ Esta es una URL de YouTube válida.\n\nNo necesita conversión, se reproducirá automáticamente en la aplicación.');
      return currentUrl;
    } else {
      alert('❌ Esta no parece ser una URL de Google Drive o YouTube.\n\nFormatos soportados:\n• Google Drive: https://drive.google.com/file/d/...\n• YouTube: https://youtube.com/watch?v=...\n• YouTube Music: https://music.youtube.com/watch?v=...');
      return null;
    }
  }

  // ====== GESTIÓN DE MIXS ======
  startCreatingMix(): void {
    this.isCreatingMix = true;
    this.editingMixId = null;
    this.mixForm.reset({
      titulo: '',
      descripcion: '',
      activo: true
    });
    this.archivosFormArray.clear();
    this.archivosTemporales = []; // Limpiar archivos temporales
  }

  editMix(mix: Mix): void {
    this.isCreatingMix = true;
    this.editingMixId = mix.id || null;
    
    this.mixForm.patchValue({
      titulo: mix.titulo,
      descripcion: mix.descripcion,
      activo: mix.activo
    });

    // Cargar archivos en la lista temporal con sus IDs para poder editarlos
    this.archivosTemporales = mix.archivos.map(archivo => ({
      id: archivo.id, // Importante: preservar el ID para edición
      nombre: archivo.nombre,
      url: archivo.url,
      tipo: archivo.tipo,
      descripcion: '', // ArchivoMix no tiene descripcion, usar string vacío
      activo: archivo.activo
    }));
    
    this.archivosFormArray.clear();
  }

  cancelEdit(): void {
    this.isCreatingMix = false;
    this.editingMixId = null;
    this.mixForm.reset();
    this.archivosTemporales = []; // Limpiar archivos temporales
  }

  async saveMix(): Promise<void> {
    console.log('saveMix() ejecutado, editingMixId:', this.editingMixId); // Debug
    
    if (this.mixForm.invalid) {
      this.markFormGroupTouched(this.mixForm);
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.mixForm.value;
      
      if (this.editingMixId) {
        // Actualizar mix existente
        const editingMix = this.mixs.find(m => m.id === this.editingMixId);
        
        // Usar archivos temporales en lugar del FormArray
        const archivosFromForm = this.archivosTemporales || [];
        
        console.log('Archivos temporales a enviar:', archivosFromForm); // Debug
        
        const updateData: UpdateMixRequest = {
          titulo: formValue.titulo,
          descripcion: formValue.descripcion,
          activo: true, // Por defecto activo al actualizar
          archivos: archivosFromForm.map((archivo: any, index: number) => ({
            id: archivo.id || 0, // Usar el ID del archivo si existe (archivos existentes) o 0 para nuevos
            tipo: archivo.tipo,
            nombre: archivo.nombre,
            url: archivo.url,
            mimeType: archivo.mimeType || (archivo.tipo === 'audio' ? 'audio/mpeg' : 'video/mp4'),
            tamañoBytes: archivo.tamañoBytes || null,
            orden: index + 1,
            activo: archivo.activo !== false // Default true si no está definido
          }))
        };
        
        console.log('UpdateData a enviar:', updateData); // Debug
        
        this.mixService.updateMix(this.editingMixId, updateData).subscribe({
          next: () => {
            console.log('Mix actualizado exitosamente');
            this.loadMixs();
            this.cancelEdit();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error actualizando mix:', error);
            this.isLoading = false;
          }
        });
      } else {
        // Crear nuevo mix
        const createMixData: CreateMixRequest = {
          titulo: formValue.titulo,
          descripcion: formValue.descripcion
        };

        try {
          const newMix = await this.adminService.createMix(createMixData);
          console.log('Mix creado exitosamente:', newMix);
          
          // Crear archivos del mix usando archivos temporales
          if (this.archivosTemporales.length > 0) {
            this.createMixArchivos(newMix.id, this.archivosTemporales);
          } else {
            this.loadMixs();
            // Actualizar permisos para mostrar la auto-asignación
            this.loadPermisos();
            this.cancelEdit();
            this.isLoading = false;
          }
        } catch (error) {
          console.error('Error creando mix:', error);
          this.isLoading = false;
        }
      }
    } catch (error) {
      console.error('Error saving mix:', error);
      this.isLoading = false;
    }
  }

  private createMixArchivos(mixId: number, archivos: any[]): void {
    let completedRequests = 0;
    const totalRequests = archivos.length;

    archivos.forEach((archivo, index) => {
      const archivoData: CreateArchivoMixRequest = {
        tipo: archivo.tipo === 'audio' ? 'Audio' : 'Video',
        nombre: archivo.nombre,
        url: archivo.url,
        mimeType: archivo.tipo === 'audio' ? 'audio/mpeg' : 'video/mp4',
        orden: index + 1
      };

      this.mixService.addArchivo(mixId, archivoData).subscribe({
        next: () => {
          completedRequests++;
          if (completedRequests === totalRequests) {
            console.log('Todos los archivos creados exitosamente');
            this.loadMixs();
            // Actualizar permisos para mostrar la auto-asignación
            this.loadPermisos();
            this.cancelEdit();
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          console.error('Error creando archivo:', error);
          completedRequests++;
          if (completedRequests === totalRequests) {
            this.loadMixs();
            // Actualizar permisos para mostrar la auto-asignación
            this.loadPermisos();
            this.cancelEdit();
            this.isLoading = false;
          }
        }
      });
    });
  }

  async deleteMix(mixId: number): Promise<void> {
    if (!confirm('¿Estás seguro de que quieres eliminar este mix?')) {
      return;
    }

    this.isLoading = true;
    try {
      this.mixService.deleteMix(mixId).subscribe({
        next: () => {
          console.log('Mix eliminado exitosamente');
          this.loadMixs();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error eliminando mix:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error deleting mix:', error);
      this.isLoading = false;
    }
  }

  async toggleMixActivo(mixId: number): Promise<void> {
    try {
      await this.adminService.toggleMixActivo(mixId);
      
      // Actualizar localmente el estado del mix
      const mix = this.mixs.find(m => m.id === mixId);
      if (mix) {
        mix.activo = !mix.activo;
      }
      
      console.log('Estado del mix actualizado exitosamente');
    } catch (error) {
      console.error('Error toggling mix activo:', error);
      alert('Error al cambiar el estado del mix. Por favor intenta de nuevo.');
    }
  }

  // ====== GESTIÓN DE PERMISOS ======
  async toggleUsuarioMixPermiso(usuarioId: number, mixId: number): Promise<void> {
    try {
      await this.adminService.toggleUsuarioMixPermiso(usuarioId, mixId);
      await this.loadPermisos();
      // Sincronizar datos después de cambiar permisos
      this.syncUserMixData();
    } catch (error) {
      console.error('Error toggling permiso:', error);
    }
  }

  hasPermiso(usuarioId: number, mixId: number): boolean {
    return this.permisos.some(p => 
      p.usuarioId === usuarioId && 
      p.mixId === mixId && 
      p.activo
    );
  }

  getPermisosActivosCount(usuarioId: number): number {
    return this.permisos.filter(p => 
      p.usuarioId === usuarioId && p.activo
    ).length;
  }

  // ====== GESTIÓN DE USUARIOS ======

  async toggleUsuarioActivo(usuarioId: number): Promise<void> {
    try {
      const usuario = this.usuarios.find(u => u.id === usuarioId);
      if (!usuario) {
        console.error('Usuario no encontrado');
        return;
      }

      // Confirmar la acción
      const accion = usuario.activo ? 'desactivar' : 'activar';
      const confirmacion = confirm(`¿Estás seguro de que quieres ${accion} a ${usuario.nombre}?`);
      
      if (!confirmacion) {
        return;
      }

      // Llamar al servicio
      const usuarioActualizado = await this.adminService.toggleUsuarioActivo(usuarioId);
      
      // Actualizar el usuario en la lista local
      const index = this.usuarios.findIndex(u => u.id === usuarioId);
      if (index !== -1) {
        this.usuarios[index] = usuarioActualizado;
      }

      // Sincronizar datos después de cambiar estado del usuario
      this.syncUserMixData();

      console.log(`Usuario ${usuario.nombre} ${usuario.activo ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.error('Error toggling usuario activo:', error);
      alert('Error al cambiar el estado del usuario. Por favor intenta de nuevo.');
    }
  }

  confirmResetPassword(usuario: Usuario): void {
    // No permitir resetear contraseñas de administradores
    if (usuario.rol === 'admin') {
      alert('No se puede resetear la contraseña de usuarios administradores.');
      return;
    }

    const confirmation = confirm(
      `¿Estás seguro de que quieres resetear la contraseña de ${usuario.nombre}?\n\n` +
      `La nueva contraseña será: 123456\n\n` +
      `El usuario deberá usar esta contraseña para iniciar sesión.`
    );

    if (confirmation) {
      this.resetUserPassword(usuario.id!);
    }
  }

  async resetUserPassword(userId: number): Promise<void> {
    try {
      await this.adminService.resetUserPassword(userId);
      alert('Contraseña reseteada exitosamente. La nueva contraseña es: 123456');
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      alert('Error al resetear la contraseña. Por favor intenta de nuevo.');
    }
  }

  confirmDeleteUsuario(usuario: Usuario): void {
    // No permitir eliminar administradores
    if (usuario.rol === 'admin') {
      alert('No se pueden eliminar usuarios administradores.');
      return;
    }

    // Configurar el modal
    this.userToDelete = usuario;
    this.deleteConfirmationText = '';
    
    // Mostrar el modal de forma más segura
    const modalElement = document.getElementById('deleteUserModal');
    if (modalElement) {
      try {
        // Intentar usar Bootstrap 5
        const bootstrap = (window as any).bootstrap;
        if (bootstrap && bootstrap.Modal) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        } else {
          // Fallback: usar atributos data de Bootstrap
          modalElement.classList.add('show');
          modalElement.style.display = 'block';
          modalElement.setAttribute('aria-modal', 'true');
          modalElement.removeAttribute('aria-hidden');
          
          // Agregar backdrop
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'deleteUserModal-backdrop';
          document.body.appendChild(backdrop);
          document.body.classList.add('modal-open');
        }
      } catch (error) {
        console.error('Error showing modal:', error);
        // Fallback simple: usar confirm
        const confirmMessage = `¿Estás seguro de que quieres eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer.`;
        if (confirm(confirmMessage)) {
          this.deleteUsuario(usuario.id!);
        }
      }
    }
  }

  executeDeleteUsuario(): void {
    if (!this.userToDelete || this.deleteConfirmationText !== 'ELIMINAR') {
      return;
    }

    // Cerrar el modal de forma segura
    this.hideDeleteModal();

    // Ejecutar la eliminación
    this.deleteUsuario(this.userToDelete.id!);
    
    // Limpiar las variables del modal
    this.userToDelete = null;
    this.deleteConfirmationText = '';
  }

  private hideDeleteModal(): void {
    const modalElement = document.getElementById('deleteUserModal');
    if (modalElement) {
      try {
        const bootstrap = (window as any).bootstrap;
        if (bootstrap && bootstrap.Modal) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          } else {
            // Si no hay instancia, crear una nueva y cerrarla
            const newModal = new bootstrap.Modal(modalElement);
            newModal.hide();
          }
        } else {
          // Fallback manual
          modalElement.classList.remove('show');
          modalElement.style.display = 'none';
          modalElement.setAttribute('aria-hidden', 'true');
          modalElement.removeAttribute('aria-modal');
          
          // Remover backdrop
          const backdrop = document.getElementById('deleteUserModal-backdrop');
          if (backdrop) {
            backdrop.remove();
          }
          document.body.classList.remove('modal-open');
        }
      } catch (error) {
        console.error('Error hiding modal:', error);
        // Fallback: ocultar manualmente
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    }
  }

  cancelDeleteUsuario(): void {
    this.hideDeleteModal();
    this.userToDelete = null;
    this.deleteConfirmationText = '';
  }

  async deleteUsuario(usuarioId: number): Promise<void> {
    try {
      const usuario = this.usuarios.find(u => u.id === usuarioId);
      if (!usuario) {
        console.error('Usuario no encontrado');
        return;
      }

      // Llamar al servicio
      await this.adminService.deleteUsuario(usuarioId);
      
      // Remover el usuario de la lista local
      this.usuarios = this.usuarios.filter(u => u.id !== usuarioId);

      // También remover todos los permisos del usuario
      this.permisos = this.permisos.filter(p => p.usuarioId !== usuarioId);

      // Sincronizar datos después de eliminar usuario
      this.syncUserMixData();

      console.log(`Usuario ${usuario.nombre} eliminado exitosamente`);
      alert(`Usuario ${usuario.nombre} eliminado exitosamente.`);
    } catch (error) {
      console.error('Error deleting usuario:', error);
      alert('Error al eliminar el usuario. Por favor intenta de nuevo.');
    }
  }

  // ====== UTILIDADES ======
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(ctrl => {
          if (ctrl instanceof FormGroup) {
            this.markFormGroupTouched(ctrl);
          } else {
            ctrl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.mixForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.mixForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['pattern']) return 'URL inválida (debe comenzar con http:// o https://)';
    
    return 'Campo inválido';
  }

  // ====== FUNCIONES PARA GOOGLE DRIVE Y YOUTUBE ======
  
  toggleDriveHelp(): void {
    this.showDriveHelp = !this.showDriveHelp;
  }

  convertDriveUrl(index: number): void {
    const archivoFormGroup = this.archivosFormArray.at(index) as FormGroup;
    const urlControl = archivoFormGroup.get('url');
    
    if (!urlControl) return;
    
    const currentUrl = urlControl.value;
    
    if (!currentUrl) {
      alert('Por favor, ingresa primero una URL de Google Drive');
      return;
    }

    // Detectar si es URL de Google Drive
    if (currentUrl.includes('drive.google.com/file/d/')) {
      try {
        // Extraer el ID del archivo de Google Drive
        const match = currentUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        
        if (match && match[1]) {
          const fileId = match[1];
          // Convertir a URL directa para descarga/reproducción
          const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          urlControl.setValue(directUrl);
          
          // Mostrar mensaje de éxito
          alert('✅ URL convertida exitosamente!\n\nAhora el archivo se puede reproducir directamente en la aplicación.');
        } else {
          alert('❌ No se pudo extraer el ID del archivo.\n\nAsegúrate de que la URL sea del formato:\nhttps://drive.google.com/file/d/ID_DEL_ARCHIVO/view');
        }
      } catch (error) {
        console.error('Error converting Drive URL:', error);
        alert('❌ Error al convertir la URL. Por favor, verifica el formato.');
      }
    } else if (currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be') || currentUrl.includes('music.youtube.com')) {
      alert('✅ Esta es una URL de YouTube válida.\n\nNo necesita conversión, se reproducirá automáticamente en la aplicación.');
    } else {
      alert('❌ Esta no parece ser una URL de Google Drive o YouTube.\n\nFormatos soportados:\n• Google Drive: https://drive.google.com/file/d/...\n• YouTube: https://youtube.com/watch?v=...\n• YouTube Music: https://music.youtube.com/watch?v=...');
    }
  }

  // Función auxiliar para validar URLs de archivos multimedia
  isValidMediaUrl(url: string): boolean {
    return url.includes('drive.google.com') || 
           url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('music.youtube.com');
  }

  // Función para obtener el tipo de archivo basado en la URL
  getFileTypeFromUrl(url: string): 'audio' | 'video' {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('music.youtube.com')) {
      return 'video';
    }
    
    // Para Google Drive, podríamos inferir por el nombre del archivo
    // o por defecto asumir audio si no está claro
    return 'audio';
  }
}
