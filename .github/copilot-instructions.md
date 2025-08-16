# WayCombat - GitHub Copilot Instructions

## Descripción del Proyecto

WayCombat es una aplicación full-stack para una academia de artes marciales que ofrece:

- Gestión de capacitaciones y entrenamientos
- Sistema de autenticación con roles (Usuario/Admin)
- Galería multimedia con categorización
- Acceso a contenido exclusivo para instructores
- Gestión de perfiles de usuario

## Arquitectura del Sistema

### Frontend (Angular 17)

- **Framework**: Angular 17 con arquitectura standalone components
- **Estilo**: Bootstrap 5 + FontAwesome para UI/UX
- **Puerto de desarrollo**: 4200-4204 (configurado en CORS del backend)
- **Ubicación**: `Frontend/waycombat-frontend/`

### Backend (ASP.NET Core)

- **Framework**: ASP.NET Core Web API
- **Base de datos**: Entity Framework Core 9.0.8 + SQLite
- **Autenticación**: JWT con BCrypt para hashing de contraseñas
- **Puerto**: 5165
- **Ubicación**: `Backend/WayCombat.Api/`

### Base de Datos

- **Motor**: SQLite (`waycombat_dev.db`)
- **ORM**: Entity Framework Core con Code First Migrations
- **Usuario admin por defecto**: admin@waycombat.com / admin123

## Convenciones de Código

### Angular Frontend

#### Estructura de Componentes

```
src/app/
├── components/
│   ├── home/
│   ├── galeria/
│   ├── capacitaciones/
│   ├── mi-cuenta/
│   ├── mixs/
│   ├── mix-detalle/
│   ├── acceso-instructores/
│   ├── contacto/
│   └── shared/
│       ├── header/
│       └── footer/
├── services/
├── models/
├── guards/
└── app.routes.ts
```

#### Naming Conventions

- **Componentes**: PascalCase (ej: `GaleriaComponent`)
- **Archivos**: kebab-case (ej: `galeria.component.ts`)
- **Variables**: camelCase en inglés (NUNCA usar caracteres especiales como ñ, tildes)
- **Interfaces**: PascalCase con sufijo (ej: `LoginRequest`, `AuthResponse`)

#### Patrón de Servicios

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5165/api';
  // Usar BehaviorSubject para estado reactivo
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
}
```

#### Standalone Components Pattern

```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.css']
})
```

#### Guards y Navegación

- Usar functional guards: `CanActivateFn`
- Guards disponibles: `authGuard`, `adminGuard`
- Redirección automática a `/acceso-instructores` para usuarios no autenticados

### Backend ASP.NET Core

#### Estructura del Proyecto

```
WayCombat.Api/
├── Controllers/
├── Services/
├── Models/
├── DTOs/
├── Data/
├── Migrations/
└── Program.cs
```

#### Naming Conventions

- **Controladores**: PascalCase + Controller (ej: `AuthController`)
- **Servicios**: Interface con I + PascalCase (ej: `IUsuarioService`)
- **Modelos**: PascalCase (ej: `Usuario`)
- **DTOs**: PascalCase + Dto (ej: `RegisterDto`)

#### Patrón de Controladores

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;
    private readonly ITokenService _tokenService;

    // Constructor injection pattern
    public AuthController(IUsuarioService usuarioService, ITokenService tokenService)
    {
        _usuarioService = usuarioService;
        _tokenService = tokenService;
    }
}
```

#### Configuración de Servicios (Program.cs)

```csharp
// Entity Framework
builder.Services.AddDbContext<WayCombatDbContext>(options =>
    options.UseSqlite(connectionString));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* JWT config */ });

// CORS para desarrollo
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:4201", /* ... */)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

## Patrones Específicos del Proyecto

### Autenticación JWT

- Token generado en backend con roles incluidos
- Almacenamiento en localStorage (frontend)
- Verificación automática en AuthService
- Guards para protección de rutas

### Gestión de Estado

- Servicios Angular con BehaviorSubject para estado reactivo
- Ejemplo: `AuthService.currentUser$` para estado de usuario

### Manejo de Errores

- Try-catch en controladores con respuestas HTTP apropiadas
- Validación de modelos con Data Annotations
- Manejo de errores en frontend con observables

### Responsividad

- Bootstrap grid system: `col-lg-4 col-md-4 col-sm-6`
- Componentes adaptables a múltiples dispositivos
- Mobile-first approach

## Reglas para Desarrollo

### ⚠️ IMPORTANTES - NUNCA HACER

1. **Caracteres especiales en código**: NO usar ñ, tildes, o caracteres especiales en nombres de variables, métodos, o propiedades
2. **Duplicar archivos**: NO crear archivos `*_new.*` o `*_fixed.*` - modificar los originales
3. **Hardcoded secrets**: NO incluir tokens, contraseñas, o secretos en el código
4. **Seed data duplicado**: NO agregar múltiples entradas del mismo usuario en `WayCombatDbContext`

### ✅ SIEMPRE HACER

1. **Migraciones EF**: Crear migración después de cambios en modelos: `dotnet ef migrations add NombreMigracion`
2. **Naming en inglés**: Usar nombres de variables/métodos en inglés para evitar problemas de compilación
3. **Validación de entrada**: Usar Data Annotations en DTOs y validación en frontend
4. **CORS**: Verificar que nuevos puertos estén incluidos en configuración CORS
5. **Standalone components**: Todos los componentes nuevos deben ser standalone
6. **Reactive forms**: Usar ReactiveFormsModule para formularios complejos
7. Cuando ejecutes el backend siempre usa este comando: cd "d:\9.Proyectos\WayCombat\Backend\WayCombat.Api" ; dotnet run

## Flujos de Trabajo Comunes

### Agregar Nueva Funcionalidad

1. Crear/modificar modelo en backend si es necesario
2. Crear migración EF si hay cambios en BD
3. Implementar servicio/controlador en backend
4. Crear/actualizar modelo TypeScript en frontend
5. Implementar servicio Angular
6. Crear/actualizar componente
7. Actualizar rutas si es necesario
8. Agregar guards de protección si es privado

### Debugging y Testing

- Backend: `dotnet run` en puerto 5165
- Frontend: `ng serve` en puerto 4200
- Usuario admin: admin@waycombat.com / admin123
- Verificar CORS si hay problemas de comunicación

### Base de Datos

- Archivo SQLite: `waycombat_dev.db` en directorio Backend
- Aplicar migraciones: `dotnet ef database update`
- Ver migraciones: carpeta `Migrations/`

## Consideraciones de Seguridad

- Contraseñas hasheadas con BCrypt
- JWT con expiración configurada
- Validación de entrada en todas las capas
- HTTPS en producción (configurar en Program.cs)
- Roles de usuario para autorización

## Testing y Desarrollo

### Comandos Útiles

```bash
# Backend
cd Backend/WayCombat.Api
dotnet run
dotnet ef migrations add NombreMigracion
dotnet ef database update

# Frontend
cd Frontend/waycombat-frontend
npm install
ng serve
ng build
```

### Puertos de Desarrollo

- Backend API: http://localhost:5165
- Frontend Angular: http://localhost:4200-4204
- Configuración CORS incluye todos los puertos

Esta documentación debe ser el punto de referencia para mantener la consistencia del código y los patrones arquitectónicos del proyecto WayCombat.
