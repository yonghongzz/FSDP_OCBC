document.addEventListener('DOMContentLoaded',async()=>{
    // First, create a data collection function to gather training examples
  let trainingData = [];
  let gestureClasses = ['home','confirm','go back','reload'];
  let model;
  let results = null;

  let gesture = false;
  console.log(gesture);
  console.log(localStorage.getItem("gesture"));
  
  if(localStorage.getItem("gesture") === "true"){
    console.log("zzz");
      gesture = true;
  }
  else{
      gesture = false;
  }

  if(window.location.pathname.endsWith("index.html")){
    document.getElementById("gesture").addEventListener('click',()=>{
        gesture = !gesture;
        localStorage.setItem("gesture",gesture);
        console.log(localStorage.getItem("gesture"));
        if(gesture){  
            startHandGesture();
        }
        
    });
}

  function startHandGesture(){
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      
      
      
      const videoElement = document.querySelector('video');
      const canvasElement = document.querySelector('canvas');
      const canvasCtx = canvasElement.getContext('2d');
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });
      camera.start();

        // Modify the hands.onResults to include prediction
  hands.onResults(async (result) => {
    if(gesture){
        results = result;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
            drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
            
            // Add prediction if model is trained
            if (model.trained) {
              const normalizedLandmarks = normalizeLandmarks(landmarks);
              const gesture = await predictGesture(normalizedLandmarks);
            }
          }
        }
      
        canvasCtx.restore();
    }
  });
  }
  
  function normalizeLandmarks(landmarks) {
    // MediaPipe landmarks are objects with x, y, z properties
    const wrist = landmarks[0];
    return landmarks.map(landmark => [
      landmark.x - wrist.x,
      landmark.y - wrist.y,
      landmark.z - wrist.z
    ]);
  }
  
  async function loadModel() {
    try {
      // Load the model architecture and weights
      model = await tf.loadLayersModel('/hand-gesture-model.json');
      
      gestureClasses = ["home", "confirm", "go back", "reload"];
      
      // Recompile the model to ensure it's ready for predictions
      model.compile({
        optimizer: 'adam',
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      // Mark model as trained
      model.trained = true;
      
      console.log('Model loaded successfully');
      console.log('Loaded Gesture Classes:', gestureClasses);
      
      return model;
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }
  
  
  // Add real-time prediction after training
  async function predictGesture(landmarks) {
    const input = tf.tensor([landmarks.flat()]);
    const prediction = await model.predict(input).array();
    //const gestureIndex = prediction[0].indexOf(Math.max(...prediction[0]));
    const confidence = Math.max(...prediction[0]);
    console.log(confidence)
    if (confidence > 0.8) {  // Set your confidence threshold
        const gestureIndex = prediction[0].indexOf(confidence);
        console.log(gestureClasses[gestureIndex]);
        if(gestureClasses[gestureIndex] == "home"){
          window.location.href = "index.html";
        }
        else if(gestureClasses[gestureIndex] == "reload"){
          window.location.reload();
        }
        else if(gestureClasses[gestureIndex] == "go back"){
          window.history.back();
        }
        else if(gestureClasses[gestureIndex] == "confirm"){
            if(window.location.pathname.endsWith("reviewconf.html")){
                document.getElementById("confirm").click();
            }
        }
        
            // Wait for 3 seconds before allowing the next prediction
       await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  
  await loadModel();

  if(gesture){
    startHandGesture();
  }

  
  });