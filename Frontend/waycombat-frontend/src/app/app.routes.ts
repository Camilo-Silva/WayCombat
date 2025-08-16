import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CapacitacionesComponent } from './components/capacitaciones/capacitaciones.component';
import { GaleriaComponent } from './components/galeria/galeria.component';
import { AccesoInstructoresComponent } from './components/acceso-instructores/acceso-instructores.component';
import { MixsComponent } from './components/mixs/mixs.component';
import { MixDetalleComponent } from './components/mix-detalle/mix-detalle.component';
import { MiCuentaComponent } from './components/mi-cuenta/mi-cuenta.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'capacitaciones', component: CapacitacionesComponent },
  { path: 'galeria', component: GaleriaComponent },
  { path: 'acceso-instructores', component: AccesoInstructoresComponent },
  { path: 'contacto', component: ContactoComponent },
  { 
    path: 'mixs', 
    component: MixsComponent 
    // canActivate: [authGuard] // Temporalmente comentado para pruebas
  },
  { 
    path: 'mixs/:id', 
    component: MixDetalleComponent 
    // canActivate: [authGuard] // Temporalmente comentado para pruebas
  },
  { 
    path: 'mi-cuenta', 
    component: MiCuentaComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [authGuard, adminGuard] 
  },
  { path: '**', redirectTo: '' } // Ruta comodín para páginas no encontradas
];
