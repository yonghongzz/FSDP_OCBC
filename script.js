document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const video = document.getElementById('qr-video');
    const scanBtn = document.getElementById('scan-btn');
    const scanResult = document.getElementById('scan-result');
    const scanSection = document.getElementById('scan-section');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const amountInput = document.getElementById('amount-input');
    const paymentAmount = document.getElementById('payment-amount');
    const confirmPayment = document.getElementById('confirm-payment');
    const generateQRBtn = document.getElementById('generate-qr');
    const requestAmount = document.getElementById('request-amount');
    const userQRDiv = document.getElementById('user-qr');
    
    let scanner = null;
    let qrcode = null;
    let isScanning = false;

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-section`).classList.add('active');
            
            if (scanner && btn.dataset.tab === 'receive') {
                stopScanner();
                scanBtn.textContent = 'Scan QR Code';
            }
        });
    });

    // Scanner functions
    function startScanner() {
        // Create new scanner instance that uses the video element
        scanner = new Instascan.Scanner({ video: video });

        // Add listener for successful scans
        scanner.addListener('scan', function (content) {
            handleScanResult(content);
            isScanning = false;
        });

        // Get available cameras and start scanning
        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                // Try to use the back camera if available
                const backCamera = cameras.find(camera => camera.name.toLowerCase().includes('back'));
                scanner.start(backCamera || cameras[0]);
            } else {
                console.error('No cameras found.');
                alert('No cameras found on your device.');
                isScanning = false;
            }
        }).catch(function (e) {
            console.error(e);
            alert('Error accessing camera.');
            isScanning = false;
        });
    }

    function stopScanner() {
        if (scanner) {
            scanner.stop();
            scanner = null;
        }
    }

    function handleScanResult(content) {
        try {
            const data = JSON.parse(content);

            if (data.type === 'receive') {
                // Show amount input for payment to scanned user
                amountInput.classList.remove('hidden');
                scanSection.style.display = 'none';
                document.getElementById('payment-recipient').textContent = data.userId;
                paymentAmount.value = '';  // Clear any previous amount
                paymentAmount.focus();  // Focus the input field
            } else if (data.userId && data.amount) {
                // Handle legacy format or other QR types
                amountInput.classList.remove('hidden');
                scanSection.style.display = 'none';
                paymentAmount.value = data.amount;
            }
        } catch (e) {
            console.error('Invalid QR code format');
            alert('Invalid QR code format');
        }
        stopScanner();
        scanBtn.textContent = 'Scan Again';
    }

    // Event listeners
    scanBtn.addEventListener('click', () => {
        if (isScanning) {
            stopScanner();
            scanBtn.textContent = 'Scan QR Code';
            isScanning = false;
        } else {
            amountInput.classList.add('hidden');
            scanSection.style.display = 'block';
            startScanner();
            scanBtn.textContent = 'Stop Scanning';
            isScanning = true;
        }
    });

    confirmPayment.addEventListener('click', () => {
        const amount = parseFloat(paymentAmount.value);
        if (amount > 0) {
            const recipient = document.getElementById('payment-recipient').textContent;
            window.location.href = `paymentDetails.html?amount=${amount}&recipient=${recipient}`;
            amountInput.classList.add('hidden');
            scanSection.style.display = 'block';
            paymentAmount.value = '';
        } else {
            alert('Please enter a valid amount');
        }
    });

    generateQRBtn.addEventListener('click', () => {
        // Generate QR code with just the user ID (no amount)
        const paymentData = {
            userId: document.getElementById('user-id').textContent,
            type: 'receive'
        };
        
        if (qrcode) {
            qrcode.clear();
            qrcode.makeCode(JSON.stringify(paymentData));
        } else {
            qrcode = new QRCode(userQRDiv, {
                text: JSON.stringify(paymentData),
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    });
});
