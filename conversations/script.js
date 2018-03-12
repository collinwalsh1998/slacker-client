(function() {
    "use strict";

    var conversationUsers;
    var emailInput;
    var addEmailButton;
    var conversationForm;
    var emailList = [];

    document.addEventListener("DOMContentLoaded", function() {
        conversationUsers = document.getElementById("conversation-users");
        emailInput = document.getElementById("email-input");
        addEmailButton = document.getElementById("add-email");
        conversationForm = document.getElementById("create-conversation-form");

        emailInput.addEventListener("input", removeError);
        addEmailButton.addEventListener("click", addEmail);
        conversationForm.addEventListener("submit", createConversation);
    });

    function removeError() {
        this.classList.remove("invalid");
    }

    function addEmail() {
        //validate email before adding it to the conversation list
        if(validateForm()) {
            var email = emailInput.value.trim();

            //if the email is already in the conversation list then don't add it again
            if(emailList.indexOf(email) > -1) {
                emailInput.value = "";
                return;
            }

            emailList.push(email);

            //add the new email element to the DOM
            var userContainer = document.createElement("div");
            userContainer.classList.add("user");
            userContainer.innerHTML =
            "<p class='user-email'>" + email + "</p>" +
            "<i class='fa fa-times'></i>";

            conversationUsers.appendChild(userContainer);
            userContainer.querySelector(".fa").addEventListener("click", removeEmail);
            emailInput.value = "";
        }
    }

    function removeEmail(event) {
        var container = event.srcElement.parentElement;

        //remove the email from the conversation list
        var index = emailList.indexOf(container.querySelector(".user-email").textContent);
        emailList.splice(index, 1);

        container.parentNode.removeChild(container);
    }

    function createConversation(event) {
        event.preventDefault();

        if(!emailList.length) {
            return;
        }

        var errorContainer = document.getElementById("error-container");
        var errorMessage = document.getElementById("error-message");

        //reset error elements when the user attempts to create a conversation
        errorContainer.classList.remove("show");
        errorMessage.textContent = "";

        var request = new XMLHttpRequest();
        var formData = {
            emailList: emailList
        };

        request.open("POST", window.env.apiUrl + "/createConversation", true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSON.stringify(formData));

        request.onload = function() {
            var response = JSON.parse(request.responseText);

            if(request.status === 200) {
                console.log("added conversation");
            } else {
                errorMessage.textContent = response.message;
                errorContainer.classList.add("show");
            }
        }

        request.onerror = function() {
            errorMessage.textContent = "An error occurred creating conversation";
            errorContainer.classList.add("show");
        }
    }

    function validateForm() {
        var valid = true;
        var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if(!emailInput.value || !emailPattern.test(emailInput.value.trim())) {
            valid = false;
            emailInput.classList.add("invalid");
        }

        return valid;
    }
})();