function toggleTheme() {
    const body = document.body;
    const isVoid = body.classList.contains('theme-void');
    
    if (isVoid) {
        body.classList.remove('theme-void');
        body.classList.add('theme-core');
        localStorage.setItem('realm', 'core');
    } else {
        body.classList.remove('theme-core');
        body.classList.add('theme-void');
        localStorage.setItem('realm', 'void');
    }
}

// Persistência do tema ao carregar
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('realm') === 'core') {
        document.body.classList.replace('theme-void', 'theme-core');
    }
});


