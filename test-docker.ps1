# Script para probar Docker localmente en Windows
Write-Host "🐳 Construyendo imagen Docker..." -ForegroundColor Blue
docker build -t waycombat-api .

Write-Host "🚀 Iniciando contenedor..." -ForegroundColor Green
docker run -d `
  --name waycombat-container `
  -p 8080:8080 `
  -v "${PWD}/Backend/WayCombat.Api/waycombat_dev.db:/app/data/waycombat_dev.db" `
  -e ASPNETCORE_ENVIRONMENT=Development `
  -e DATABASE_PATH=/app/data/waycombat_dev.db `
  waycombat-api

Write-Host "✅ Aplicación disponible en http://localhost:8080" -ForegroundColor Green
Write-Host "📋 Ver logs: docker logs waycombat-container" -ForegroundColor Yellow
Write-Host "🛑 Detener: docker stop waycombat-container; docker rm waycombat-container" -ForegroundColor Red