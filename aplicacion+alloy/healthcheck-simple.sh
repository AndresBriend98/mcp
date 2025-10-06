#!/bin/sh

# Healthcheck súper simple que devuelve 1 o 0

SERVICE_NAME="mi-servicio"
CHECK_INTERVAL=10  # segundos entre checks

echo "Iniciando healthcheck simple..."

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # ==========================================
    # AQUÍ DEFINES TU LÓGICA DE VERIFICACIÓN
    # ==========================================
    
    # Opción 1: Verificar un puerto (ejemplo: puerto 80)
     if nc -z localhost 3000 2>/dev/null; then
         STATUS=1  # Servicio OK
     else
         STATUS=0  # Servicio APAGADO
     fi
    
    # Opción 2: Verificar un archivo (descomenta si lo necesitas)
    # if [ -f /tmp/service_running ]; then
    #     STATUS=1
    # else
    #     STATUS=0
    # fi
    
    # Opción 3: Verificar una URL (descomenta si lo necesitas)
    #  if wget -q --spider --timeout=5 http://localhost:3000 2>/dev/null; then
    #      STATUS=1
    #  else
    #      STATUS=0
    #  fi
    
    # Opción 4: Verificar un proceso (descomenta si lo necesitas)
    # if pgrep -x "nginx" > /dev/null 2>&1; then
    #     STATUS=1
    # else
    #     STATUS=0
    # fi
    
    # ==========================================
    # ESCRIBIR RESULTADO A STDOUT
    # ==========================================
    
    if [ $STATUS -eq 1 ]; then
        echo "[$TIMESTAMP] healthcheck=$STATUS service=$SERVICE_NAME status=OK"
    else
        echo "[$TIMESTAMP] healthcheck=$STATUS service=$SERVICE_NAME status=ERROR"
    fi
    
    # Esperar antes del siguiente check
    sleep $CHECK_INTERVAL
done