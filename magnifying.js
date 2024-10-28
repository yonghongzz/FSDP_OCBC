document.addEventListener('DOMContentLoaded',() => {
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
  //move magnifying glass with cursor
  handle.style.left = pointerX - SIZE / 1.7 + "px";
  handle.style.top = pointerY - SIZE / 1.7 + "px";
  if (magnifyingGlass.children[0]) {
    //align magnified document
    let offsetX = (SIZE * Math.pow(SCALE, 2)) / 2 - pointerX * SCALE +20;
    let offsetY = (SIZE * Math.pow(SCALE, 2)) / 2 - pointerY * SCALE +60;
    magnifyingGlass.children[0].style.left = offsetX + "px";
    magnifyingGlass.children[0].style.top = offsetY + "px";
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
  const baseSize = SSSIZE;
  const canvas = document.createElement('canvas');
  canvas.width = baseSize;
  canvas.height = baseSize;
  const ctx = canvas.getContext('2d');  

  if (!clonedBody) {
    // Regular view capture
    html2canvas(document.body, {
      // Add html2canvas options to ensure accurate capture
      scrollX: window.pageXOffset,
      scrollY: window.pageYOffset,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      scale: window.devicePixelRatio // Account for device pixel ratio
    }).then((fullCanvas) => {
      // Get scroll position and canvas scaling factor
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;
      const canvasScale = fullCanvas.width / document.documentElement.offsetWidth;
      
      // Calculate capture coordinates accounting for scroll and canvas scale
      const captureX = (x + scrollX) * canvasScale;
      const captureY = (y + scrollY) * canvasScale;
      
      // Calculate start position for capture
      const startX = Math.max(0, captureX - (baseSize * canvasScale / 2));
      const startY = Math.max(0, captureY - (baseSize * canvasScale / 2));
      
      
      // Draw scaled section to output canvas
      ctx.drawImage(
        fullCanvas,
        startX,
        startY,
        baseSize * canvasScale,
        baseSize * canvasScale,
        0,
        0,
        baseSize,
        baseSize
      );
      
      const imageData = canvas.toDataURL();
      const imgElement = document.createElement('img');
      imgElement.src = imageData;
      document.body.appendChild(imgElement);
      performOCR(imageData);
      
    });
  } else {
    // Capturing from magnified view
    html2canvas(clonedBody).then((fullCanvas) => {
      // Account for magnification scale when calculating coordinates
      const scaledSize = baseSize * SCALE;
      const startX = (x * SCALE) - (scaledSize/2) -(22 * SCALE);
      const startY = (y * SCALE) - (scaledSize/2);
      
      // Adjust for magnifying glass offset
      const magOffsetX = parseFloat(magnifyingGlass.style.left);
      const magOffsetY = parseFloat(magnifyingGlass.style.top);
      
      ctx.drawImage(
        fullCanvas,
        startX - magOffsetX,
        startY - magOffsetY,
        scaledSize,
        scaledSize,
        0,
        0,
        baseSize,
        baseSize
      );

      const imageData = canvas.toDataURL();
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
    // 'eng',
    // {
    //   logger: (info) => console.log(info) // Log progress
    // }
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
})