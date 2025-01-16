


//import { startAuthentication, startRegistration } from 'https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@latest/dist/browser.bundle.min.js';
const { startRegistration,startAuthentication } = SimpleWebAuthnBrowser;
document.addEventListener('DOMContentLoaded',async ()=>{
    // token
    const loginUserId = sessionStorage.getItem('loginUserId');
    let user;
    

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
      await generateAuth();
    })

    const SERVER_URL = "http://localhost:3000";
    async function generateAuth(){
      let email = user.email;
      const initResponse  = await fetch(`/generate-auth?email=${email}`,{credentials:"include"});
      const options = await initResponse.json();
      if(!initResponse.ok){
        console.log(options.error);
      }
      console.log(options);
      //document.getElementById("check").innerHTML = "DOne";
      const registerJSON = await startRegistration( {optionsJSON:options} );
      document.getElementById("check").innerHTML = "DOne";
  
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
    document.getElementById("get").addEventListener('click',async()=>{
      getPasskey(user.user_id);
    })
    
    async function getPasskey(userId){
      const response = await fetch(`/get-passkey?userId=${userId}`);
      if(response.ok){
        const passkey = await response.json();
        return passkey;
      }
    }

    async function authenticateAuth(userId){
      console.log(userId);
      const passkey = await getPasskey(userId);
      const resp = await fetch(`/generate-authentication-options?userId=${userId}`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passkey),
      });
      const options = await resp.json();
      console.log(options);
      let asseResp;
      try{
        asseResp = await startAuthentication({ optionsJSON: options, useBrowserAutofill: false });
        console.log(asseResp);
      }catch(error){
        console.log(error);
      }



      const body = {
        asseResp,
        passkey,
      }
      console.log(passkey);

      const verificationResp = await fetch(`/verify-authentication`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const verificationJSON = await verificationResp.json();
      console.log(verificationJSON);
      if(verificationJSON && verificationJSON.verified){
        console.log("Success");
        console.log(verificationJSON);
        updateCounter(passkey,verificationJSON.authenticationInfo.newCounter);
      }
    }

    document.getElementById("verify").addEventListener('click',async ()=>{
      console.log(user.user_id);
      authenticateAuth(user.user_id);
    });

    async function updateCounter(passkey,newCounter){
      passkey.counter = newCounter;
      const updatePasskeyCounter = await fetch('/update-counter',{
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passkey),
      });

    }

})