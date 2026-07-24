/* ==================================================================
   TASMIMI DZ — SITE SCRIPT
   Vanilla ES6+. No dependencies.

   Sections:
     1. Utilities
     2. Sticky Header (scrolled state)
     3. Mobile Navigation (drawer toggle, outside click, Esc, link close)
     4. Active Nav Link Highlighting (scroll spy)
     5. Smooth Scrolling for internal anchors
     6. FAQ Accordion
     7. Scroll-Reveal Animations (Intersection Observer)
     8. Button Click Feedback
     9. Floating WhatsApp Attention Pulse
     10. Init
   ================================================================== */

(() => {
    'use strict';

    /* ==============================================================
       1. UTILITIES
       ============================================================== */

    /** Returns a throttled version of fn, firing at most once per `wait` ms
     *  via requestAnimationFrame for smooth scroll-linked work. */
    const rafThrottle = (fn) => {
        let ticking = false;
        return (...args) => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                fn(...args);
                ticking = false;
            });
        };
    };

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    /* ==============================================================
       2. STICKY HEADER — add a background once the page is scrolled
       ============================================================== */

    const initStickyHeader = () => {
        const header = document.getElementById('site-header');
        if (!header) return;

        const SCROLL_THRESHOLD = 8;

        const updateHeaderState = () => {
            header.classList.toggle(
                'is-scrolled',
                window.scrollY > SCROLL_THRESHOLD
            );
        };

        updateHeaderState();
        window.addEventListener('scroll', rafThrottle(updateHeaderState), {
            passive: true,
        });
    };

    /* ==============================================================
       3. MOBILE NAVIGATION — hamburger toggle + drawer
       ============================================================== */

    const initMobileNav = () => {
        const toggle = document.getElementById('navbar-toggle');
        const drawer = document.getElementById('navbar-drawer');
        if (!toggle || !drawer) return;

        const openDrawer = () => {
            drawer.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Close menu');
            document.body.classList.add('no-scroll');
        };

        const closeDrawer = () => {
            drawer.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open menu');
            document.body.classList.remove('no-scroll');
        };

        const isOpen = () => drawer.classList.contains('is-open');

        toggle.addEventListener('click', () => {
            isOpen() ? closeDrawer() : openDrawer();
        });

        // Close drawer after a nav link is selected
        drawer.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', closeDrawer);
        });

        // Close on outside click
        document.addEventListener('click', (event) => {
            if (!isOpen()) return;
            const clickedInsideDrawer = drawer.contains(event.target);
            const clickedToggle = toggle.contains(event.target);
            if (!clickedInsideDrawer && !clickedToggle) closeDrawer();
        });

        // Close on Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isOpen()) {
                closeDrawer();
                toggle.focus();
            }
        });

        // Close automatically if the viewport grows into desktop layout
        window.addEventListener(
            'resize',
            rafThrottle(() => {
                if (window.innerWidth >= 1024 && isOpen()) closeDrawer();
            }),
            { passive: true }
        );
    };

    /* ==============================================================
       4. ACTIVE NAV LINK HIGHLIGHTING — scroll spy
       ============================================================== */

    const initScrollSpy = () => {
        const navLinks = Array.from(document.querySelectorAll('.nav-link'));
        if (!navLinks.length) return;

        // Build a map of section id -> matching nav links (header + drawer)
        const linksBySectionId = new Map();
        navLinks.forEach((link) => {
            const href = link.getAttribute('href') || '';
            if (!href.startsWith('#')) return;
            const id = href.slice(1);
            if (!linksBySectionId.has(id)) linksBySectionId.set(id, []);
            linksBySectionId.get(id).push(link);
        });

        const sections = Array.from(linksBySectionId.keys())
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        if (!sections.length || !('IntersectionObserver' in window)) return;

        const setActiveLink = (activeId) => {
            navLinks.forEach((link) => link.classList.remove('active'));
            const activeLinks = linksBySectionId.get(activeId);
            if (activeLinks) {
                activeLinks.forEach((link) => link.classList.add('active'));
            }
        };

        const spyObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveLink(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-45% 0px -50% 0px',
                threshold: 0,
            }
        );

        sections.forEach((section) => spyObserver.observe(section));
    };

    /* ==============================================================
       5. SMOOTH SCROLLING — internal anchor links
       ============================================================== */

    const initSmoothScroll = () => {
        const header = document.getElementById('site-header');

        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href^="#"]');
            if (!link) return;

            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();

            const headerOffset = header ? header.offsetHeight : 0;
            const targetPosition =
                target.getBoundingClientRect().top +
                window.pageYOffset -
                headerOffset;

            window.scrollTo({
                top: targetPosition,
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });

            // Keep focus management accessible for keyboard/screen-reader users
            target.setAttribute('tabindex', '-1');
            target.addEventListener(
                'blur',
                () => target.removeAttribute('tabindex'),
                { once: true }
            );
            target.focus({ preventScroll: true });
        });
    };

    /* ==============================================================
       6. FAQ ACCORDION — one item open at a time
       ============================================================== */

    const initFaqAccordion = () => {
        const questions = document.querySelectorAll('.faq-item__question');
        if (!questions.length) return;

        const closeQuestion = (question) => {
            question.setAttribute('aria-expanded', 'false');
        };

        const openQuestion = (question) => {
            question.setAttribute('aria-expanded', 'true');
        };

        questions.forEach((question) => {
            question.addEventListener('click', () => {
                const isCurrentlyOpen =
                    question.getAttribute('aria-expanded') === 'true';

                // Close every other item so only one stays open
                questions.forEach((otherQuestion) => {
                    if (otherQuestion !== question) closeQuestion(otherQuestion);
                });

                isCurrentlyOpen ? closeQuestion(question) : openQuestion(question);
            });
        });
    };

    /* ==============================================================
       7. SCROLL-REVEAL ANIMATIONS — Intersection Observer
       ============================================================== */

    const initScrollReveal = () => {
        const revealTargets = document.querySelectorAll(
            [
                '.section-heading',
                '.section-label',
                '.mockup-card',
                '.reason-item',
                '.step-item',
                '.review-card',
                '.faq-item',
                '.trust-stat',
                '.pricing-teaser__headline',
                '.pricing-teaser__list',
            ].join(', ')
        );

        if (!revealTargets.length) return;

        // Respect the user's motion preference: skip animation, show content
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            revealTargets.forEach((el) => el.classList.add('is-visible'));
            return;
        }

        revealTargets.forEach((el) => el.classList.add('reveal'));

        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    // Animate only once
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -40px 0px',
            }
        );

        revealTargets.forEach((el) => revealObserver.observe(el));
    };

    /* ==============================================================
       8. BUTTON CLICK FEEDBACK — subtle, keyboard-friendly
       ============================================================== */

    const initButtonFeedback = () => {
        const buttons = document.querySelectorAll('.btn, .floating-whatsapp');
        if (!buttons.length) return;

        const FEEDBACK_CLASS = 'is-pressed';
        const FEEDBACK_DURATION = 150;

        buttons.forEach((button) => {
            const applyFeedback = () => {
                button.classList.add(FEEDBACK_CLASS);
                window.setTimeout(
                    () => button.classList.remove(FEEDBACK_CLASS),
                    FEEDBACK_DURATION
                );
            };

            button.addEventListener('pointerdown', applyFeedback);

            // Keyboard activation (Enter/Space) gets the same feedback
            button.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    applyFeedback();
                }
            });
        });
    };

    /* ==============================================================
       9. FLOATING WHATSAPP — one-time attention pulse after arrival
       ============================================================== */

    const initFloatingWhatsappPulse = () => {
        const floatingButton = document.getElementById('floating-whatsapp');
        if (!floatingButton || prefersReducedMotion) return;

        const PULSE_DELAY_MS = 4000;

        window.setTimeout(() => {
            floatingButton.classList.add('pulse-once');
            floatingButton.addEventListener(
                'animationend',
                () => floatingButton.classList.remove('pulse-once'),
                { once: true }
            );
        }, PULSE_DELAY_MS);
    };

    /* ==============================================================
       10. INIT
       ============================================================== */

    const init = () => {
        initStickyHeader();
        initMobileNav();
        initScrollSpy();
        initSmoothScroll();
        initFaqAccordion();
        initScrollReveal();
        initButtonFeedback();
        initFloatingWhatsappPulse();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
