(function() {
    "use strict";

    var conversationsContainer;
    var conversationUsers;
    var emailInput;
    var addEmailButton;
    var conversationForm;
    var emailList = [];
    var errorContainer;
    var errorMessage;

    var CacheService = new cacheService();
    var userData = CacheService.getCache("user");

    document.addEventListener("DOMContentLoaded", function() {
        conversationsContainer = document.getElementById("conversations-container");
        conversationUsers = document.getElementById("conversation-users");
        emailInput = document.getElementById("email-input");
        addEmailButton = document.getElementById("add-email");
        conversationForm = document.getElementById("create-conversation-form");
        errorContainer = document.getElementById("error-container");
        errorMessage = document.getElementById("error-message");

        getData();

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

        //reset error elements when the user attempts to create a conversation
        errorContainer.classList.remove("show");
        errorMessage.textContent = "";

        //add current user into list of users in new conversation
        emailList.push(userData.data[0].email);

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
                emailList.length = [];
                conversationUsers.innerHTML = "";

                if(CacheService.cacheExists("conversations")) {
                    CacheService.updateCache("conversations", response, new Date());
                } else {
                    CacheService.setCache("conversations", response, new Date());
                }

                addConversationsToDom(response);
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

    function getData() {
        if(CacheService.cacheExists("conversations")) {
            var conversationData = CacheService.getCache("conversations");

            if(CacheService.cacheExpired(conversationData.timeCached)) {
                //cache exists but is expired. verify data and pull any new data
                console.log("cache exists but is expired. verify data and pull any new data");
            } else {
                //cache exists. pull from that and then check for new data
                console.log("cache exists. pull from that and then check for new data");

                var lastConversationId = conversationData.data[conversationData.data.length - 1].conversation_id;
                getNewConversations(lastConversationId);

                //add existing cache into the DOM
                addConversationsToDom(conversationData.data);
            }
        } else {
            console.log("get all data");
            //get all data
            getAllConversations();
        }
    }

    function getAllConversations() {
        var userId = userData.data[0].user_id;
        var request = new XMLHttpRequest();

        request.open("GET", window.env.apiUrl + "/getAllConversations/" + userId, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(null);

        request.onload = function() {
            var response = JSON.parse(request.responseText);

            if(request.status === 200) {
                CacheService.setCache("conversations", response, new Date());
                addConversationsToDom(response);
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

    function getNewConversations(conversationId) {
        var request = new XMLHttpRequest();

        request.open("GET", window.env.apiUrl + "/getNewConversations/" + conversationId, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(null);

        request.onload = function() {
            var response = JSON.parse(request.responseText);

            if(request.status === 200) {
                CacheService.updateCache("conversations", response, new Date());
                addConversationsToDom(response);
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

    function addConversationsToDom(data) {
        for(var i = 0; i < data.length; i++) {
            var userEmails = "";

            for(var j = 0; j < data[i].users.length; j++) {
                if(j == (data[i].users.length - 1)) {
                    userEmails += data[i].users[j].email;
                    break;
                }

                userEmails += data[i].users[j].email + ", ";
            }

            var conversationContainer = document.createElement("div");
            conversationContainer.classList.add("conversation");
            conversationContainer.innerHTML =
            "<a class='conversation-link' href='/messages?id=" + data[i].conversation_id + "'>" +
                "<h2 class='conversation-users'>" + userEmails + "</h2>" +
                "<p class='conversation-timestamp'>" + data[i].updated_at + "</p>" +
            "</a>";

            conversationsContainer.appendChild(conversationContainer);
        }
    }
})();