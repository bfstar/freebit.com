document.addEventListener('DOMContentLoaded', () => {
    const numberContainer = document.getElementById('lotto-numbers');
    const generateBtn = document.getElementById('generate-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const THEME_KEY = 'preferred-theme';
    let isGenerating = false; // 생성 중 상태를 관리하는 플래그

    function applyTheme(theme) {
        document.body.dataset.theme = theme;
        const isDark = theme === 'dark';
        themeToggleBtn.textContent = isDark ? '라이트 모드' : '다크 모드';
        themeToggleBtn.setAttribute('aria-pressed', String(isDark));
    }

    function getInitialTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme;
        }

        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    function generateLottoNumbers() {
        if (isGenerating) return; // 이미 생성 중이면 함수 종료

        isGenerating = true;
        generateBtn.disabled = true; // 버튼 비활성화
        generateBtn.style.cursor = 'not-allowed';
        generateBtn.style.opacity = '0.7';

        numberContainer.innerHTML = ''; // 기존 번호 삭제
        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }

        const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

        sortedNumbers.forEach((number, index) => {
            setTimeout(() => {
                const circle = document.createElement('div');
                circle.className = 'lotto-number';
                circle.textContent = number;
                numberContainer.appendChild(circle);
            }, index * 200); // 순차적으로 번호 표시
        });

        // 모든 애니메이션이 끝난 후 버튼을 다시 활성화
        setTimeout(() => {
            isGenerating = false;
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
            generateBtn.style.opacity = '1';
        }, 6 * 200); // 6개의 번호가 모두 표시되는 시간 이후
    }

    generateBtn.addEventListener('click', generateLottoNumbers);

    themeToggleBtn.addEventListener('click', () => {
        const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem(THEME_KEY, nextTheme);
    });

    applyTheme(getInitialTheme());

    // 초기 로딩 시 번호 생성
    generateLottoNumbers();
});
