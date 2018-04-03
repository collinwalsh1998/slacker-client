(function() {
    "use strict";

    var form;
    var formInputs;
    var errorContainer;
    var errorMessage;

    var CacheService = new cacheService();

    document.addEventListener("DOMContentLoaded", function() {
        form = document.getElementById("login-form");
        formInputs = document.querySelectorAll(".input-container input");
        errorContainer = document.getElementById("error-container");
        errorMessage = document.getElementById("error-message");

        form.addEventListener("submit", login);

        for(var i = 0; i < formInputs.length; i++) {
            formInputs[i].addEventListener("input", removeError);
        }
    });

    function login(event) {
        event.preventDefault();

        if(validateForm()) {
            var request = new XMLHttpRequest();
            var formData = {};

            for(var i = 0; i < formInputs.length; i++) {
                formData[formInputs[i].name] = formInputs[i].value;
            }

            request.open("POST", window.env.apiUrl + "/login", true);
            request.setRequestHeader('Content-Type', 'application/json');
            request.send(JSON.stringify(formData));

            request.onload = function() {
                var response = JSON.parse(request.responseText);

                if(request.status === 200) {
                    CacheService.setCache("user", response, new Date());
                    window.location.href = "/conversations";
                } else {
                    showError(response.message);
                }
            }

            request.onerror = function() {
                showError("An error occurred logging in");
            }
        }
    }

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

    function validateForm() {
        var valid = true;
        var emailInput = document.getElementById("email-input");
        var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        //check for empty fields
        for(var i = 0; i < formInputs.length; i++) {
            if(!formInputs[i].value) {
                valid = false;
                formInputs[i].classList.add("invalid");
            }
        }

        //check that email is valid
        if(!emailPattern.test(emailInput.value.toLowerCase())) {
            valid = false;
            emailInput.classList.add("invalid");
        }

        return valid;
    }
})();