/**
 * Family Website Main JavaScript
 * Ultra-lightweight bundle for enhanced user experience
 * Target: ≤ 15KB gzipped total
 */

// Performance and timing utilities
const perfMark = (name) => {
    if ('performance' in window && 'mark' in performance) {
        performance.mark(name);
    }
};

const perfMeasure = (name, start, end) => {
    if ('performance' in window && 'measure' in performance) {
        performance.measure(name, start, end);
    }
};

perfMark('js-start');

// Main application class
class FamilyWebsite {
    constructor() {
        this.observers = new Map();
        this.isTouch = 'ontouchstart' in window;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }
    
    setupApp() {
        perfMark('app-setup-start');
        
        // Core features
        this.setupIntersectionObserver();
        this.setupSmoothScrolling();
        this.setupLazyLoading();
        this.setupRevealAnimations();
        this.setupTouchOptimizations();
        this.setupAccessibilityEnhancements();
        this.setupPerformanceOptimizations();
        
        perfMark('app-setup-end');
        perfMeasure('app-setup', 'app-setup-start', 'app-setup-end');
        
        // Mark app as ready
        document.documentElement.classList.add('js-ready');
        
        // Performance logging (development only)
        if (process?.env?.NODE_ENV === 'development') {
            this.logPerformanceMetrics();
        }
    }
    
