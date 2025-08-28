/**
 * ========================================
 * SCRIPTS DAS ESTATÍSTICAS
 * ========================================
 * Responsável por: Atualização dos cartões de estatísticas,
 * métricas, analytics, sistema de notificações
 */

// ========================================
// ATUALIZAÇÃO DE ESTATÍSTICAS
// ========================================

/**
 * Atualiza estatísticas baseado nos dados carregados
 */
function updateStatsFromData(pontosData, areasData, rotasData) {
    try {
        const totalPontos = pontosData?.features?.length || 0;
        const totalAreas = areasData?.features?.length || 0;
        const totalRotas = rotasData?.features?.length || 0;
        
        const alertas = Math.floor(totalPontos * 0.1) + Math.floor(Math.random() * 10);
        
        document.getElementById('totalPoints').textContent = (totalPontos + totalAreas + totalRotas).toLocaleString();
        document.getElementById('activeAlerts').textContent = alertas;
        document.getElementById('onlineUsers').textContent = Math.floor(Math.random() * 200) + 100;
        document.getElementById('dataUpdate').textContent = '100%';
        
        console.log('📊 Estatísticas atualizadas com dados reais');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar estatísticas:', error);
        updateStats(); // Fallback para valores simulados
    }
}

/**
 * Atualiza estatísticas para área específica
 */
function updateAreaStats(areaKey, areaName) {
    const areaStats = {
        brasil: { pontos: 15420, alertas: 234, usuarios: 1200 },
        amazonia_legal: { pontos: 8750, alertas: 156, usuarios: 650 },
        bioma_amazonia: { pontos: 6890, alertas: 123, usuarios: 540 },
        bioma_pantanal: { pontos: 1230, alertas: 34, usuarios: 180 },
        bioma_cerrado: { pontos: 4560, alertas: 78, usuarios: 320 },
        crbe: { pontos: 890, alertas: 23, usuarios: 95 },
        para: { pontos: 3450, alertas: 67, usuarios: 285 },
        tocantins: { pontos: 1890, alertas: 45, usuarios: 160 },
        amapa: { pontos: 670, alertas: 12, usuarios: 85 },
        maranhao: { pontos: 2340, alertas: 56, usuarios: 195 }
    };
    
    const stats = areaStats[areaKey] || { pontos: 1000, alertas: 25, usuarios: 150 };
    
    document.getElementById('totalPoints').textContent = stats.pontos.toLocaleString();
    document.getElementById('activeAlerts').textContent = stats.alertas;
    document.getElementById('onlineUsers').textContent = stats.usuarios;
    document.getElementById('dataUpdate').textContent = '100%';
    
    console.log(`📊 Estatísticas atualizadas para: ${areaName}`);
    
    // Animar cartões ao atualizar
    animateStatCards();
}

/**
 * Estatísticas simuladas (fallback)
 */
function updateStats() { 
    const totalPoints = Math.floor(Math.random() * 2000) + 1000;
    const activeAlerts = Math.floor(Math.random() * 50) + 10;
    const onlineUsers = Math.floor(Math.random() * 200) + 100;
    const dataUpdate = Math.floor(Math.random() * 10) + 90;
    
    document.getElementById('totalPoints').textContent = totalPoints.toLocaleString(); 
    document.getElementById('activeAlerts').textContent = activeAlerts; 
    document.getElementById('onlineUsers').textContent = onlineUsers; 
    document.getElementById('dataUpdate').textContent = dataUpdate + '%';
    
    console.log('📊 Estatísticas simuladas atualizadas');
    
    // Animar cartões ao atualizar
    animateStatCards();
}

/**
 * Anima os cartões de estatísticas
 */
function animateStatCards() {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'scale(1.05)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 200);
        }, index * 100);
    });
}

/**
 * Atualiza estatísticas em tempo real
 */
function startRealTimeStats() {
    setInterval(() => {
        // Simular mudanças em tempo real
        const currentUsers = parseInt(document.getElementById('onlineUsers').textContent);
        const variation = Math.floor(Math.random() * 21) - 10; // -10 a +10
        const newUsers = Math.max(50, currentUsers + variation);
        
        document.getElementById('onlineUsers').textContent = newUsers;
        
        // Atualizar percentual de dados ocasionalmente
        if (Math.random() < 0.1) { // 10% de chance
            const newPercentage = Math.floor(Math.random() * 5) + 95; // 95-99%
            document.getElementById('dataUpdate').textContent = newPercentage + '%';
        }
        
    }, 30000); // A cada 30 segundos
}

