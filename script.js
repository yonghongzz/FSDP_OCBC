document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('qr-video');
    const scanBtn = document.getElementById('scan-btn');
    const scanResult = document.getElementById('scan-result');
    let scanner = null;

    function startScanner() {
        scanner = new Instascan.Scanner({ video: video });
        scanner.addListener('scan', function (content) {
            handleScanResult(content);
        });

        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                scanner.start(cameras[0]);
            } else {
                console.error('No cameras found.');
                alert('No cameras found on your device.');
            }
        }).catch(function (e) {
            console.error(e);
            alert('Error accessing camera.');
        });
    }

    function stopScanner() {
        if (scanner) {
            scanner.stop();
        }
    }

    function handleScanResult(content) {
        scanResult.textContent = `Scanned: ${content}`;
        // Here you would typically send the scanned data to your server
        // or process it further for the payment
        console.log('QR Code content:', content);
        stopScanner();
    }

    scanBtn.addEventListener('click', () => {
        if (scanner && scanner.isActive()) {
            stopScanner();
            scanBtn.textContent = 'Scan QR Code';
        } else {
            startScanner();
            scanBtn.textContent = 'Stop Scanning';
        }
    });
});

