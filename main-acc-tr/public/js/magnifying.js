document.addEventListener('DOMContentLoaded',(e)=>{
  //defaults - not recommended to change
e.preventDefault();
const SCALE = 1.3; //magnification
const SIZE = 100; // diameter
const LENSE_OFFSET_X = SIZE / 10.2;
const LENSE_OFFSET_Y = SIZE / 10.2;
let items = [];
const accountNumber = document.querySelector('.account-number').textContent;
items.push(accountNumber);
let magnifying = false;

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
  document.addEventListener("pointermove", moveMagnifyingGlass);
  const bodyClone = document.body.cloneNode(true);
  bodyClone.classList.add("body-clone");
  bodyClone.style.top = "0px";
  bodyClone.style.left = "0px";
  magnifyingGlass.append(bodyClone);
  document.body.append(handle);
};

magnifyButton.addEventListener("click", ()=>{
  magnifying = !magnifying;
  if(magnifying){
    addMagnifyingGlass();
  }
  else{
    removeMagnifyingGlass();
  }
});

const moveMagnifyingGlass = (event) => {
  event.preventDefault();
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
    let offsetX = baseOffsetX - pointerX * SCALE +10 * (viewportWidth / 288); // Normalized to 1920px width
    let offsetY = baseOffsetY - pointerY * SCALE +30 * (viewportHeight / 605); // Normalized to 1080px height
    
    // Apply position with scaling compensation
    magnifyingGlass.children[0].style.left = `${offsetX}px`;
    magnifyingGlass.children[0].style.top = `${offsetY}px`;
  }
};


const removeMagnifyingGlass = () => {
  document.removeEventListener("pointermove", moveMagnifyingGlass);
  if (magnifyingGlass.children.length > 0) {
    magnifyingGlass.children[0].remove();
  }
  handle.remove();
};



document.addEventListener('click', (event) => {
  // Identify the clicked element
  const clickedElement = document.elementFromPoint(event.clientX, event.clientY);
  const parentElement = clickedElement.parentElement.parentElement;
  let textContent = '';
    // Check if the element contains any text content
  if(clickedElement && clickedElement.innerText.trim() && clickedElement.classList[0] !== 'info' && !clickedElement.classList.contains('blockquote')){
    textContent = clickedElement.innerText.trim();
  }
  // else{
  //   if(parentElement && parentElement.innerText.trim() && parentElement.tagName !== 'BODY' && parentElement.tagName !== 'HTML'){
  //     console.log(clickedElement.classList[0]);
  //     const txtAround = "Text around is, ";
  //     textContent = txtAround + parentElement.innerText.trim();
  //   }
  // }


    // For debugging or use
    console.log("Captured Text:", textContent);

    // You could also pass this text to any function, e.g., performOCR(textContent);
    performOCR(textContent); // or any function handling the text
});

const performOCR = (textContent) => {
  let utterance;
  let sentiveInfo = false;
  const splitText = textContent.split('\n');
  splitText.forEach(element => {
    if(items.includes(element.trim())){
      sentiveInfo = true;
    }
  });
  if(sentiveInfo){
    utterance = new SpeechSynthesisUtterance("Sensitive Information");
  }
  else{
    utterance = new SpeechSynthesisUtterance(textContent);
  }

  utterance.lang = 'en-US'; // Set the language (optional)

  // Optional: Set additional properties
  utterance.pitch = 1; // Range: 0 to 2
  utterance.rate = 1; // Range: 0.1 to 10
  utterance.volume = 1; // Range: 0 to 1

  // Speak the text
  speechSynthesis.speak(utterance);
};
document.addEventListener('pointerdown', (event) => {
  if (magnifying) {
    event.preventDefault(); // Prevent default action when magnifying
  }
});
});
