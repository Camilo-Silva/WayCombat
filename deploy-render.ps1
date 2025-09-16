# 🚀 WayCombat - Deployment en Render
# Script para facilitar el despliegue en Render

Write-Host "=== WayCombat Deployment Script para Render ===" -ForegroundColor Green

# 1. Verificar que estamos en la rama correcta
Write-Host "`n1. Verificando rama actual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Rama actual: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "produccion") {
    Write-Host "ADVERTENCIA: No estás en la rama 'produccion'" -ForegroundColor Red
    $switch = Read-Host "¿Cambiar a rama produccion? (y/n)"
    if ($switch -eq "y") {
        git checkout produccion
        Write-Host "Cambiado a rama produccion" -ForegroundColor Green
    }
}

# 2. Actualizar rama con últimos cambios
Write-Host "`n2. Actualizando rama..." -ForegroundColor Yellow
git pull origin produccion

# 3. Verificar archivos necesarios para Render
Write-Host "`n3. Verificando archivos de configuración..." -ForegroundColor Yellow

$requiredFiles = @(
    "Dockerfile",
    "render.yaml", 
    "Backend/WayCombat.Api/appsettings.Production.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ FALTA: $file" -ForegroundColor Red
    }
}

# 4. Test build Docker local (opcional)
Write-Host "`n4. ¿Hacer test build local antes del deploy?" -ForegroundColor Yellow
$testBuild = Read-Host "(y/n)"
if ($testBuild -eq "y") {
    Write-Host "Construyendo imagen Docker..." -ForegroundColor Cyan
    docker build -t waycombat-test -f Dockerfile Backend/WayCombat.Api/
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build exitoso" -ForegroundColor Green
    } else {
        Write-Host "❌ Error en build" -ForegroundColor Red
        exit 1
    }
}

# 5. Mostrar URLs importantes
Write-Host "`n=== INFORMACIÓN PARA RENDER ===" -ForegroundColor Magenta
Write-Host "Repositorio: https://github.com/Camilo-Silva/WayCombat.git" -ForegroundColor Cyan
Write-Host "Rama: produccion" -ForegroundColor Cyan
Write-Host "Dockerfile: ./Dockerfile" -ForegroundColor Cyan
Write-Host "Docker Context: ./Backend/WayCombat.Api" -ForegroundColor Cyan
Write-Host "Health Check: /health" -ForegroundColor Cyan
Write-Host "Puerto: 8080" -ForegroundColor Cyan

Write-Host "`n=== VARIABLES DE ENTORNO PARA RENDER ===" -ForegroundColor Magenta
Write-Host "ASPNETCORE_ENVIRONMENT=Production" -ForegroundColor Cyan
Write-Host "PORT=8080" -ForegroundColor Cyan
Write-Host "DATABASE_PATH=/app/data/waycombat_dev.db" -ForegroundColor Cyan

Write-Host "`n=== PASOS EN RENDER ===" -ForegroundColor Magenta
Write-Host "1. Crear Web Service en Render" -ForegroundColor White
Write-Host "2. Conectar con GitHub (repositorio WayCombat)" -ForegroundColor White
Write-Host "3. Seleccionar rama 'produccion'" -ForegroundColor White
Write-Host "4. Runtime: Docker" -ForegroundColor White
Write-Host "5. Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "6. Docker Context: ./Backend/WayCombat.Api" -ForegroundColor White
Write-Host "7. Agregar variables de entorno" -ForegroundColor White
Write-Host "8. Configurar disco persistente (1GB) en /app/data" -ForegroundColor White
Write-Host "9. Deploy!" -ForegroundColor White

Write-Host ""
Write-Host "=== TODO LISTO PARA RENDER ===" -ForegroundColor Green
Write-Host "Dirigete a: https://dashboard.render.com" -ForegroundColor Cyan