//defaults - not recommended to change

const SCALE = 1.3; //magnification
const SIZE = 100; // diameter
const SSSIZE = 120;
const LENSE_OFFSET_X = SIZE / 10.2;
const LENSE_OFFSET_Y = SIZE / 10.2;
const items = ["Glass", "Magnify","Click","remove","Paynow"];
var magnifying = false;

document.documentElement.style.setProperty("--scale", SCALE);
document.documentElement.style.setProperty("--size", SIZE + "px");

//create magnifying glass (lense)
const handle = document.createElement("div");
handle.classList.add("handle");

const magnifyingGlass = document.createElement("div");
magnifyingGlass.classList.add("magnifying-glass");
magnifyingGlass.style.top = LENSE_OFFSET_Y+10 + "px";
magnifyingGlass.style.left = LENSE_OFFSET_X-20 + "px";

handle.append(magnifyingGlass);

const magnifyButton = document.getElementById("magnify");

const addMagnifyingGlass = () => {
    magnifying = true;
  const bodyClone = document.body.cloneNode(true);
  bodyClone.classList.add("body-clone");
  bodyClone.style.top = "0px";
  bodyClone.style.left = "0px";
  magnifyingGlass.append(bodyClone);
  document.body.append(handle);
};

magnifyButton.addEventListener("click", addMagnifyingGlass);

const moveMagnifyingGlass = (event) => {
  let pointerX = event.pageX;
  let pointerY = event.pageY;
  
  // Get device pixel ratio for scaling
  const dpr = window.devicePixelRatio || 1;
  
  // Move magnifying glass with cursor, keeping the original ratios but accounting for DPR
  handle.style.left = `${pointerX - SIZE / 1.7}px`;
  handle.style.top = `${pointerY - SIZE / 1.7}px`;
  
  if (magnifyingGlass.children[0]) {
    // Align magnified document with adjusted offsets for different screen sizes
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate base offsets
    const baseOffsetX = (SIZE * Math.pow(SCALE, 2)) / 2;
    const baseOffsetY = (SIZE * Math.pow(SCALE, 2)) / 2;
    
    // Apply viewport-relative adjustments
    let offsetX = baseOffsetX - pointerX * SCALE + 55 * (viewportWidth / 1920); // Normalized to 1920px width
    let offsetY = baseOffsetY - pointerY * SCALE + 95 * (viewportHeight / 1080); // Normalized to 1080px height
    
    // Apply position with scaling compensation
    magnifyingGlass.children[0].style.left = `${offsetX}px`;
    magnifyingGlass.children[0].style.top = `${offsetY}px`;
  }
};

document.addEventListener("pointermove", moveMagnifyingGlass);

const removeMagnifiyingGlass = (event) => {
    magnifying = false;
  magnifyingGlass.children[0].remove();
  handle.remove();
};

magnifyingGlass.addEventListener("dblclick", removeMagnifiyingGlass);

const captureScreenshot = (x, y) => {
  const clonedBody = document.querySelector('.body-clone');
  const captureSize = SSSIZE; // Increased capture size
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // canvas.width = captureSize * 1.2;
  // canvas.height = captureSize * 0.8;

  const startX = x - captureSize / 2;
  const startY = y - captureSize / 2;

  if(!clonedBody){
    html2canvas(document.body).then((fullCanvas) => {
      ctx.drawImage(fullCanvas, startX, startY, captureSize, captureSize, 0, 0, captureSize, captureSize);
      
      const imageData = canvas.toDataURL();
      
      // Display the captured image for debugging
      const imgElement = document.createElement('img');
      imgElement.src = imageData;
      document.body.appendChild(imgElement);
  
      performOCR(imageData); 
    });
  }
  else{
    html2canvas(clonedBody).then((fullCanvas) => {
      ctx.drawImage(fullCanvas, startX, startY, captureSize, captureSize, 0, 0, captureSize, captureSize);
      
      const imageData = canvas.toDataURL();
      
      // Display the captured image for debugging
      const imgElement = document.createElement('img');
      imgElement.src = imageData;
      document.body.appendChild(imgElement);
  
      performOCR(imageData); 
    });
  }
};

document.addEventListener('click', (event) => {
  
  const pointerX = event.pageX;
  const pointerY = event.pageY;
  captureScreenshot(pointerX, pointerY);
});

const performOCR = (imageData) => {
  Tesseract.recognize(
    imageData,
    'eng',
    {
      logger: (info) => console.log(info) // Log progress
    }
  ).then(({ data: { text } }) => {
    console.log("Extracted Text:\n", text);
    items.forEach(element => {
      if(text.includes(element)){
        const utterance = new SpeechSynthesisUtterance(element);
        utterance.lang = 'en-US'; // Set the language (optional)
    
        // Optional: Set additional properties
        utterance.pitch = 1; // Range: 0 to 2
        utterance.rate = 1; // Range: 0.1 to 10
        utterance.volume = 1; // Range: 0 to 1
    
        // Speak the text
        speechSynthesis.speak(utterance);
      }
    });


  });
};


//issues 
//- lots of magin numbers for alignment
//- background gradient doesn't show over images