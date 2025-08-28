/**
 * ========================================
 * SCRIPT DE INICIALIZAÇÃO PRINCIPAL
 * ========================================
 * Responsável por: Inicialização geral do sistema, coordenação entre módulos,
 * exposição de funções globais, configuração de event listeners principais
 */

// ========================================
// INICIALIZAÇÃO PRINCIPAL
// ========================================

/**
 * Função principal de inicialização do dashboard
 */
document.addEventListener('DOMContentLoaded', function() { 
    console.log('🚀 Iniciando Dashboard GeoAdmin...');
    
    // Registrar métricas iniciais
    registerSystemStart();
    
    // Inicializar módulos em sequência
    initializeMainSystems();
    
    console.log('✅ Dashboard inicializado com sucesso!');
}); 

/**
 * Inicializa os sistemas principais
 */
async function initializeMainSystems() {
    try {
        // 1. Inicializar mapa (principal)
        await initMap();
        
        // 2. Carregar dados iniciais
        loadInitialData();
        
        // 3. Configurar interface
        setupUserInterface();
        
        // 4. Ativar sistemas automáticos
        activateAutoRefreshByDefault();
        
        // 5. Configurar event listeners
        setupEventListeners();
        
        // 6. Atualizar última atualização
        updateLastRefreshTime();
        
        console.log('🎯 Todos os sistemas inicializados');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        handleInitializationError(error);
    }
}

/**
 * Configura a interface do usuário
 */
function setupUserInterface() {
    console.log('🎨 Configurando interface do usuário...');
    
    // Configurar tooltips (se necessário)
    setupTooltips();
    
    // Configurar responsividade
    handleResponsiveLayout();
    
    // Configurar animações
    setupAnimations();
    
    console.log('✅ Interface configurada');
}

/**
 * Configura todos os event listeners principais
 */
function setupEventListeners() {
    console.log('🎧 Configurando event listeners...');
    
    // Event listeners do mapa
    setupMapEventListeners();
    
    // Event listeners dos controles
    setupKeyboardShortcuts();
    
    // Event listeners da janela
    setupWindowEventListeners();
    
    console.log('✅ Event listeners configurados');
}

/**
 * Configura event listeners da janela
 */
function setupWindowEventListeners() {
    // Listener para mudança de tamanho da janela
    window.addEventListener('resize', function() {
        handleWindowResize();
    });
    
    // Listener para antes de sair da página
    window.addEventListener('beforeunload', function(e) {
        // Salvar estado atual se necessário
        saveCurrentState();
        
        // Limpar intervalos
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        if (autoRunInterval) clearInterval(autoRunInterval);
        
        // Registrar métrica de saída
        Analytics.track('system_exit', {
            timestamp: new Date().toISOString(),
            sessionDuration: Analytics.calculateSessionDuration()
        });
    });
    
    // Listener para visibilidade da página
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('📴 Página oculta - pausando atualizações');
            pauseAutoSystems();
        } else {
            console.log('👁️ Página visível - retomando atualizações');
            resumeAutoSystems();
        }
    });
}

/**
 * Trata redimensionamento da janela
 */
function handleWindowResize() {
    // Redimensionar mapa se necessário
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }
    
    // Atualizar layout responsivo
    handleResponsiveLayout();
    
    // Registrar métrica
    Analytics.track('window_resize', {
        newSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
    });
}

/**
 * Configura layout responsivo
 */
function handleResponsiveLayout() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    
    document.body.classList.toggle('mobile-layout', isMobile);
    document.body.classList.toggle('tablet-layout', isTablet);
    
    // Ajustar controles para mobile
    if (isMobile) {
        optimizeForMobile();
    }
}

/**
 * Otimiza interface para dispositivos móveis
 */
function optimizeForMobile() {
    // Reduzir tamanho dos controles
    const controlButtons = document.querySelectorAll('.control-button');
    controlButtons.forEach(button => {
        button.style.padding = '8px';
        button.style.fontSize = '11px';
    });
    
    // Ajustar estatísticas
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.style.padding = '8px';
    });
}

/**
 * Configura tooltips
 */
function setupTooltips() {
    const buttonsWithTooltips = [
        { selector: '[onclick*="mapa-light"]', text: 'Mapa Light (L)' },
        { selector: '[onclick*="mapa-dark"]', text: 'Mapa Dark (D)' },
        { selector: '[onclick*="refreshData"]', text: 'Atualizar Dados (Ctrl+R)' },
        { selector: '[onclick*="toggleAutoRefresh"]', text: 'Auto-Refresh' },
        { selector: '[onclick*="toggleAutoRun"]', text: 'Auto-Run (R)' }
    ];
    
    buttonsWithTooltips.forEach(item => {
        const element = document.querySelector(item.selector);
        if (element) {
            element.title = item.text;
        }
    });
}

/**
 * Configura animações
 */
