document.addEventListener("DOMContentLoaded", function() {
    // Retrieve form elements if needed or add other form-related functionality here
    
    // Function to show the next step
    window.showNextStep = function(currentStepId, nextStepId) {
        // Hide the current step
        document.getElementById(currentStepId).style.display = 'none';
        
        // Show the next step
        document.getElementById(nextStepId).style.display = 'block';
    };
});
