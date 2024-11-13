document.addEventListener('DOMContentLoaded',()=>{
    const accessToken = 'IPXX73SWZKQ5S6QNJVYQIRKY6WXWW2LR';
    const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
    recognition.lang = 'en-US';
    const micButton = document.getElementById("mic");
    let voice = false;
    console.log(voice);
    console.log(localStorage.getItem("voice"));
    
    if(localStorage.getItem("voice") === "true"){
      console.log("zzz");
        voice = true;
    }
    else{
        voice = false;
    }
    
    if(window.location.pathname.endsWith("index.html")){
        micButton.addEventListener('click',()=>{
            voice = !voice;
            localStorage.setItem("voice",voice);
            console.log(localStorage.getItem("voice"));
            if(voice){  
                recognition.start();
            }
            else{
                recognition.stop();
            }
            
        });
    }


    if(window.location.pathname.endsWith("paynow.html")){
        if(localStorage.getItem("number")){
          console.log(localStorage.getItem("number"));
          document.getElementById("mobile").value = localStorage.getItem("number");
        }
        if(localStorage.getItem("amount")){
          document.getElementById("amount").value = localStorage.getItem("amount");
        }
        localStorage.removeItem("number");
        localStorage.removeItem("amount");
    };

    
    recognition.onstart=()=>{
      console.log("Listening..");
    }
    
    recognition.onresult=async(event)=>{
      const speech = event.results[0][0].transcript.toLowerCase();
      console.log(speech);
      let data;
      data = await sendToWitAi(speech);
        if(data.intents[0].confidence >= 0.9){
        if(data.intents[0].name === 'CheckBalance'){
            window.location.href = "account.html";
          }
          else if(data.intents[0].name == 'PayNow'){
            let amount;
            let receiver;
            localStorage.removeItem("amount");
            localStorage.removeItem("number");
            if (data.entities['wit$number:amount']) {
                amount = data.entities['wit$number:amount'][0].value;
            }
            else if (data.entities['wit$amount_of_money:amount_of_money']) {
              amount = data.entities['wit$amount_of_money:amount_of_money'][0].value;
            }
            if(data.entities['wit$phone_number:phone_number']){
              receiver = data.entities['wit$phone_number:phone_number'][0].value;
            }
            if(amount){
              localStorage.setItem("amount",amount);
            }
            if(receiver){
              localStorage.setItem("number",receiver);
            }
            window.location.href = "paynow.html";
          }
          else if(data.intents[0].name == "Limit"){
            window.location.href = "change-transcation-limit.html";
          }
          else if(data.intents[0].name == "Help"){
            window.location.href = "HelpNav.html";
          }
          else if(data.intents[0].name == "Guide"){
            window.location.href = "guide.html";
          }
          else if(data.intents[0].name == "Back"){
            window.history.back();
          };
    }
    };
    
    recognition.onend=()=>{
      console.log("End");
      if(voice){
        recognition.start();
      }
      
    }

    if(voice){
        recognition.start();
    }
    
    
    
    async function sendToWitAi(utterance) {
        const url = `https://api.wit.ai/message?v=20240901&q=${encodeURIComponent(utterance)}`;
    
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            console.log(data);  // Process data here
            return data;
        } catch (error) {
            console.error('Error:', error);
        }
    }
});