function setupAnimations() {
    // Adicionar classe de animação aos cartões
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
    
    // Adicionar animação aos botões de controle
    const controlButtons = document.querySelectorAll('.control-button');
    controlButtons.forEach((button, index) => {
        button.style.animationDelay = `${index * 0.05}s`;
        button.classList.add('slide-in');
    });
}

// ========================================
// GERENCIAMENTO DE ESTADO
// ========================================

/**
 * Salva o estado atual do dashboard
 */
function saveCurrentState() {
    const state = {
        timestamp: new Date().toISOString(),
        mapCenter: map ? [map.getCenter().lat, map.getCenter().lng] : null,
        mapZoom: map ? map.getZoom() : null,
        activeBaseLayer: currentBaseLayer,
        selectedArea: document.getElementById('areaFilter').value,
        selectedPeriod: document.getElementById('periodFilter').value,
        activeLayers: getActiveLayers(),
        autoRefreshEnabled: isAutoRefresh,
        autoRunEnabled: isAutoRun
    };
    
    try {
        localStorage.setItem('dashboard_state', JSON.stringify(state));
        console.log('💾 Estado salvo');
    } catch (error) {
        console.warn('⚠️ Erro ao salvar estado:', error);
    }
}

/**
 * Restaura o estado salvo do dashboard
 */
function restoreState() {
    try {
        const savedState = localStorage.getItem('dashboard_state');
        if (!savedState) return;
        
        const state = JSON.parse(savedState);
        console.log('📖 Restaurando estado salvo...');
        
        // Restaurar seleções de filtros
        if (state.selectedArea) {
            document.getElementById('areaFilter').value = state.selectedArea;
        }
        
        if (state.selectedPeriod) {
            document.getElementById('periodFilter').value = state.selectedPeriod;
        }
        
        // Restaurar posição do mapa
        if (state.mapCenter && state.mapZoom && map) {
            map.setView(state.mapCenter, state.mapZoom);
        }
        
        console.log('✅ Estado restaurado');
        
    } catch (error) {
        console.warn('⚠️ Erro ao restaurar estado:', error);
    }
}

/**
 * Obtém layers atualmente ativos
 */
function getActiveLayers() {
    const activeLayers = [];
    
    Object.keys(layers).forEach(layerName => {
        if (map.hasLayer(layers[layerName])) {
            activeLayers.push(layerName);
        }
    });
    
    return activeLayers;
}

// ========================================
// CONTROLE DE SISTEMAS AUTOMÁTICOS
// ========================================

/**
 * Pausa sistemas automáticos quando página não está visível
 */
function pauseAutoSystems() {
    if (isAutoRefresh && autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        console.log('⏸️ Auto-refresh pausado');
    }
    
    if (isAutoRun && autoRunInterval) {
        clearInterval(autoRunInterval);
        console.log('⏸️ Auto-run pausado');
    }
}

/**
 * Retoma sistemas automáticos quando página volta a ser visível
 */
function resumeAutoSystems() {
    if (isAutoRefresh && !autoRefreshInterval) {
        autoRefreshInterval = setInterval(refreshData, 60000);
        console.log('▶️ Auto-refresh retomado');
    }
    
    if (isAutoRun && !autoRunInterval) {
        startAutoRun();
        console.log('▶️ Auto-run retomado');
    }
}

// ========================================
// TRATAMENTO DE ERROS
// ========================================

/**
 * Trata erros de inicialização
 */
function handleInitializationError(error) {
    console.error('💥 Erro crítico na inicialização:', error);
    
    // Mostrar erro na interface
    const errorDiv = document.createElement('div');
    errorDiv.className = 'critical-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Segoe UI', sans-serif;
    `;
    
    errorDiv.innerHTML = `
        <div style="text-align: center; max-width: 500px; padding: 40px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ef4444; margin-bottom: 20px;"></i>
            <h1 style="color: #ef4444; margin-bottom: 20px;">Erro de Inicialização</h1>
            <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
                Ocorreu um erro crítico ao inicializar o dashboard. 
                Alguns recursos podem não funcionar corretamente.
            </p>
            <p style="margin-bottom: 30px; font-size: 14px; opacity: 0.8;">
                <strong>Erro:</strong> ${error.message}
            </p>
            <button onclick="location.reload()" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                margin-right: 10px;
            ">
                Recarregar Página
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
            ">
                Continuar Mesmo Assim
            </button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Registrar erro crítico
    Analytics.track('critical_initialization_error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    
    // Tentar fallback básico
    setTimeout(() => {
        initBasicFallback();
    }, 5000);
}

/**
 * Inicialização básica em caso de erro
 */
function initBasicFallback() {
    console.log('🔧 Tentando inicialização básica...');
    
    try {
        // Mapa básico sem dados
        if (!map) {
            map = L.map('map').setView([-1.4558, -48.4902], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        }
        
        // Estatísticas básicas
        updateStats();
        
        console.log('✅ Inicialização básica bem-sucedida');
        NotificationSystem.warning('Dashboard iniciado em modo de segurança');
        
    } catch (fallbackError) {
        console.error('💥 Falha na inicialização básica:', fallbackError);
    }
}

// ========================================
// REGISTRO DE MÉTRICAS INICIAIS
// ========================================

/**
 * Registra métricas de início do sistema
 */
function registerSystemStart() {
    const systemInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
        memoryInfo: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null
    };
    
    Analytics.track('system_start', systemInfo);
    console.log('📊 Métricas do sistema registradas');
}

// ========================================
// UTILITÁRIOS GERAIS
// ========================================

/**
 * Utilitário para debounce de funções
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utilitário para throttle de funções
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Detecta tipo de dispositivo
 */
function detectDevice() {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        return 'mobile';
    }
    return 'desktop';
}

