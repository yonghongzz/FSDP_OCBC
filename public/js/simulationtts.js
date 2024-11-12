document.addEventListener('DOMContentLoaded',()=>{
    let isSpeaking = false;
    let text;
    let canSpeak = false;
    const button = document.querySelector('.okay-button');
    let steps = 2;

    if(localStorage.getItem("tts") === "true"){
        canSpeak = true;
        console.log("canspeak");
    }
    else{
        canSpeak = false;
    }

    button.addEventListener('click',()=>{
        speechSynthesis.cancel();
    })

    const stepsElement = document.querySelector('.steps-body');
      
      const performTTS = async(textContent) => {
        let utterance;
        speechSynthesis.cancel();
        utterance = new SpeechSynthesisUtterance(textContent);
        
      
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

      if(stepsElement){
        text = stepsElement.textContent.trim();
    }
    
    if(canSpeak){
        if(!isSpeaking){
            isSpeaking = true;
            performTTS(text); // or any function handling the text
        }
    }

    if (window.location.pathname.endsWith("stp-scanQR.html")) {
        button.addEventListener('click',()=>{
            if(steps == 2){
                text = document.getElementById('step2').textContent.trim();
                performTTS(text);
                steps = 3;
            }
        });
    }
});