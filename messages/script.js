(function() {
    "use strict";

    var errorContainer;
    var errorMessage;
    var messageInput;
    var messageForm;
    var threadId = getUrlParameter("id");

    var CacheService = new cacheService();
    var DateService = new dateService();
    var userData = CacheService.getCache("user");

    document.addEventListener("DOMContentLoaded", function() {
        errorContainer = document.getElementById("error-container");
        errorMessage = document.getElementById("error-message");
        messageInput = document.getElementById("message-input");
        messageForm = document.getElementById("new-message-form");

        messageInput.addEventListener("input", removeError);
        messageForm.addEventListener("submit", sendMessage);
    });

    function removeError() {
        this.classList.remove("invalid");
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.classList.add("show");
        setTimeout(hideError, 5000);
    }

    function hideError() {
        errorMessage.textContent = "";
        errorContainer.classList.remove("show");
    }

    function sendMessage(event) {
        event.preventDefault();

        if(!validateMessage()) {
            return;
        }

        var request = new XMLHttpRequest();
        var formData = {
            thread_id: threadId,
            sender: userData.data[0].email,
            message: messageInput.innerText
        };
        
        request.open("POST", window.env.apiUrl + "/sendMessage", true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSON.stringify(formData));

        request.onload = function() {
            var response = JSON.parse(request.responseText);

            if(request.status === 200) {
                
            } else {
                showError(response.message);
            }
        }

        request.onerror = function() {
            showError("An error occurred sending the message");
        }
    }

    
    function validateMessage() {
        var valid = true;

        if(!messageInput.innerText) {
            valid = false;
            messageInput.classList.add("invalid");
        }

        return valid;
    }

    function getUrlParameter(name) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        var results = regex.exec(window.location.href);
        if(!results) return null;
        if(!results[2]) return "";
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
})();