# Usar la imagen base oficial de .NET 9.0 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Usar la imagen SDK para compilar la aplicación
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copiar el archivo del proyecto y restaurar dependencias
# Como el contexto Docker está en Backend/WayCombat.Api, las rutas son relativas a esa carpeta
COPY ["WayCombat.Api.csproj", "./"]
RUN dotnet restore "WayCombat.Api.csproj"

# Copiar todo el código fuente
COPY . .

# Compilar la aplicación
RUN dotnet build "WayCombat.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publicar la aplicación
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "WayCombat.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Crear la imagen final
FROM base AS final
WORKDIR /app

# Copiar la aplicación publicada
COPY --from=publish /app/publish .

# Crear directorio para la base de datos SQLite
RUN mkdir -p /app/data

# Configurar variables de entorno
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENV DATABASE_PATH=/app/data/waycombat_dev.db

# Comando de inicio
ENTRYPOINT ["dotnet", "WayCombat.Api.dll"]