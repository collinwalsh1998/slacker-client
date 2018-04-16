(function() {
    "use strict";

    var errorContainer;
    var errorMessage;
    var messagesContainer;
    var messageInput;
    var messageForm;
    var threadId = getUrlParameter("id");

    var CacheService = new cacheService();
    var DateService = new dateService();
    var userData = CacheService.getCache("user");

    document.addEventListener("DOMContentLoaded", function() {
        errorContainer = document.getElementById("error-container");
        errorMessage = document.getElementById("error-message");
        messagesContainer = document.getElementById("messages-container");
        messageInput = document.getElementById("message-input");
        messageForm = document.getElementById("new-message-form");

        getData();

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

    function getData() {
        if(CacheService.cacheExists(threadId)) {
            var messageData = CacheService.getCache(threadId);

            if(CacheService.cacheExpired(messageData.timeCached)) {
                //cache exists but is expired. currently, I have not decided a way to verify the expired cache before using it, so we will just us it for the time being and pull new data
                addMessagesToDom(messageData.data);

                /*var lastMessageId = messageData.data[messageData.data.length - 1].message_id;
                getNewMessages(lastMessageId);*/
            } else {
                //pull data from cache and then check for new data
                addMessagesToDom(messageData.data);

                /*var lastMessageId = messageData.data[messageData.data.length - 1].message_id;
                getNewMessages(lastMessageId);*/
            }
        } else {
            //there is no cache. get all message data from server
            getAllMessages();
        }
    }

    function getAllMessages() {
        var request = new XMLHttpRequest();

        request.open("GET", window.env.apiUrl + "/getAllMessages/" + threadId, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(null);

        request.onload = function() {
            var response = JSON.parse(request.responseText);

            if(request.status === 200) {
                if(!response.length) {
                    return;
                }

                CacheService.setCache(threadId, response, new Date());
                addMessagesToDom(response);
            } else {
                showError(response.message);
            }
        }

        request.onerror = function() {
            showError("An error occurred getting all messages");
        }
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
                if(CacheService.cacheExists(threadId)) {
                    CacheService.updateCache(threadId, response, new Date());
                } else {
                    CacheService.setCache(threadId, response, new Date());
                }

                messageInput.innerText = "";

                addMessagesToDom(response);
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

    function addMessagesToDom(data) {
        for(var i = 0; i < data.length; i++) {
            var messageContainer = document.createElement("div");
            messageContainer.classList.add("message");

            if(data[i].sender[0].email == userData.data[0].email) {
                messageContainer.classList.add("send");
            } else {
                messageContainer.classList.add("receive");
            }

            messageContainer.innerHTML =
            "<p class='message-content'>" + data[i].message + "</p>" +
            "<p class='message-timestamp'>" + DateService.formatDatetime(data[i].created_at) + "</p>";

            messagesContainer.appendChild(messageContainer);
        }
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