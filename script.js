(function() {
    "use strict";

    var form;
    var formInputs;

    document.addEventListener("DOMContentLoaded", function() {
        form = document.getElementById("login-form");
        formInputs = document.querySelectorAll(".input-container input");

        form.addEventListener("submit", login);

        for(var i = 0; i < formInputs.length; i++) {
            formInputs[i].addEventListener("input", removeError);
        }
    });

    function login(event) {
        event.preventDefault();

        var errorContainer = document.getElementById("error-container");
        var errorMessage = document.getElementById("error-message");

        //reset error elements when the user attempts to login
        errorContainer.classList.remove("show");
        errorMessage.textContent = "";

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
                    localStorage.setItem("user", request.responseText);
                    window.location.href = "/conversations";
                } else {
                    errorMessage.textContent = response.message;
                    errorContainer.classList.add("show");
                }
            }

            request.onerror = function() {
                errorMessage.textContent = "An error occurred logging in";
                errorContainer.classList.add("show");
            }
        }
    }

    function removeError() {
        this.classList.remove("invalid");
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