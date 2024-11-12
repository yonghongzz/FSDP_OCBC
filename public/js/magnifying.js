document.addEventListener('DOMContentLoaded',async (e)=>{
  //defaults - not recommended to change
e.preventDefault();
const SCALE = 1.3; //magnification
const SIZE = 100; // diameter
const LENSE_OFFSET_X = SIZE / 10.2;
const LENSE_OFFSET_Y = SIZE / 10.2;

let magnifying = false;

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

});
