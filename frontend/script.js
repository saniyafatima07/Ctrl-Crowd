// Theme Toggle and Page Navigation Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle Functionality
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('preferred-theme');
    
    // Function to set theme
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
    
    // Apply saved theme or check system preference
    if (savedTheme) {
        setTheme(savedTheme === 'dark');
    } else {
        // Check if user system prefers dark mode
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
        localStorage.setItem('preferred-theme', prefersDark ? 'dark' : 'light');
    }
    
    // Toggle theme when button is clicked
    themeToggleBtn.addEventListener('click', function() {
        const isDarkMode = document.body.classList.contains('dark-theme');
        setTheme(!isDarkMode);
        localStorage.setItem('preferred-theme', !isDarkMode ? 'dark' : 'light');
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('preferred-theme')) {
            setTheme(e.matches);
        }
    });
    
    // Page Navigation Functionality
    const sections = {
        'home': document.getElementById('login'), // Home page shows login form
        'about': document.getElementById('about'),
        'dashboard': document.getElementById('dashboard')
    };
    
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Show the default section (home with login form) and hide others
    showSection('home');
    
    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section id from the href attribute
            const targetId = this.getAttribute('href').replace('#', '');
            
            // Show the target section and hide others
            showSection(targetId);
            
            // Update active link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu if open
            const navLinksContainer = document.querySelector('.nav-links');
            if (navLinksContainer.classList.contains('nav-active')) {
                burger.click();
            }
        });
    });
    
    // Function to show a specific section and hide others
    function showSection(sectionId) {
        for (const [id, section] of Object.entries(sections)) {
            if (id === sectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const passcode = document.getElementById('passcode').value;
        
        // Simple validation - in a real app, this would be a server request
        if (email && passcode) {
            // For demo purposes, any non-empty email/passcode works
            // In a real application, you would verify credentials with a server
            
            // Store login state in session storage
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // Redirect to dashboard
            showSection('dashboard');
            
            // Update active link to null (no nav item is active when on dashboard)
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            // Clear the form
            loginForm.reset();
        } else {
            alert('Please enter your email and passcode');
        }
    });
    
    // Check if user is logged in on page load
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showSection('dashboard');
        navLinks.forEach(navLink => navLink.classList.remove('active'));
    }
    
    // Handle URL hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.replace('#', '') || 'home';
        if (sections[hash]) {
            showSection(hash);
            navLinks.forEach(navLink => {
                navLink.classList.toggle('active', navLink.getAttribute('href') === `#${hash}`);
            });
        }
    });
    
    // Check URL hash on page load
    if (window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        if (sections[hash]) {
            showSection(hash);
            navLinks.forEach(navLink => {
                navLink.classList.toggle('active', navLink.getAttribute('href') === `#${hash}`);
            });
        }
    }
    
    // Mobile Navigation Toggle
    const burger = document.querySelector('.burger');
    const navLinksContainer = document.querySelector('.nav-links');
    
    burger.addEventListener('click', () => {
        navLinksContainer.classList.toggle('nav-active');
        
        // Animate burger lines
        burger.classList.toggle('toggle');
        
        // Burger animation
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