    // Select video and canvas elements
    const videoElement = document.querySelector('.input_video');
    const canvasElement = document.querySelector('.output_canvas');
    const canvasCtx = canvasElement.getContext('2d');

    // Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // Initialize Gesture Recognizer
    const gestureRecognizer = new GestureRecognizer({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/gesture_recognizer/${file}`,
    });

    // Handle Gesture Recognition Results
    gestureRecognizer.onResults((results) => {
      if (results.gestures) {
        for (const gesture of results.gestures) {
          console.log(`Gesture detected: ${gesture}`);
        }
      }
    });

    // Handle Hand Detection Results
    hands.onResults((results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // Draw the video on the canvas
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // Draw hand landmarks and connections
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
          drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
        }
      }

      // Send the hand landmarks to GestureRecognizer for gesture classification
      if (results.multiHandLandmarks) {
        const hand = results.multiHandLandmarks[0]; // Using the first hand detected
        gestureRecognizer.send({landmarks: hand});
      }

      canvasCtx.restore();
    });

    // Initialize Camera and start processing
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({image: videoElement});
      },
      width: 640,
      height: 480,
    });

    camera.start();