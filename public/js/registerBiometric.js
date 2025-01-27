//import { startAuthentication, startRegistration } from 'https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@latest/dist/browser.bundle.min.js';
const { startRegistration,startAuthentication } = SimpleWebAuthnBrowser;
document.addEventListener('DOMContentLoaded',async ()=>{
    // token
    const loginUserId = sessionStorage.getItem('loginUserId');
    let user;

    async function getPasskey(userId){
      const response = await fetch(`/get-passkey?userId=${userId}`);
      if(response.ok){
        const text = await response.text();
        if (!text) {
            return null; // Return null if response body is empty
        }

        const passkey = JSON.parse(text); // Parse as JSON if the body is not empty
        return passkey;
      }
    }
    
    async function fetchUser(user_id) {
      try {
          const response = await fetch(`/users/${user_id}`);
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          user = await response.json();
          console.log(user);
  

      } catch (error) {
          console.error('Error fetching username:', error);
      }
    }
    await fetchUser(loginUserId);


    document.getElementById("register").addEventListener('click',async()=>{
      const passkey = await getPasskey(loginUserId);
      console.log(passkey);
      if(passkey){
        alert("Already registered!");
      }
      else{
        await generateAuth();
      }
      
    })

    async function generateAuth(){
      let email = user.email;
      const initResponse  = await fetch(`/generate-auth?email=${email}`,{credentials:"include"});
      const options = await initResponse.json();
      if(!initResponse.ok){
        console.log(options.error);
      }
      console.log(options);
      const registerJSON = await startRegistration( {optionsJSON:options} );
  
      const verifyResponse = await fetch('/verify-auth',{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerJSON)
      });
      const verifyJSON  = await verifyResponse.json();

      if(verifyJSON && verifyJSON.verified){
        console.log(verifyJSON);
        const newPasskey = {
          userId: user.user_id,
          webAuthnUserId: options.user.id,
          credId: verifyJSON.registrationInfo.credential.id,
          publicKey: verifyJSON.registrationInfo.credential.publicKey,
          counter: verifyJSON.registrationInfo.credential.counter,
          transports: verifyJSON.registrationInfo.credential.transports,
          deviceType: verifyJSON.registrationInfo.credentialDeviceType,
          backedUp: verifyJSON.registrationInfo.credentialBackedUp,
        }
        saveNewPasskey(newPasskey);
        alert("Registration Complete");
      }
      else{
        console.log("ERROR");
      }
    }

    async function saveNewPasskey(passkey){
      const saved = await fetch('/save-passkey',{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passkey)
      });
    }

});