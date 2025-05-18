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
            fetch('/verify-passcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, passcode })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    showSection('dashboard');
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    loginForm.reset();
                    loadDashboardData();
                } else {
                    alert('Invalid passcode. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        } else {
            alert('Please enter your email and passcode');
        }
    });
    
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showSection('dashboard');
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        loadDashboardData();
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

    const graphBtn = document.getElementById('graph-btn');
    const heatmapBtn = document.getElementById('heatmap-btn');
    const tableBtn = document.getElementById('table-btn');
    
    const graphView = document.getElementById('graph-view');
    const heatmapView = document.getElementById('heatmap-view');
    const tableView = document.getElementById('table-view');
    
    graphBtn.addEventListener('click', function() {
        graphView.classList.remove('hidden');
        heatmapView.classList.add('hidden');
        tableView.classList.add('hidden');
        
        graphBtn.classList.add('active');
        heatmapBtn.classList.remove('active');
        tableBtn.classList.remove('active');
    });
    
    heatmapBtn.addEventListener('click', function() {
        graphView.classList.add('hidden');
        heatmapView.classList.remove('hidden');
        tableView.classList.add('hidden');
        
        graphBtn.classList.remove('active');
        heatmapBtn.classList.add('active');
        tableBtn.classList.remove('active');
    });
    
    tableBtn.addEventListener('click', function() {
        graphView.classList.add('hidden');
        heatmapView.classList.add('hidden');
        tableView.classList.remove('hidden');
        
        graphBtn.classList.remove('active');
        heatmapBtn.classList.remove('active');
        tableBtn.classList.add('active');
    });

    let crowdChart;
    let heatmapChart;
    let crowdData = [];

    function loadDashboardData() {
        fetch('/crowd-data')
            .then(response => response.json())
            .then(data => {
                crowdData = data;
                updateDashboard(data);
            })
            .catch(error => {
                console.error('Error loading data:', error);
            });
    }

    function updateDashboard(data) {
        updateGraph(data);
        updateHeatmap(data);
        updateTable(data);
    }

    function updateGraph(data) {
        const ctx = document.getElementById('crowd-graph').getContext('2d');
        
        const locations = [...new Set(data.map(item => item.location))];
        
        const timestamps = [...new Set(data.map(item => item.timestamp))];
        timestamps.sort();
        
        const datasets = locations.map(location => {
            const locationData = data.filter(item => item.location === location);
            const counts = timestamps.map(timestamp => {
                const entry = locationData.find(item => item.timestamp === timestamp);
                return entry ? entry.count : 0;
            });
            
            return {
                label: location,
                data: counts,
                borderColor: location === 'Main Entrance' ? '#3a86ff' : '#ff006e',
                backgroundColor: location === 'Main Entrance' ? 'rgba(58, 134, 255, 0.2)' : 'rgba(255, 0, 110, 0.2)',
                fill: true,
                tension: 0.4
            };
        });
        
        if (crowdChart) crowdChart.destroy();
        
        crowdChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps.map(ts => ts.split(' ')[1]),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Crowd Count'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Crowd Density Over Time'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    function updateHeatmap(data) {
        const ctx = document.getElementById('crowd-heatmap').getContext('2d');
        
        const locations = [...new Set(data.map(item => item.location))];
        
        const timestamps = [...new Set(data.map(item => item.timestamp))];
        timestamps.sort();
        
        const datasets = timestamps.map((timestamp, index) => {
            const timestampData = data.filter(item => item.timestamp === timestamp);
            
            return {
                label: timestamp.split(' ')[1], 
                data: locations.map(location => {
                    const entry = timestampData.find(item => item.location === location);
                    return entry ? entry.count : 0;
                }),
                backgroundColor: getColor(index, timestamps.length)
            };
        });
        
        if (heatmapChart) heatmapChart.destroy();
        
        heatmapChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: locations,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Location'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Crowd Count'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Crowd Density Heatmap'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function updateTable(data) {
        const tableBody = document.getElementById('crowd-data-body');
        tableBody.innerHTML = '';
    
        data.forEach(item => {
            const row = document.createElement('tr');
    
            const timestampCell = document.createElement('td');
            timestampCell.textContent = item.timestamp;
    
            const countCell = document.createElement('td');
            countCell.textContent = item.crowd_count;
    
            row.appendChild(timestampCell);
            row.appendChild(countCell);
    
            tableBody.appendChild(row);
        });
    }

    function getColor(index, total) {
        const hue = (index / total) * 240; 
        return `hsla(${240 - hue}, 100%, 50%, 0.7)`;
    }
});