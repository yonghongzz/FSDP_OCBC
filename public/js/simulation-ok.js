document.addEventListener("DOMContentLoaded", function() {
    // Function to show the next step
    window.showNextStep = function(currentStepId, nextStepId) {
        // Ensure the current step exists and hide it
        const currentStep = document.getElementById(currentStepId);
        if (currentStep) {
            currentStep.style.display = 'none';
        }
        
        // Ensure the next step exists and show it
        const nextStep = document.getElementById(nextStepId);
        if (nextStep) {
            nextStep.style.display = 'block';
        }
    };

    window.showNextStep = function(currentStepId, nextStepId) {
        // Ensure the current step exists and hide it
        const currentStep = document.getElementById(currentStepId);
        if (currentStep) {
            currentStep.style.display = 'none';
        }
        
        // Ensure the next step exists and show it
        const nextStep = document.getElementById(nextStepId);
        if (nextStep) {
            nextStep.style.display = 'block';
        }
    };
});
