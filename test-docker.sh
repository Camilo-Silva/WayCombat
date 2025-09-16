#!/bin/bash

# Script para probar Docker localmente
echo "🐳 Construyendo imagen Docker..."
docker build -t waycombat-api .

echo "🚀 Iniciando contenedor..."
docker run -d \
  --name waycombat-container \
  -p 8080:8080 \
  -v "$(pwd)/Backend/WayCombat.Api/waycombat_dev.db:/app/data/waycombat_dev.db" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e DATABASE_PATH=/app/data/waycombat_dev.db \
  waycombat-api

echo "✅ Aplicación disponible en http://localhost:8080"
echo "📋 Ver logs: docker logs waycombat-container"
echo "🛑 Detener: docker stop waycombat-container && docker rm waycombat-container"