    // Intersection Observer for lazy loading and animations
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.fallbackVisibilityHandling();
            return;
        }
        
        // Lazy loading observer
        const lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                    lazyLoadObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });
        
        // Animation reveal observer
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.prefersReducedMotion) {
                    entry.target.classList.add('animate-fade-in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        });
        
        this.observers.set('lazyLoad', lazyLoadObserver);
        this.observers.set('reveal', revealObserver);
        
        // Observe elements
        this.observeLazyElements();
        this.observeRevealElements();
    }
    
    observeLazyElements() {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        const lazyElements = document.querySelectorAll('[data-lazy]');
        
        [...lazyImages, ...lazyElements].forEach(element => {
            this.observers.get('lazyLoad')?.observe(element);
        });
    }
    
    observeRevealElements() {
        const revealElements = document.querySelectorAll('.card, .section > .container > *');
        
        revealElements.forEach((element, index) => {
            // Stagger animation delays
            element.style.setProperty('--animation-delay', `${index * 100}ms`);
            this.observers.get('reveal')?.observe(element);
        });
    }
    
    loadLazyElement(element) {
        if (element.tagName === 'IMG') {
            this.loadLazyImage(element);
        } else if (element.dataset.lazy) {
            this.loadLazyContent(element);
        }
    }
    
    loadLazyImage(img) {
        // Handle responsive images
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
        }
        if (img.dataset.src) {
            img.src = img.dataset.src;
        }
        
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        }, { once: true });
        
        img.addEventListener('error', () => {
            img.classList.add('error');
            console.warn('Failed to load image:', img.src);
        }, { once: true });
    }
    
    loadLazyContent(element) {
        const contentType = element.dataset.lazy;
        
        switch (contentType) {
            case 'iframe':
                this.loadLazyIframe(element);
                break;
            case 'background':
                this.loadLazyBackground(element);
                break;
            default:
                element.classList.add('loaded');
        }
    }
    
    loadLazyIframe(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.addEventListener('load', () => {
                element.classList.add('loaded');
            }, { once: true });
        }
    }
    
    loadLazyBackground(element) {
        if (element.dataset.bg) {
            element.style.backgroundImage = `url(${element.dataset.bg})`;
            element.classList.add('loaded');
        }
    }
    
    // Smooth scrolling for anchor links
    setupSmoothScrolling() {
        // CSS scroll-behavior is preferred, but this provides fallback
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (!target) return;
            
            e.preventDefault();
            
            // Use native smooth scrolling if available
            if ('scrollBehavior' in document.documentElement.style) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                // Fallback smooth scroll
                this.smoothScrollTo(target.offsetTop);
            }
            
            // Update URL without triggering scroll
            if (history.pushState) {
                history.pushState(null, null, href);
            }
        });
    }
    
    smoothScrollTo(targetY) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const duration = Math.min(Math.abs(distance) / 2, 800);
        let startTime = null;
        
        const easeInOutQuart = (t) => {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        };
        
        const step = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const ease = easeInOutQuart(progress);
            
            window.scrollTo(0, startY + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }
    
    // Enhanced lazy loading
    setupLazyLoading() {
        // Preload critical images
        this.preloadCriticalImages();
        
        // Set up lazy loading for non-critical content
        this.setupContentLazyLoading();
    }
    
    preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('[data-preload]');
        
        criticalImages.forEach(img => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = img.dataset.preload;
            document.head.appendChild(preloadLink);
        });
    }
    
    setupContentLazyLoading() {
        // Lazy load non-critical stylesheets
        const lazyStylesheets = document.querySelectorAll('link[data-lazy-css]');
        
        lazyStylesheets.forEach(link => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        link.rel = 'stylesheet';
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            const trigger = document.querySelector(link.dataset.lazyCss) || document.body;
            observer.observe(trigger);
        });
    }
    
    // Reveal animations
    setupRevealAnimations() {
        if (this.prefersReducedMotion) {
            // Respect user preference for reduced motion
            document.documentElement.classList.add('reduce-motion');
            return;
        }
        
        // CSS-based animations are preferred, this adds progressive enhancement
        const animatedElements = document.querySelectorAll('[data-animate]');
        
        animatedElements.forEach(element => {
            const animationType = element.dataset.animate;
            element.classList.add('will-animate', `animate-${animationType}`);
        });
    }
    
    // Touch and mobile optimizations
    setupTouchOptimizations() {
        if (!this.isTouch) return;
        
        document.documentElement.classList.add('touch-device');
        
        // iOS-specific optimizations
        if (this.isIOS) {
            document.documentElement.classList.add('ios-device');
            this.setupIOSOptimizations();
        }
        
        // Improve touch responsiveness
        this.setupTouchEventOptimizations();
    }
    
    setupIOSOptimizations() {
        // Fix iOS viewport height issues
        const setViewportHeight = () => {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 200);
        });
        
        // Improve momentum scrolling
        document.body.style.webkitOverflowScrolling = 'touch';
    }
    
    setupTouchEventOptimizations() {
        // Add touch-friendly hover states
        document.addEventListener('touchstart', (e) => {
            const touchTarget = e.target.closest('[data-touch-hover]');
            if (touchTarget) {
                touchTarget.classList.add('touch-hover');
            }
        });
        
        document.addEventListener('touchend', () => {
            document.querySelectorAll('.touch-hover').forEach(el => {
                el.classList.remove('touch-hover');
            });
        });
        
        // Prevent zoom on double-tap for iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // Accessibility enhancements
    setupAccessibilityEnhancements() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderOptimizations();
    }
    
    setupKeyboardNavigation() {
        // Enhanced keyboard navigation for interactive elements
        document.addEventListener('keydown', (e) => {
            // Skip links functionality
            if (e.key === 'Tab' && e.target.classList.contains('skip-link')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.focus();
                }
            }
            
            // Close modals/overlays with Escape
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active, .lightbox.active');
                if (activeModal) {
                    const closeButton = activeModal.querySelector('[data-close]');
                    if (closeButton) {
                        closeButton.click();
                    }
                }
            }
        });
    }
    
    setupFocusManagement() {
        // Improve focus visibility
        let isUsingKeyboard = false;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isUsingKeyboard = true;
                document.documentElement.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            isUsingKeyboard = false;
            document.documentElement.classList.remove('keyboard-navigation');
        });
        
        // Focus trap for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const activeModal = document.querySelector('.modal.active, .lightbox.active');
                if (activeModal) {
                    this.trapFocus(e, activeModal);
                }
            }
        });
    }
    
    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    }
    
    setupScreenReaderOptimizations() {
        // Announce dynamic content changes
        this.createLiveRegion();
        
        // Improve carousel/gallery announcements
        const galleries = document.querySelectorAll('[role="region"][aria-label*="gallery"]');
        galleries.forEach(gallery => {
            this.setupGalleryAnnouncements(gallery);
        });
    }
    
    createLiveRegion() {
        if (document.getElementById('live-region')) return;
        
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }
    
    announce(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }
    
    setupGalleryAnnouncements(gallery) {
        const images = gallery.querySelectorAll('img');
        images.forEach((img, index) => {
            img.addEventListener('focus', () => {
                this.announce(`Image ${index + 1} of ${images.length}: ${img.alt}`);
            });
        });
    }
    
    // Performance optimizations
    setupPerformanceOptimizations() {
        // Defer non-critical operations
        this.deferNonCriticalOperations();
        
        // Optimize reflows and repaints
        this.optimizeRenderingPerformance();
        
        // Memory management
        this.setupMemoryManagement();
    }
    
    deferNonCriticalOperations() {
        // Use requestIdleCallback for non-critical work
        const runWhenIdle = (callback) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(callback);
            } else {
                setTimeout(callback, 1);
            }
        };
        
        runWhenIdle(() => {
            // Non-critical initialization
            this.setupAnalytics();
            this.setupServiceWorker();
        });
    }
    
    optimizeRenderingPerformance() {
        // Batch DOM reads and writes
        let rafId = null;
        const scheduledReads = [];
        const scheduledWrites = [];
        
        this.scheduleRead = (fn) => {
            scheduledReads.push(fn);
            this.scheduleUpdate();
        };
        
        this.scheduleWrite = (fn) => {
            scheduledWrites.push(fn);
            this.scheduleUpdate();
        };
        
        this.scheduleUpdate = () => {
            if (rafId) return;
            
            rafId = requestAnimationFrame(() => {
                // Batch all reads first
                scheduledReads.forEach(fn => fn());
                scheduledReads.length = 0;
                
                // Then batch all writes
                scheduledWrites.forEach(fn => fn());
                scheduledWrites.length = 0;
                
                rafId = null;
            });
        };
    }
    
    setupMemoryManagement() {
        // Clean up observers on page unload
        window.addEventListener('beforeunload', () => {
            this.observers.forEach(observer => observer.disconnect());
            this.observers.clear();
        });
        
        // Remove event listeners for components that are no longer visible
        const cleanupMutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.cleanupRemovedElement(node);
                    }
                });
            });
        });
        
        cleanupMutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    cleanupRemovedElement(element) {
        // Remove any observers or event listeners associated with removed elements
        const observedElements = element.querySelectorAll('[data-observed]');
        observedElements.forEach(el => {
            this.observers.forEach(observer => observer.unobserve(el));
        });
    }
    
    setupAnalytics() {
        // Minimal, privacy-focused analytics
        // Only track core metrics, no personal data
        if (!navigator.doNotTrack) {
            this.trackCoreMetrics();
        }
    }
    
    trackCoreMetrics() {
        // Track Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Cumulative Layout Shift
            let clsValue = 0;
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                console.log('CLS:', clsValue);
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }
    
    setupServiceWorker() {
        // Register service worker for offline functionality
        if ('serviceWorker' in navigator && location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('Service Worker registration failed:', err);
            });
        }
    }
    
    fallbackVisibilityHandling() {
        // Fallback for browsers without Intersection Observer
        console.log('Using fallback visibility detection');
        
        const checkVisibility = () => {
            const lazyElements = document.querySelectorAll('[data-lazy]:not(.loaded)');
            const revealElements = document.querySelectorAll('.card:not(.animate-fade-in)');
            
            [...lazyElements, ...revealElements].forEach(element => {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isVisible) {
                    if (element.dataset.lazy) {
                        this.loadLazyElement(element);
                    } else {
                        element.classList.add('animate-fade-in');
                    }
                }
            });
        };
        
        window.addEventListener('scroll', () => {
            requestAnimationFrame(checkVisibility);
        });
        
        checkVisibility();
    }
    
    logPerformanceMetrics() {
        perfMark('js-end');
        perfMeasure('total-js-time', 'js-start', 'js-end');
        
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            console.group('🚀 Performance Metrics');
            console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
            console.log('Load Complete:', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
            
            paint.forEach(entry => {
                console.log(`${entry.name}:`, entry.startTime, 'ms');
            });
            
            console.log('JavaScript Bundle Size:', `${document.querySelector('script[src*="main.js"]')?.textContent?.length || 'Unknown'} characters`);
            console.groupEnd();
        }, 1000);
    }
}

// Initialize the application
const app = new FamilyWebsite();

// Export for potential module usage
export default FamilyWebsite;