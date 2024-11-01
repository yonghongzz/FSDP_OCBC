document.addEventListener('DOMContentLoaded', () => {
    // Get payment details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const amount = urlParams.get('amount');
    const recipient = urlParams.get('recipient');

    // Set payment details
    document.getElementById('recipient').textContent = recipient || 'USER123';
    document.getElementById('amount').textContent = `S$ ${parseFloat(amount || 0).toFixed(2)}`;
    document.getElementById('date').textContent = new Date().toLocaleString();
    document.getElementById('reference').textContent = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Slider functionality
    const slider = document.getElementById('slider');
    const thumb = document.getElementById('slider-thumb');
    let isDragging = false;
    let startX;

    // Touch and mouse events
    thumb.addEventListener('touchstart', handleDragStart);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('touchend', handleDragEnd);
    thumb.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);

    function handleDragStart(e) {
        isDragging = true;
        startX = (e.type === 'mousedown' ? e.pageX : e.touches[0].pageX) - thumb.offsetLeft;
    }

    function handleDrag(e) {
        if (!isDragging) return;

        e.preventDefault();
        const pageX = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
        const x = pageX - startX;
        const maxSlide = slider.offsetWidth - thumb.offsetWidth;
        const walk = Math.max(0, Math.min(x, maxSlide));
        
        thumb.style.left = `${walk}px`;

        // Calculate progress percentage
        const progress = (walk / maxSlide) * 100;

        // Update slider text based on progress
        if (progress > 90) {
            confirmPayment();
            isDragging = false;
        }
    }

    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;

        // Get current position
        const currentPosition = parseInt(thumb.style.left) || 0;
        const maxSlide = slider.offsetWidth - thumb.offsetWidth;
        const progress = (currentPosition / maxSlide) * 100;

        // If not slid far enough, reset
        if (progress < 90) {
            thumb.style.transition = 'left 0.3s ease';
            thumb.style.left = '0px';
            setTimeout(() => {
                thumb.style.transition = '';
            }, 300);
        }
    }

    function confirmPayment() {
        // Show success modal
        const successModal = document.getElementById('success-modal');
        document.getElementById('success-amount').textContent = `S$ ${parseFloat(amount || 0).toFixed(2)}`;
        document.getElementById('success-recipient').textContent = recipient || 'USER123';
        successModal.classList.remove('hidden');

        // Reset slider
        thumb.style.transition = 'left 0.3s ease';
        thumb.style.left = '0px';
        setTimeout(() => {
            thumb.style.transition = '';
        }, 300);
    }

    // Done button handler
    document.getElementById('done-btn').addEventListener('click', () => {
        window.location.href = '/index.html';
    });
});