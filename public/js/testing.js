// First, create a data collection function to gather training examples
let trainingData = [];
let gestureClasses = ['thumbs_up', 'peace', 'open_palm'];
let model;
let results = null;
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

function normalizeLandmarks(landmarks) {
  // MediaPipe landmarks are objects with x, y, z properties
  const wrist = landmarks[0];
  return landmarks.map(landmark => [
    landmark.x - wrist.x,
    landmark.y - wrist.y,
    landmark.z - wrist.z
  ]);
}

// Update collectTrainingData to include a timeout
async function collectTrainingData(gestureName, numSamples = 30) {
  console.log(`Collecting samples for ${gestureName}`);
  let samplesCollected = 0;
  
  return new Promise((resolve, reject) => {
    const collector = setInterval(async () => {
      if (results && results.multiHandLandmarks && results.multiHandLandmarks[0]) {
        const landmarks = results.multiHandLandmarks[0];
        const normalizedLandmarks = normalizeLandmarks(landmarks);
        
        trainingData.push({
          landmarks: normalizedLandmarks,
          label: gestureName
        });
        
        samplesCollected++;
        console.log(`Collected sample ${samplesCollected}/${numSamples}`);
        
        if (samplesCollected >= numSamples) {
          clearInterval(collector);
          clearTimeout(timeout);
          resolve();
        }
      }
    }, 100);

    // Add timeout to prevent infinite waiting
    const timeout = setTimeout(() => {
      clearInterval(collector);
      if (samplesCollected === 0) {
        reject(new Error('No hand detected during collection period'));
      } else {
        resolve(); // Resolve with partial samples if some were collected
      }
    }, 30000); // 30 second timeout
  });
}

// Update trainModel to handle collection errors
async function trainModel() {
  if (!model) {
    model = createModel();
  }
  
  try {
    // Clear existing training data
    trainingData = [];
    
    // Collect data for each gesture
    for (const gesture of gestureClasses) {
      console.log(`Please perform ${gesture} gesture`);
      try {
        await collectTrainingData(gesture);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error collecting data for ${gesture}:`, error);
        throw new Error(`Training failed: ${error.message}`);
      }
    }
    
    if (trainingData.length === 0) {
      throw new Error('No training data collected');
    }

    const { inputs, labels } = await prepareData(trainingData);
    
    const history = await model.fit(inputs, labels, {
      epochs: 20,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        }
      }
    });
    
    console.log('Training complete!');
    model.trained = true;
    return history;
    
  } catch (error) {
    console.error('Training failed:', error);
    throw error;
  }
}

async function prepareData(data) {
  // Convert landmarks to flat arrays
  const landmarks = data.map((d) => d.landmarks.flat());
  const labels = data.map((d) => gestureClasses.indexOf(d.label));
  
  // Create tensors with specific data types
  // Convert inputs to float32
  const inputs = tf.tensor2d(landmarks, [landmarks.length, landmarks[0].length], 'float32');
  // Keep labels as int32
  const outputs = tf.tensor1d(labels, 'float32');
  
  // Log shapes and data types for debugging
  console.log('Input tensor shape:', inputs.shape);
  console.log('Labels tensor shape:', outputs.shape);
  console.log('Input tensor dtype:', inputs.dtype);
  console.log('Labels tensor dtype:', outputs.dtype);
  
  return {
      inputs,
      labels: outputs
  };
}

// Save model function
async function saveModel() {
  try {
    // Save model architecture and weights
    await model.save('downloads://hand-gesture-model');
    
    // Save gesture classes and other metadata
    const metadata = {
      gestureClasses,
      modelVersion: '1.0',
      dateCreated: new Date().toISOString()
    };
    
    // Create a blob and download it
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const metadataUrl = URL.createObjectURL(metadataBlob);
    
    const metadataLink = document.createElement('a');
    metadataLink.href = metadataUrl;
    metadataLink.download = 'hand-gesture-metadata.json';
    metadataLink.click();
    
    console.log('Model and metadata saved successfully');
  } catch (error) {
    console.error('Error saving model:', error);
  }
}

// Add real-time prediction after training
async function predictGesture(landmarks) {
  const input = tf.tensor([landmarks.flat()]);
  const prediction = await model.predict(input).array();
  const gestureIndex = prediction[0].indexOf(Math.max(...prediction[0]));
  return gestureClasses[gestureIndex];
}

// Initialize the model
function createModel() {
  const numClasses = gestureClasses.length;
  
  model = tf.sequential();
  
  // Input layer (21 landmarks × 3 coordinates)
  model.add(tf.layers.dense({ 
      inputShape: [63], // 21 landmarks * 3 coordinates (x, y, z)
      units: 128, 
      activation: 'relu' 
  }));
  
  // Hidden layers
  model.add(tf.layers.dense({ 
      units: 64, 
      activation: 'relu' 
  }));
  model.add(tf.layers.dense({ 
      units: 32, 
      activation: 'relu' 
  }));
  
  // Output layer (number of gesture classes)
  model.add(tf.layers.dense({ 
      units: numClasses, 
      activation: 'softmax' 
  }));
  
  // Compile the model
  model.compile({
      optimizer: 'adam',
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy']
  });
  
  console.log('Model created successfully');
  return model;
}

// Modify the hands.onResults to include prediction
hands.onResults(async (result) => {
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
        console.log(`Predicted gesture: ${gesture}`);
      }
    }
  }

  canvasCtx.restore();
});

// Update the UI controls
const trainButton = document.createElement('button');
trainButton.textContent = 'Train Model';
trainButton.className = 'control-button';
document.body.appendChild(trainButton);

const loadButton = document.createElement('button');
loadButton.textContent = 'Load Model';
loadButton.className = 'control-button';
document.body.appendChild(loadButton);

const saveButton = document.createElement('button');
saveButton.textContent = 'Save Model';
saveButton.className = 'control-button';
saveButton.disabled = true;
document.body.appendChild(saveButton);

// Update the UI controls
const createModelButton = document.createElement('button');
createModelButton.textContent = 'Create Model';
createModelButton.className = 'control-button';
document.body.appendChild(createModelButton);

// Add button event listeners
createModelButton.onclick = () => {
  try {
      model = createModel();
      createModelButton.textContent = 'Model Created';
      trainButton.disabled = false;
  } catch (error) {
      console.error('Error creating model:', error);
      createModelButton.textContent = 'Creation Failed';
  }
};

// Add button event listeners
trainButton.onclick = async () => {
  trainButton.disabled = true;
  trainButton.textContent = 'Training...';
  await trainModel();
  model.trained = true;
  trainButton.textContent = 'Training Complete';
  saveButton.disabled = false;
};

loadButton.onclick = async () => {
  loadButton.disabled = true;
  loadButton.textContent = 'Loading...';
  try {
    await loadModel();
    loadButton.textContent = 'Model Loaded';
    saveButton.disabled = false;
  } catch (error) {
    console.error('Error loading model:', error);
    loadButton.textContent = 'Load Failed';
  }
  loadButton.disabled = false;
};

saveButton.onclick = async () => {
  if (!model.trained) {
    alert('Please train or load a model first');
    return;
  }
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';
  try {
    await saveModel();
    saveButton.textContent = 'Model Saved';
  } catch (error) {
    console.error('Error saving model:', error);
    saveButton.textContent = 'Save Failed';
  }
  saveButton.disabled = false;
};

// Add some basic styles
const style = document.createElement('style');
style.textContent = `
  .control-button {
    margin: 10px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }
  .control-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
document.head.appendChild(style);