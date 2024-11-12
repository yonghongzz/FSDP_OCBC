document.addEventListener('DOMContentLoaded',()=>{
    let canSpeak = false;
    let isSpeaking = false;
    const voiceButton = document.getElementById("voice");
    if(localStorage.getItem("tts") === "true"){
        canSpeak = true;
        console.log("canspeak");
    }
    else{
        canSpeak = false;
    }

    if(voiceButton){
        voiceButton.addEventListener("click",()=>{
            canSpeak = !canSpeak;
            localStorage.setItem("tts",canSpeak);
        });
    }

    let items = [];
    const updateSensitiveInfo = () =>{
    items = [];
    const accountNumberElement = document.querySelector('.account-number');
    const debitCard = document.querySelector('.debit-cardnum');
    if (accountNumberElement) {
        const accountNumber = accountNumberElement.textContent.trim();
        items.push(accountNumber);
        }
    if(debitCard){
        const debitNumber = debitCard.textContent.trim();
        items.push(debitNumber);
        }
    }
    document.addEventListener('click', (event) => {
        if(canSpeak){
          // Identify the clicked element
          const clickedElement = document.elementFromPoint(event.clientX, event.clientY);
          console.log(clickedElement.classList[0]);
          let textContent = '';
            // Check if the element contains any text content
          console.log(clickedElement.classList[0]);
          if(clickedElement && clickedElement.innerText.trim() && clickedElement.classList[0] !== 'info' && !clickedElement.classList.contains('card-body')){
            textContent = clickedElement.innerText.trim();
          }
      
      
            // For debugging or use
            console.log("Captured Text:", textContent);
            
      
            // You could also pass this text to any function, e.g., performOCR(textContent);
            if(!isSpeaking){
              isSpeaking = true;
              performTTS(textContent); // or any function handling the text
            }
            
        }
      });
      
      const performTTS = async(textContent) => {
        updateSensitiveInfo();
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
        setTimeout(function() {
          isSpeaking = false;
        }, 1000);
    };

    window.addEventListener('beforeunload', () => {
        speechSynthesis.cancel();
    });
});