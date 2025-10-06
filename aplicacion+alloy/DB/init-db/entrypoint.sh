#!/bin/bash
set -e

echo "=== Iniciando SQL Server ==="

# Iniciar SQL Server en background
/opt/mssql/bin/sqlservr &
SQL_PID=$!

echo "Esperando a que SQL Server esté disponible..."
sleep 15

# Esperar hasta que SQL Server acepte conexiones
for i in {1..60}; do
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${MSSQL_SA_PASSWORD}" -C -Q "SELECT 1" &> /dev/null; then
        echo "✅ SQL Server está listo!"
        break
    fi
    echo "Intento $i/60: Esperando..."
    sleep 2
done

# Verificar si hay script de inicialización
if [ -f /docker-entrypoint-initdb.d/init-db.sql ]; then
    echo "=== Ejecutando script de inicialización ==="
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${MSSQL_SA_PASSWORD}" -C -i /docker-entrypoint-initdb.d/init-db.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Base de datos inicializada correctamente"
    else
        echo "❌ Error al inicializar la base de datos"
    fi
else
    echo "⚠️  No se encontró script de inicialización"
fi

# Mantener SQL Server corriendo en foreground
wait $SQL_PID