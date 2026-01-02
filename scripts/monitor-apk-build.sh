#!/bin/bash

# Script pour monitorer le build APK Docker en temps réel
# Usage: ./scripts/monitor-apk-build.sh [CONTAINER_NAME]

CONTAINER_NAME=${1:-"zumik-apk-builder"}

echo "=========================================="
echo "📊 Monitoring APK Build Progress"
echo "=========================================="
echo ""
echo "Container: $CONTAINER_NAME"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Fonction pour afficher les stats du container
show_stats() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⏰ $(date '+%H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if container exists
    if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "❌ Container not found: $CONTAINER_NAME"
        echo ""
        echo "Available containers:"
        docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
        return 1
    fi

    # Container status
    STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null)
    echo "Status: $STATUS"

    if [ "$STATUS" != "running" ]; then
        echo "⚠️  Container is not running"
        echo ""
        echo "Last 50 lines of logs:"
        docker logs --tail 50 "$CONTAINER_NAME"
        return 1
    fi

    # CPU & Memory usage
    STATS=$(docker stats "$CONTAINER_NAME" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | tail -n 1)
    echo "Resources: $STATS"

    echo ""
    echo "Last build output:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Dernières lignes du build
    docker logs --tail 15 "$CONTAINER_NAME" 2>&1 | grep -v "^$"

    echo ""
}

# Boucle de monitoring
while true; do
    clear
    show_stats

    # Check if build is complete
    if docker logs "$CONTAINER_NAME" 2>&1 | grep -q "Build complete!"; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ BUILD COMPLETE!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        docker logs "$CONTAINER_NAME" 2>&1 | tail -20
        break
    fi

    # Check for errors
    if docker logs "$CONTAINER_NAME" 2>&1 | tail -50 | grep -qi "FAILURE\|error:"; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "❌ BUILD ERROR DETECTED"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        docker logs "$CONTAINER_NAME" 2>&1 | tail -50
        break
    fi

    sleep 5
done
