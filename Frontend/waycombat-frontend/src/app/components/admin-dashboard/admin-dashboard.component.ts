import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { MixService } from '../../services/mix.service';
import { GaleriaService, GaleriaItem, CategoriaGaleria } from '../../services/galeria.service';
import { ConfigService } from '../../services/config.service';
import { Usuario } from '../../models/auth.models';
import { Mix, CreateMixRequest, UpdateMixRequest, CreateArchivoMixRequest } from '../../models/mix.models';

interface UsuarioMixPermiso {
  usuarioId: string; // UUID
  mixId: string; // UUID
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
  private galeriaService = inject(GaleriaService);
  private configService = inject(ConfigService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // Estado de la vista
  activeTab: 'mixs' | 'usuarios' | 'permisos' | 'galeria' = 'mixs';
  isLoading = false;
  isCreatingMix = false;
  editingMixId: string | null = null; // UUID
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

  // Modales de confirmación
  showToggleUserModal = false;
  userToToggle: Usuario | null = null;
  showResetPasswordModal = false;
  userToResetPassword: Usuario | null = null;
  showDeleteMixModal = false;
  mixToDelete: Mix | null = null;
  deleteMixConfirmationText: string = '';

  // Modal de éxito después de enviar email
  showPasswordResetSuccessModal = false;
  resetPasswordSuccessData: { userName: string; userEmail: string } | null = null;

  // Modal de agregar archivo
  showArchivoModal = false;
  archivoModalForm: FormGroup;
  editingArchivoIndex: number | null = null;
  archivosTemporales: any[] = [];

  // ====== GALERÍA ABM ======
  galeriaItems: GaleriaItem[] = [];
  galeriaFiltro: string = 'todos';
  galeriaSearchText: string = '';
  galeriaItemsFiltrados: GaleriaItem[] = [];

  // Modal galería
  showGaleriaModal = false;
  editingGaleriaItem: GaleriaItem | null = null;
  galeriaForm: FormGroup;
  galeriaIsUploading = false;
  galeriaUploadProgress = 0;
  galeriaSelectedFile: File | null = null;
  galeriaPreviewUrl: string | null = null;
  galeriaUseUrl = false;

  // Modal eliminar galería
  showDeleteGaleriaModal = false;
  galeriaItemToDelete: GaleriaItem | null = null;
  deleteGaleriaConfirmText = '';

  // ====== CTA CERTIFICACIÓN ======
  ctaTexto = 'PRÓXIMA FECHA DE CERTIFICACIÓN';
  ctaSublabel = '— Click acá para más info.';
  ctaActivo = true;
  ctaIsSaving = false;

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
      activo: [true]
    });

    this.galeriaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      categoria: ['entrenamientos', [Validators.required]],
      url: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  // ====== GESTIÓN DE PESTAÑAS ======
  setActiveTab(tab: 'mixs' | 'usuarios' | 'permisos' | 'galeria'): void {
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
        this.loadPermisos(),
        this.loadGaleria(),
        this.loadConfig()
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
      this.mixs = []; // Limpiar mixs en caso de error
    }
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
      tipo: ['audio', [Validators.required]]
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
        // Editar archivo existente - preservar TODOS los campos existentes
        const archivoExistente = this.archivosTemporales[this.editingArchivoIndex];
        this.archivosTemporales[this.editingArchivoIndex] = {
          ...archivoExistente, // ✅ Primero copiar todos los campos existentes
          ...archivoData,      // ✅ Luego sobrescribir solo los editados del formulario
          id: archivoExistente.id // ✅ Asegurar que el ID se preserve
        };
      } else {
        // Agregar nuevo archivo - el mimeType se generará en saveMix()
        this.archivosTemporales.push({
          ...archivoData,
          mimeType: archivoData.tipo === 'audio' ? 'audio/mpeg' : 'video/mp4', // ✅ Generar mimeType
          tamañoBytes: null // ✅ Nuevos archivos no tienen tamaño conocido
        });
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

    // Cargar archivos en la lista temporal con TODOS los campos necesarios
    this.archivosTemporales = mix.archivos.map(archivo => ({
      id: archivo.id, // Importante: preservar el ID para edición
      nombre: archivo.nombre,
      url: archivo.url,
      tipo: archivo.tipo,
      activo: archivo.activo,
      mimeType: archivo.mimeType, // ✅ AGREGADO: necesario para saveMix()
      tamañoBytes: archivo.tamañoBytes || null, // ✅ AGREGADO: necesario para saveMix()
      orden: archivo.orden // ✅ AGREGADO: preservar el orden original
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

        if (!editingMix) {
          console.error('Mix a editar no encontrado');
          this.isLoading = false;
          return;
        }

        // Usar archivos temporales en lugar del FormArray
        const archivosFromForm = this.archivosTemporales || [];

        console.log('Archivos temporales a enviar:', archivosFromForm); // Debug

        const updateData: UpdateMixRequest = {
          titulo: formValue.titulo,
          descripcion: formValue.descripcion,
          activo: formValue.activo, // ✅ FIX: Usar el valor del formulario (permite edición)
          archivos: archivosFromForm.map((archivo: any, index: number) => ({
            id: archivo.id || undefined, // ✅ Usar undefined para nuevos archivos (sin ID válido)
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

        try {
          const result = await this.mixService.updateMix(this.editingMixId, updateData);

          if (result.success) {
            console.log('Mix actualizado exitosamente');
            await this.loadMixs();
            this.cancelEdit();
          } else {
            console.error('Error actualizando mix:', result.message);
          }
        } catch (error) {
          console.error('Error actualizando mix:', error);
        } finally {
          this.isLoading = false;
        }
      } else {
        // Crear nuevo mix
        const createMixData: CreateMixRequest = {
          titulo: formValue.titulo,
          descripcion: formValue.descripcion
        };

        try {
          const newMix = await this.adminService.createMix(createMixData);

          if (!newMix) {
            console.error('Error: No se pudo crear el mix');
            alert('Error al crear el mix. Por favor intenta de nuevo.');
            this.isLoading = false;
            return;
          }

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

  private async createMixArchivos(mixId: string, archivos: any[]): Promise<void> {
    try {
      for (const [index, archivo] of archivos.entries()) {
        const archivoData: CreateArchivoMixRequest = {
          tipo: archivo.tipo === 'audio' ? 'Audio' : 'Video',
          nombre: archivo.nombre,
          url: archivo.url,
          mimeType: archivo.tipo === 'audio' ? 'audio/mpeg' : 'video/mp4',
          orden: index + 1
        };

        await this.mixService.addArchivo(mixId, archivoData);
      }

      console.log('Todos los archivos creados exitosamente');
      await this.loadMixs();
      await this.loadPermisos();
      this.cancelEdit();
    } catch (error) {
      console.error('Error creando archivos:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ====== MODAL: ELIMINAR MIX ======
  confirmDeleteMix(mix: Mix): void {
    this.mixToDelete = mix;
    this.deleteMixConfirmationText = '';
    this.showDeleteMixModal = true;
  }

  cancelDeleteMix(): void {
    this.showDeleteMixModal = false;
    this.mixToDelete = null;
    this.deleteMixConfirmationText = '';
  }

  async executeDeleteMix(): Promise<void> {
    if (!this.mixToDelete || this.deleteMixConfirmationText !== 'ELIMINAR') {
      return;
    }

    this.showDeleteMixModal = false;
    this.isLoading = true;

    try {
      const result = await this.mixService.deleteMix(this.mixToDelete.id!);

      if (result.success) {
        console.log('Mix eliminado exitosamente');
        await this.loadMixs();
      } else {
        console.error('Error eliminando mix:', result.message);
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting mix:', error);
      alert('Error al eliminar el mix');
    } finally {
      this.isLoading = false;
      this.mixToDelete = null;
      this.deleteMixConfirmationText = '';
    }
  }

  async toggleMixActivo(mixId: string): Promise<void> {
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
  async toggleUsuarioMixPermiso(usuarioId: string, mixId: string): Promise<void> {
    try {
      await this.adminService.toggleUsuarioMixPermiso(usuarioId, mixId);
      await this.loadPermisos();
      // Sincronizar datos después de cambiar permisos
      this.syncUserMixData();
    } catch (error) {
      console.error('Error toggling permiso:', error);
    }
  }

  hasPermiso(usuarioId: string, mixId: string): boolean {
    return this.permisos.some(p =>
      p.usuarioId === usuarioId &&
      p.mixId === mixId &&
      p.activo
    );
  }

  getPermisosActivosCount(usuarioId: string): number {
    return this.permisos.filter(p =>
      p.usuarioId === usuarioId && p.activo
    ).length;
  }

  // ====== GESTIÓN DE USUARIOS ======

  // ====== MODAL: TOGGLE USUARIO ACTIVO ======
  confirmToggleUsuario(usuario: Usuario): void {
    this.userToToggle = usuario;
    this.showToggleUserModal = true;
  }

  cancelToggleUsuario(): void {
    this.showToggleUserModal = false;
    this.userToToggle = null;
  }

  async executeToggleUsuario(): Promise<void> {
    if (!this.userToToggle) {
      return;
    }

    this.showToggleUserModal = false;

    try {
      // Llamar al servicio
      const usuarioActualizado = await this.adminService.toggleUsuarioActivo(this.userToToggle.id);

      // Actualizar el usuario en la lista local
      const index = this.usuarios.findIndex(u => u.id === this.userToToggle!.id);
      if (index !== -1 && usuarioActualizado) {
        this.usuarios[index] = usuarioActualizado;
      }

      // Sincronizar datos después de cambiar estado del usuario
      this.syncUserMixData();

      console.log(`Usuario ${this.userToToggle.nombre} ${this.userToToggle.activo ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.error('Error toggling usuario activo:', error);
      alert('Error al cambiar el estado del usuario. Por favor intenta de nuevo.');
    } finally {
      this.userToToggle = null;
    }
  }

  // ====== MODAL: RESET PASSWORD ======
  showResetPasswordConfirmation(usuario: Usuario): void {
    // No permitir resetear contraseñas de administradores
    if (usuario.rol === 'admin') {
      alert('No se puede resetear la contraseña de usuarios administradores.');
      return;
    }

    this.userToResetPassword = usuario;
    this.showResetPasswordModal = true;
  }

  cancelResetPassword(): void {
    this.showResetPasswordModal = false;
    this.userToResetPassword = null;
  }

  executeResetPassword(): void {
    if (!this.userToResetPassword) {
      return;
    }

    this.showResetPasswordModal = false;
    this.sendPasswordResetEmail(this.userToResetPassword.email, this.userToResetPassword.nombre);
    this.userToResetPassword = null;
  }

  async sendPasswordResetEmail(userEmail: string, userName: string): Promise<void> {
    try {
      await this.adminService.sendPasswordResetEmail(userEmail);

      // Mostrar modal de éxito
      this.resetPasswordSuccessData = { userName, userEmail };
      this.showPasswordResetSuccessModal = true;
    } catch (error) {
      console.error('Error al enviar email de reset:', error);
      alert('❌ Error al enviar el email de recuperación. Por favor intenta de nuevo.');
    }
  }

  closePasswordResetSuccessModal(): void {
    this.showPasswordResetSuccessModal = false;
    this.resetPasswordSuccessData = null;
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
          this.deleteUsuario(usuario.id);
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
    this.deleteUsuario(this.userToDelete.id);

    // Limpiar las variables del modal
    this.userToDelete = null;
    this.deleteConfirmationText = '';
  }

  private hideDeleteModal(): void {
    const modalElement = document.getElementById('deleteUserModal');
    if (modalElement) {
      try {
        const bootstrap = (window as any).bootstrap;
        if (bootstrap?.Modal) {
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

  async deleteUsuario(usuarioId: string): Promise<void> {
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

  // ====== FUNCIONES PARA GOOGLE DRIVE======

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

  // ====== GALERÍA ABM ======

  async loadGaleria(): Promise<void> {
    try {
      this.galeriaItems = await this.galeriaService.getAllAdmin();
      this.applyGaleriaFilters();
    } catch (error) {
      console.error('Error cargando galería:', error);
    }
  }

  applyGaleriaFilters(): void {
    let items = [...this.galeriaItems];
    if (this.galeriaFiltro !== 'todos') {
      items = items.filter(i => i.categoria === this.galeriaFiltro);
    }
    if (this.galeriaSearchText.trim()) {
      const q = this.galeriaSearchText.toLowerCase();
      items = items.filter(i =>
        i.titulo.toLowerCase().includes(q) ||
        (i.descripcion || '').toLowerCase().includes(q)
      );
    }
    this.galeriaItemsFiltrados = items;
  }

  openGaleriaModal(item?: GaleriaItem): void {
    this.editingGaleriaItem = item || null;
    this.galeriaSelectedFile = null;
    this.galeriaPreviewUrl = null;
    this.galeriaUseUrl = false;
    this.galeriaForm.reset({
      titulo: item?.titulo || '',
      descripcion: item?.descripcion || '',
      categoria: item?.categoria || 'entrenamientos',
      url: item?.url || '',
      activo: item?.activo !== false
    });
    // Si ya tiene URL y no tiene storage_path, es URL externa
    if (item?.url && !item?.storage_path) {
      this.galeriaUseUrl = true;
      this.galeriaPreviewUrl = item.url;
    } else if (item?.url) {
      this.galeriaPreviewUrl = item.url;
    }
    this.showGaleriaModal = true;
  }

  closeGaleriaModal(): void {
    this.showGaleriaModal = false;
    this.editingGaleriaItem = null;
    this.galeriaSelectedFile = null;
    this.galeriaPreviewUrl = null;
    this.galeriaUseUrl = false;
  }

  onGaleriaFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    this.galeriaSelectedFile = file;
    this.galeriaUseUrl = false;
    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      this.galeriaPreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onGaleriaUrlChange(): void {
    const url = this.galeriaForm.get('url')?.value;
    if (url) {
      this.galeriaPreviewUrl = url;
      this.galeriaSelectedFile = null;
    }
  }

  async saveGaleriaItem(): Promise<void> {
    if (this.galeriaForm.invalid) {
      this.galeriaForm.markAllAsTouched();
      return;
    }

    const formValue = this.galeriaForm.value;

    // Validar que haya imagen (archivo o URL)
    if (!this.galeriaSelectedFile && !formValue.url && !this.editingGaleriaItem?.url) {
      alert('Debes subir una imagen o ingresar una URL.');
      return;
    }

    this.galeriaIsUploading = true;

    try {
      let url = formValue.url || this.editingGaleriaItem?.url || '';
      let storagePath = this.editingGaleriaItem?.storage_path;

      // Si seleccionó archivo, subirlo a Storage
      if (this.galeriaSelectedFile) {
        const uploadResult = await this.galeriaService.uploadImage(this.galeriaSelectedFile);
        if (!uploadResult) {
          alert('Error al subir la imagen. Verifica que el bucket de Supabase esté configurado.');
          return;
        }
        url = uploadResult.url;
        storagePath = uploadResult.storagePath;
      }

      const payload = {
        titulo: formValue.titulo,
        descripcion: formValue.descripcion || '',
        categoria: formValue.categoria as CategoriaGaleria,
        url,
        storage_path: storagePath,
        activo: formValue.activo
      };

      if (this.editingGaleriaItem) {
        await this.galeriaService.update(this.editingGaleriaItem.id, payload);
      } else {
        await this.galeriaService.create(payload);
      }

      await this.loadGaleria();
      this.closeGaleriaModal();
    } catch (error: any) {
      console.error('Error guardando item de galería:', error);
      alert('Error al guardar: ' + (error?.message || 'Error desconocido'));
    } finally {
      this.galeriaIsUploading = false;
    }
  }

  confirmDeleteGaleria(item: GaleriaItem): void {
    this.galeriaItemToDelete = item;
    this.deleteGaleriaConfirmText = '';
    this.showDeleteGaleriaModal = true;
  }

  cancelDeleteGaleria(): void {
    this.showDeleteGaleriaModal = false;
    this.galeriaItemToDelete = null;
    this.deleteGaleriaConfirmText = '';
  }

  async executeDeleteGaleria(): Promise<void> {
    if (!this.galeriaItemToDelete || this.deleteGaleriaConfirmText !== 'ELIMINAR') return;
    this.showDeleteGaleriaModal = false;
    this.isLoading = true;
    try {
      await this.galeriaService.delete(this.galeriaItemToDelete.id);
      await this.loadGaleria();
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      alert('Error al eliminar la imagen.');
    } finally {
      this.isLoading = false;
      this.galeriaItemToDelete = null;
    }
  }

  getCategoriaBadgeClass(categoria: string): string {
    switch (categoria) {
      case 'entrenamientos': return 'bg-primary';
      case 'jornada-waycombat': return 'bg-warning text-dark';
      case 'eventos': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getCategoriaLabel(categoria: string): string {
    switch (categoria) {
      case 'entrenamientos': return 'Entrenamiento';
      case 'jornada-waycombat': return 'Jornada WayCombat';
      case 'eventos': return 'Eventos';
      default: return categoria;
    }
  }

  // ====== CONFIGURACIÓN CTA ======

  async loadConfig(): Promise<void> {
    try {
      const items = await this.configService.getAll();
      for (const item of items) {
        if (item.clave === 'cta_certificacion_texto')    this.ctaTexto    = item.valor;
        if (item.clave === 'cta_certificacion_sublabel') this.ctaSublabel = item.valor;
        if (item.clave === 'cta_certificacion_activo')   this.ctaActivo   = item.valor === 'true';
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }

  async saveCta(): Promise<void> {
    this.ctaIsSaving = true;
    try {
      await this.configService.upsertMany([
        { clave: 'cta_certificacion_texto',    valor: this.ctaTexto,                activo: true },
        { clave: 'cta_certificacion_sublabel', valor: this.ctaSublabel,             activo: true },
        { clave: 'cta_certificacion_activo',   valor: String(this.ctaActivo),       activo: true }
      ]);
    } catch (error) {
      console.error('Error guardando CTA:', error);
      alert('Error al guardar la configuración.');
    } finally {
      this.ctaIsSaving = false;
    }
  }
}
