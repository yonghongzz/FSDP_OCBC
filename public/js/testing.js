//import { startAuthentication, startRegistration } from 'https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@latest/dist/browser.bundle.min.js';
const { startRegistration } = SimpleWebAuthnBrowser;
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
        console.log("Success");
      }
      else{
        console.log("ERROR");
      }
    }
    

})