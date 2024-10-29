//defaults - not recommended to change

const SCALE = 1.3; //magnification
const SIZE = 100; // diameter
const SSSIZE = 120;
const LENSE_OFFSET_X = SIZE / 10.2;
const LENSE_OFFSET_Y = SIZE / 10.2;
const items = ["Glass", "Magnify","Click","remove","Paynow","Pay Bills","Scan"];
var magnifying = false;

// document.querySelectorAll('img').forEach(image => { image.crossOrigin = 'Anonymous'; image.src += ' '; });

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

document.addEventListener('click', (event) => {
  // Identify the clicked element
  const clickedElement = document.elementFromPoint(event.clientX, event.clientY);
  const parentElement = clickedElement.parentElement.parentElement;
  let textContent = '';
    // Check if the element contains any text content
  if(clickedElement && clickedElement.innerText.trim() && clickedElement.classList[0] !== 'card-body' && clickedElement.classList[0] !== 'card'){

    textContent = clickedElement.innerText.trim();
  }
  else{
    if(parentElement && parentElement.innerText.trim() && parentElement.tagName !== 'BODY' && parentElement.tagName !== 'HTML'){
      console.log(parentElement.innerText.trim());
      textContent = parentElement.innerText.trim();
    }
  }


    // For debugging or use
    console.log("Captured Text:", textContent);

    // You could also pass this text to any function, e.g., performOCR(textContent);
    performOCR(textContent); // or any function handling the text
});

const performOCR = (textContent) => {
  const utterance = new SpeechSynthesisUtterance(textContent);
  utterance.lang = 'en-US'; // Set the language (optional)

  // Optional: Set additional properties
  utterance.pitch = 1; // Range: 0 to 2
  utterance.rate = 1; // Range: 0.1 to 10
  utterance.volume = 1; // Range: 0 to 1

  // Speak the text
  speechSynthesis.speak(utterance);
};