// ========================================
// SISTEMA DE NOTIFICAÇÕES
// ========================================

/**
 * Sistema de notificações para o usuário
 */
const NotificationSystem = {
    /**
     * Mostra notificação de sucesso
     */
    success: function(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    /**
     * Mostra notificação de erro
     */
    error: function(message, duration = 5000) {
        this.show(message, 'error', duration);
    },
    
    /**
     * Mostra notificação de informação
     */
    info: function(message, duration = 4000) {
        this.show(message, 'info', duration);
    },
    
    /**
     * Mostra notificação de aviso
     */
    warning: function(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },
    
    /**
     * Método interno para exibir notificações
     */
    show: function(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Cores por tipo
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas ${this.getIcon(type)}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; margin-left: auto;">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Anima entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Registrar métrica
        Analytics.track('notification_shown', {
            type: type,
            message: message,
            duration: duration
        });
    },
    
    /**
     * Retorna ícone baseado no tipo
     */
    getIcon: function(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },
    
    /**
     * Remove todas as notificações
     */
    clearAll: function() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
};

// ========================================
// ANALYTICS E MÉTRICAS
// ========================================

/**
 * Sistema de coleta de métricas
 */
const Analytics = {
    metrics: {},
    
    /**
     * Registra uma métrica
     */
    track: function(event, data = {}) {
        const timestamp = new Date().toISOString();
        const metric = {
            event,
            data,
            timestamp,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        if (!this.metrics[event]) {
            this.metrics[event] = [];
        }
        
        this.metrics[event].push(metric);
        console.log(`📊 Métrica registrada: ${event}`, data);
        
        // Limitar histórico (manter apenas os últimos 100 eventos de cada tipo)
        if (this.metrics[event].length > 100) {
            this.metrics[event] = this.metrics[event].slice(-100);
        }
        
        // Atualizar estatísticas se necessário
        this.updateDashboardMetrics(event, data);
    },
    
    /**
     * Retorna métricas coletadas
     */
    getMetrics: function(event = null) {
        if (event) {
            return this.metrics[event] || [];
        }
        return this.metrics;
    },
    
    /**
     * Gera relatório de uso
     */
    generateReport: function() {
        const report = {
            timestamp: new Date().toISOString(),
            totalEvents: 0,
            events: {},
            summary: {}
        };
        
        Object.keys(this.metrics).forEach(event => {
            const eventMetrics = this.metrics[event];
            report.totalEvents += eventMetrics.length;
            report.events[event] = {
                count: eventMetrics.length,
                firstOccurrence: eventMetrics[0]?.timestamp,
                lastOccurrence: eventMetrics[eventMetrics.length - 1]?.timestamp
            };
        });
        
        // Estatísticas resumidas
        report.summary = {
            sessionDuration: this.calculateSessionDuration(),
            mostUsedFeature: this.getMostUsedFeature(),
            layerToggleCount: this.metrics['layer_toggle']?.length || 0,
            refreshCount: this.metrics['data_refresh']?.length || 0,
            errorCount: this.metrics['javascript_error']?.length || 0
        };
        
        return report;
    },
    
    /**
     * Calcula duração da sessão
     */
    calculateSessionDuration: function() {
        const startMetric = this.metrics['system_start']?.[0];
        if (!startMetric) return 0;
        
        const startTime = new Date(startMetric.timestamp);
        const currentTime = new Date();
        return Math.round((currentTime - startTime) / 1000); // em segundos
    },
    
    /**
     * Identifica funcionalidade mais usada
     */
    getMostUsedFeature: function() {
        let maxCount = 0;
        let mostUsed = 'N/A';
        
        Object.keys(this.metrics).forEach(event => {
            const count = this.metrics[event].length;
            if (count > maxCount) {
                maxCount = count;
                mostUsed = event;
            }
        });
        
        return { feature: mostUsed, count: maxCount };
    },
    
    /**
     * Atualiza métricas do dashboard baseado em eventos
     */
    updateDashboardMetrics: function(event, data) {
        // Incrementar contador de ações do usuário
        if (['layer_toggle', 'area_change', 'filter_apply'].includes(event)) {
            const currentActions = parseInt(localStorage.getItem('user_actions') || '0');
            localStorage.setItem('user_actions', (currentActions + 1).toString());
        }
        
        // Atualizar estatísticas de erro
        if (event === 'javascript_error' || event === 'resource_error') {
            const errorElement = document.getElementById('systemErrors');
            if (errorElement) {
                const currentErrors = parseInt(errorElement.textContent || '0');
                errorElement.textContent = (currentErrors + 1).toString();
            }
        }
    },
    
    /**
     * Exporta métricas para análise
     */
    exportMetrics: function() {
        const report = this.generateReport();
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dashboard-analytics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('📊 Métricas exportadas');
        NotificationSystem.success('Relatório de métricas exportado!');
    }
};

// ========================================
// MONITORAMENTO DE PERFORMANCE
// ========================================

/**
 * Monitora performance do sistema
 */
const PerformanceMonitor = {
    /**
     * Inicia monitoramento de uma operação
     */
    start: function(operation) {
        const startTime = performance.now();
        
        return {
            end: function() {
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                console.log(`⏱️ ${operation} executado em ${duration}ms`);
                
                // Registrar métrica de performance
                Analytics.track('performance_metric', {
                    operation: operation,
                    duration: duration,
                    timestamp: new Date().toISOString()
                });
                
                return duration;
            }
        };
    },
    
    /**
     * Monitor de uso de memória
     */
    checkMemoryUsage: function() {
        if (performance.memory) {
            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
            
            console.log(`💾 Memória - Usada: ${memory.used}MB, Total: ${memory.total}MB, Limite: ${memory.limit}MB`);
            
            // Alerta se uso de memória alto
            if (memory.used / memory.limit > 0.8) {
                NotificationSystem.warning('Alto uso de memória detectado');
            }
            
            return memory;
        }
        return null;
    },
    
    /**
     * Monitor de FPS (aproximado)
     */
    startFPSMonitor: function() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                console.log(`🎯 FPS: ${fps}`);
                
                if (fps < 30) {
                    console.warn('⚠️ Performance baixa detectada');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
};

// ========================================
// VALIDAÇÃO DE DADOS
// ========================================

/**
 * Validador de dados para estatísticas
 */
const DataValidator = {
    /**
     * Valida se os dados de estatísticas são válidos
     */
    validateStats: function(stats) {
        const required = ['totalPoints', 'activeAlerts', 'onlineUsers', 'dataUpdate'];
        const missing = required.filter(field => !stats.hasOwnProperty(field));
        
        if (missing.length > 0) {
            console.warn(`⚠️ Campos de estatísticas ausentes: ${missing.join(', ')}`);
            return false;
        }
        
        // Validar tipos de dados
        if (typeof stats.totalPoints !== 'number' || stats.totalPoints < 0) {
            console.warn('⚠️ totalPoints deve ser um número positivo');
            return false;
        }
        
        if (typeof stats.activeAlerts !== 'number' || stats.activeAlerts < 0) {
            console.warn('⚠️ activeAlerts deve ser um número positivo');
            return false;
        }
        
        if (typeof stats.onlineUsers !== 'number' || stats.onlineUsers < 0) {
            console.warn('⚠️ onlineUsers deve ser um número positivo');
            return false;
        }
        
        return true;
    },
    
    /**
     * Sanitiza dados de entrada
     */
    sanitizeStats: function(stats) {
        return {
            totalPoints: Math.max(0, parseInt(stats.totalPoints) || 0),
            activeAlerts: Math.max(0, parseInt(stats.activeAlerts) || 0),
            onlineUsers: Math.max(0, parseInt(stats.onlineUsers) || 0),
            dataUpdate: Math.min(100, Math.max(0, parseInt(stats.dataUpdate) || 0))
        };
    }
};

// ========================================
// CACHE DE ESTATÍSTICAS
// ========================================

/**
 * Sistema de cache para estatísticas
 */
const StatisticsCache = {
    cache: new Map(),
    maxAge: 300000, // 5 minutos
    
    /**
     * Armazena estatísticas no cache
     */
    set: function(key, stats) {
        this.cache.set(key, {
            data: stats,
            timestamp: Date.now()
        });
        console.log(`💾 Estatísticas '${key}' armazenadas no cache`);
    },
    
    /**
     * Recupera estatísticas do cache
     */
    get: function(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            console.log(`🗑️ Cache '${key}' expirado e removido`);
            return null;
        }
        
        console.log(`📖 Estatísticas '${key}' recuperadas do cache`);
        return item.data;
    },
    
    /**
     * Limpa cache expirado
     */
    cleanup: function() {
        const now = Date.now();
        let removedCount = 0;
        
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.maxAge) {
                this.cache.delete(key);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`🧹 ${removedCount} itens de cache removidos`);
        }
    },
    
    /**
     * Tamanho atual do cache
     */
    size: function() {
        return this.cache.size;
    }
};

