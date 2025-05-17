document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    const savedTheme = localStorage.getItem('preferred-theme');

    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    if (savedTheme) {
        setTheme(savedTheme === 'dark');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
        localStorage.setItem('preferred-theme', prefersDark ? 'dark' : 'light');
    }
    
    themeToggleBtn.addEventListener('click', function() {
        const isDarkMode = document.body.classList.contains('dark-theme');
        setTheme(!isDarkMode);
        localStorage.setItem('preferred-theme', !isDarkMode ? 'dark' : 'light');
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('preferred-theme')) {
            setTheme(e.matches);
        }
    });
    
    const sections = {
        'home': document.getElementById('login'),
        'about': document.getElementById('about'),
        'dashboard': document.getElementById('dashboard')
    };
    
    const navLinks = document.querySelectorAll('.nav-links a');
    
    showSection('home');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').replace('#', '');
            
            showSection(targetId);
            
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            const navLinksContainer = document.querySelector('.nav-links');
            if (navLinksContainer.classList.contains('nav-active')) {
                burger.click();
            }
        });
    });
    
    function showSection(sectionId) {
        for (const [id, section] of Object.entries(sections)) {
            if (id === sectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
    }
    
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const passcode = document.getElementById('passcode').value;
        
        if (email && passcode) {
            sessionStorage.setItem('isLoggedIn', 'true');

            showSection('dashboard');
            
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            loginForm.reset();
        } else {
            alert('Please enter your email and passcode');
        }
    });
    
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showSection('dashboard');
        navLinks.forEach(navLink => navLink.classList.remove('active'));
    }
    
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.replace('#', '') || 'home';
        if (sections[hash]) {
            showSection(hash);
            navLinks.forEach(navLink => {
                navLink.classList.toggle('active', navLink.getAttribute('href') === `#${hash}`);
            });
        }
    });
    
    if (window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        if (sections[hash]) {
            showSection(hash);
            navLinks.forEach(navLink => {
                navLink.classList.toggle('active', navLink.getAttribute('href') === `#${hash}`);
            });
        }
    }
    
    const burger = document.querySelector('.burger');
    const navLinksContainer = document.querySelector('.nav-links');
    
    burger.addEventListener('click', () => {
        navLinksContainer.classList.toggle('nav-active');
        
        burger.classList.toggle('toggle');
        
        const lines = burger.querySelectorAll('div');
        lines.forEach((line, index) => {
            if (burger.classList.contains('toggle')) {
                if (index === 0) {
                    line.style.transform = 'rotate(45deg) translate(5px, 6px)';
                } else if (index === 1) {
                    line.style.opacity = '0';
                } else {
                    line.style.transform = 'rotate(-45deg) translate(5px, -6px)';
                }
            } else {
                line.style.transform = 'none';
                line.style.opacity = '1';
            }
        });
    });
});