/**
 * Verifica se o browser suporta recursos necessários
 */
function checkBrowserSupport() {
    const features = {
        localStorage: typeof Storage !== 'undefined',
        webGL: !!window.WebGLRenderingContext,
        geolocation: 'geolocation' in navigator,
        canvas: !!document.createElement('canvas').getContext,
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined'
    };
    
    const unsupported = Object.keys(features).filter(feature => !features[feature]);
    
    if (unsupported.length > 0) {
        console.warn('⚠️ Recursos não suportados:', unsupported);
        NotificationSystem.warning(`Alguns recursos podem não funcionar: ${unsupported.join(', ')}`);
    }
    
    return features;
}

// ========================================
// EXPOSIÇÃO DE FUNÇÕES GLOBAIS
// ========================================

/**
 * Expõe funções para uso global nos elementos HTML
 */
window.toggleLayer = toggleLayer;
window.changeMonitoredArea = changeMonitoredArea;
window.applyFilters = applyFilters;
window.refreshData = refreshData;
window.toggleAutoRefresh = toggleAutoRefresh;
window.toggleAutoRun = toggleAutoRun;
window.exportData = exportData;
window.switchBaseLayer = switchBaseLayer;

// Expor utilitários
window.DashboardUtils = {
    debounce,
    throttle,
    detectDevice,
    checkBrowserSupport,
    saveCurrentState,
    restoreState
};

// Expor sistemas para debug
window.DashboardDebug = {
    Analytics,
    NotificationSystem,
    PerformanceMonitor,
    StatisticsCache,
    layers,
    map
};

// ========================================
// CONFIGURAÇÕES DE DESENVOLVIMENTO
// ========================================

/**
 * Configurações específicas para desenvolvimento
 */
function setupDevelopmentMode() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Modo de desenvolvimento ativado');
        
        // Ativar logs detalhados
        window.DEBUG_MODE = true;
        
        // Adicionar botão de debug
        const debugButton = document.createElement('button');
        debugButton.innerHTML = '🐛 Debug';
        debugButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        `;
        debugButton.onclick = () => {
            console.log('🐛 Estado do Dashboard:', {
                map: map,
                layers: layers,
                analytics: Analytics.generateReport(),
                performance: PerformanceMonitor.checkMemoryUsage(),
                cache: StatisticsCache.size()
            });
        };
        document.body.appendChild(debugButton);
        
        // Atalho para analytics
        window.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                Analytics.exportMetrics();
            }
        });
    }
}

// ========================================
// FINALIZAÇÃO
// ========================================

/**
 * Configurações finais após inicialização completa
 */
function finalizeDashboard() {
    console.log('🎯 Finalizando configuração do dashboard...');
    
    // Verificar suporte do browser
    checkBrowserSupport();
    
    // Detectar dispositivo
    const deviceType = detectDevice();
    console.log(`📱 Dispositivo detectado: ${deviceType}`);
    
    // Configurar modo de desenvolvimento se aplicável
    setupDevelopmentMode();
    
    // Restaurar estado anterior se existir
    restoreState();
    
    // Registrar métrica de inicialização completa
    Analytics.track('dashboard_ready', {
        timestamp: new Date().toISOString(),
        device: deviceType,
        loadTime: performance.now()
    });
    
    // Mostrar notificação de sucesso
    setTimeout(() => {
        NotificationSystem.success('Dashboard carregado e pronto para uso!');
    }, 1000);
    
    console.log('🎉 Dashboard GeoAdmin totalmente carregado!');
}

// ========================================
// AUTO-EXECUÇÃO
// ========================================

// Executar finalização após carregamento completo
window.addEventListener('load', function() {
    setTimeout(finalizeDashboard, 500);
});

// Configurar salvamento automático do estado
setInterval(saveCurrentState, 300000); // A cada 5 minutos

// Aplicar debounce no redimensionamento da janela
window.addEventListener('resize', debounce(handleWindowResize, 250));

console.log('🎯 main.js carregado - Sistema pronto para inicialização');

// ========================================
// EXPORTAÇÕES PARA MÓDULOS (se necessário)
// ========================================

/*
// Descomente se estiver usando módulos ES6
export {
    initializeMainSystems,
    setupEventListeners,
    saveCurrentState,
    restoreState,
    debounce,
    throttle,
    detectDevice,
    checkBrowserSupport
};
*/