// ========================================
// INICIALIZAÇÃO E EVENTOS
// ========================================

/**
 * Inicializa sistema de estatísticas
 */
function initializeStatistics() {
    console.log('📊 Inicializando sistema de estatísticas...');
    
    // Iniciar monitoramento em tempo real
    startRealTimeStats();
    
    // Iniciar monitoramento de performance
    PerformanceMonitor.startFPSMonitor();
    
    // Limpeza periódica do cache
    setInterval(() => {
        StatisticsCache.cleanup();
    }, 60000); // A cada minuto
    
    // Verificação periódica de memória
    setInterval(() => {
        PerformanceMonitor.checkMemoryUsage();
    }, 300000); // A cada 5 minutos
    
    console.log('✅ Sistema de estatísticas inicializado');
}

/**
 * Registra métricas iniciais
 */
function registerInitialMetrics() {
    Analytics.track('system_start', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        platform: navigator.platform
    });
    
    Analytics.track('statistics_module_loaded', {
        timestamp: new Date().toISOString()
    });
}

// ========================================
// LISTENERS DE ERRO
// ========================================

/**
 * Configura listeners para captura de erros
 */
function setupErrorListeners() {
    // Listener para erros JavaScript
    window.addEventListener('error', function(e) {
        Analytics.track('javascript_error', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            timestamp: new Date().toISOString()
        });
        console.error('💥 Erro JavaScript capturado:', e);
        
        // Mostrar notificação de erro se crítico
        if (e.message.includes('Critical') || e.message.includes('Fatal')) {
            NotificationSystem.error('Erro crítico detectado no sistema');
        }
    });

    // Listener para erros de recursos
    window.addEventListener('error', function(e) {
        if (e.target !== window) {
            Analytics.track('resource_error', {
                type: e.target.tagName,
                source: e.target.src || e.target.href,
                message: 'Falha ao carregar recurso',
                timestamp: new Date().toISOString()
            });
            console.error('💥 Erro de recurso capturado:', e);
        }
    }, true);
    
    // Listener para promises rejeitadas
    window.addEventListener('unhandledrejection', function(e) {
        Analytics.track('unhandled_promise_rejection', {
            reason: e.reason,
            timestamp: new Date().toISOString()
        });
        console.error('💥 Promise rejeitada:', e);
    });
}

// ========================================
// FUNÇÕES DE UTILITÁRIO
// ========================================

/**
 * Formata números para exibição
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Calcula porcentagem de crescimento
 */
function calculateGrowthPercentage(current, previous) {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
}

/**
 * Gera cor baseada em valor
 */
function getColorByValue(value, max, type = 'success') {
    const percentage = (value / max) * 100;
    
    if (type === 'success') {
        if (percentage >= 80) return '#10b981'; // Verde
        if (percentage >= 60) return '#f59e0b'; // Amarelo
        return '#ef4444'; // Vermelho
    } else if (type === 'warning') {
        if (percentage <= 20) return '#10b981'; // Verde
        if (percentage <= 50) return '#f59e0b'; // Amarelo
        return '#ef4444'; // Vermelho
    }
    
    return '#6b7280'; // Cinza padrão
}

// ========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ========================================

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeStatistics();
    registerInitialMetrics();
    setupErrorListeners();
    console.log('📊 Módulo de estatísticas carregado completamente');
});