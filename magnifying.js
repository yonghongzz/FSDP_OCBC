//defaults - not recommended to change

const SCALE = 1.3; //magnification
const SIZE = 300; // diameter
const SSSIZE = 100;
const LENSE_OFFSET_X = SIZE / 10.2;
const LENSE_OFFSET_Y = SIZE / 10.2;
var magnifying = false;

document.documentElement.style.setProperty("--scale", SCALE);
document.documentElement.style.setProperty("--size", SIZE + "px");

//create magnifying glass (lense)
const handle = document.createElement("div");
handle.classList.add("handle");

const magnifyingGlass = document.createElement("div");
magnifyingGlass.classList.add("magnifying-glass");
magnifyingGlass.style.top = LENSE_OFFSET_Y + "px";
magnifyingGlass.style.left = LENSE_OFFSET_X + "px";

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
    let offsetX = (SIZE * Math.pow(SCALE, 2)) / 2 - pointerX * SCALE;
    let offsetY = (SIZE * Math.pow(SCALE, 2)) / 2 - pointerY * SCALE;
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
    const captureSize = SSSIZE; // Increased capture size
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = captureSize;
    canvas.height = captureSize;
  
    const startX = x - captureSize / 2;
    const startY = y - captureSize / 2;
  
    html2canvas(document.body).then((fullCanvas) => {
      ctx.drawImage(fullCanvas, startX, startY, captureSize, captureSize, 0, 0, captureSize, captureSize);
      
      const imageData = canvas.toDataURL();
      
      // Display the captured image for debugging
      const imgElement = document.createElement('img');
      imgElement.src = imageData;
      document.body.appendChild(imgElement);
  
      performOCR(imageData); 
    });
  };

document.addEventListener('click', (event) => {
  
    if(!magnifying){
        const pointerX = event.pageX;
        const pointerY = event.pageY;
        captureScreenshot(pointerX, pointerY);
    }
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Set the language (optional)

    // Optional: Set additional properties
    utterance.pitch = 1; // Range: 0 to 2
    utterance.rate = 1; // Range: 0.1 to 10
    utterance.volume = 1; // Range: 0 to 1

    // Speak the text
    speechSynthesis.speak(utterance);

  });
};


//issues 
//- lots of magin numbers for alignment
//- background gradient doesn't show over images