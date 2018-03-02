(function() {
    "use strict";

    var form;
    var formInputs;

    document.addEventListener("DOMContentLoaded", function() {
        form = document.getElementById("create-form");
        formInputs = document.querySelectorAll(".input-container input");

        form.addEventListener("submit", createAccount);

        for(var i = 0; i < formInputs.length; i++) {
            formInputs[i].addEventListener("input", removeError);
        }
    });

    function createAccount(event) {
        event.preventDefault();

        if(validateForm()) {
            var request = new XMLHttpRequest();
            var formData = {};

            for(var i = 0; i < formInputs.length; i++) {
                formData[formInputs[i].name] = formInputs[i].value;
            }

            request.open("POST", window.env.apiUrl + "/", true);
            request.setRequestHeader('Content-Type', 'application/json');
            request.send(JSON.stringify(formData));

            request.onload = function() {
                if(request.status === 200) {
                    var response = JSON.parse(request.responseText);
                    console.log(response);
                } else {
                    console.error("error");
                }
            }

            request.onerror = function() {
                console.error("error");
            }
        }
    }

    function removeError() {
        this.classList.remove("invalid");
    }

    function validateForm() {
        var valid = true;
        var emailInput = document.getElementById("email-input");
        var passwordInput = document.getElementById("password-input");
        var passwordAgainInput = document.getElementById("password-again-input");
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

        //check that passwords match
        if(passwordInput.value !== passwordAgainInput.value) {
            valid = false;
            passwordAgainInput.classList.add("invalid");
        }

        return valid;
    }
})();