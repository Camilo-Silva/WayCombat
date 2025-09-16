# Script para gestionar WayCombat con Docker
Write-Host "🐳 WayCombat Docker Manager" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

function Show-Menu {
    Write-Host "`n1. 🚀 Iniciar aplicación"
    Write-Host "2. 🛑 Detener aplicación"
    Write-Host "3. 📊 Ver logs"
    Write-Host "4. 🔄 Rebuild y reiniciar"
    Write-Host "5. 📱 Abrir en navegador"
    Write-Host "6. ❌ Salir"
    Write-Host ""
}

do {
    Show-Menu
    $choice = Read-Host "Selecciona una opción (1-6)"
    
    switch ($choice) {
        "1" {
            Write-Host "🚀 Iniciando WayCombat..." -ForegroundColor Green
            docker-compose up -d
            Write-Host "✅ Aplicación disponible en http://localhost:8080" -ForegroundColor Green
        }
        "2" {
            Write-Host "🛑 Deteniendo WayCombat..." -ForegroundColor Yellow
            docker-compose down
            Write-Host "✅ Aplicación detenida" -ForegroundColor Green
        }
        "3" {
            Write-Host "📊 Mostrando logs (Ctrl+C para salir)..." -ForegroundColor Blue
            docker-compose logs -f
        }
        "4" {
            Write-Host "🔄 Rebuilding y reiniciando..." -ForegroundColor Blue
            docker-compose down
            docker-compose up --build -d
            Write-Host "✅ Aplicación rebuildeada y disponible en http://localhost:8080" -ForegroundColor Green
        }
        "5" {
            Write-Host "📱 Abriendo en navegador..." -ForegroundColor Blue
            Start-Process "http://localhost:8080"
        }
        "6" {
            Write-Host "👋 ¡Hasta luego!" -ForegroundColor Cyan
            break
        }
        default {
            Write-Host "❌ Opción inválida" -ForegroundColor Red
        }
    }
} while ($choice -ne "6")