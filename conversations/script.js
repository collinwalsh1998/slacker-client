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
    var createIcon;
    var createConversationContainer;
    var createUnderlay;

    var CacheService = new cacheService();
    var DateService = new dateService();
    var userData = CacheService.getCache("user");

    document.addEventListener("DOMContentLoaded", function() {
        conversationsContainer = document.getElementById("conversations-container");
        conversationUsers = document.getElementById("conversation-users");
        emailInput = document.getElementById("email-input");
        addEmailButton = document.getElementById("add-email");
        conversationForm = document.getElementById("create-conversation-form");
        errorContainer = document.getElementById("error-container");
        errorMessage = document.getElementById("error-message");
        createIcon = document.getElementById("create-icon-container");
        createConversationContainer = document.getElementById("create-conversation-container");
        createUnderlay = document.getElementById("create-underlay");

        getData();

        emailInput.addEventListener("input", removeError);
        addEmailButton.addEventListener("click", addEmail);
        conversationForm.addEventListener("submit", startCreateConversation);
        createIcon.addEventListener("click", openConversation);
        createUnderlay.addEventListener("click", closeConversation);
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

    function openConversation() {
        createUnderlay.classList.add("show");
        createConversationContainer.classList.add("show");
    }

    function closeConversation() {
        emailList = [];
        conversationUsers.innerHTML = "";
        emailInput.value = "";

        createUnderlay.classList.remove("show");
        createConversationContainer.classList.remove("show");
    }

    function startCreateConversation(event) {
        event.preventDefault();

        if(!emailList.length) {
            return;
        }

        //add current user into list of users in new conversation
        emailList.push(userData.data[0].email);
        
        createConversation().then(function(data) {
            closeConversation();

            if(CacheService.cacheExists("conversations")) {
                CacheService.updateCache("conversations", data.message, new Date());
            } else {
                CacheService.setCache("conversations", data.message, new Date());
            }

            addConversationsToDom(data.message);
        }).catch(function(error) {
            showError(error.message);
        });
    }

    function createConversation() {
        return new Promise(function(resolve, reject) {
            var request = new XMLHttpRequest();
            var formData = {
                emailList: emailList
            };

            request.open("POST", window.env.apiUrl + "/createConversation", true);
            request.setRequestHeader("Content-Type", "application/json");
            request.send(JSON.stringify(formData));

            request.onload = function() {
                var response = JSON.parse(request.responseText);

                if(request.status === 200) {
                    return resolve({ success: true, message: response });
                } else {
                    return reject({ success: false, message: response.message });
                }
            }

            request.onerror = function() {
                return reject({ success: false, message: "An error occurred creating the conversation" });
            }
        });
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
                //cache exists but is expired. currently, I have not decided a way to verify the expired cache before using it, so we will just us it for the time being and pull new data
                addConversationsToDom(conversationData.data);

                var lastConversationId = conversationData.data[conversationData.data.length - 1].conversation_id;
                getNewConversations(lastConversationId).then(function(data) {
                    if(!data.message.length) {
                        return;
                    }

                    CacheService.updateCache("conversations", data.message, new Date());
                    addConversationsToDom(data.message);
                }).catch(function(error) {
                    showError(error.message);
                });
            } else {
                //pull data from cache and then check for new data
                addConversationsToDom(conversationData.data);

                var lastConversationId = conversationData.data[conversationData.data.length - 1].conversation_id;
                getNewConversations(lastConversationId).then(function(data) {
                    if(!data.message.length) {
                        return;
                    }

                    CacheService.updateCache("conversations", data.message, new Date());
                    addConversationsToDom(data.message);
                }).catch(function(error) {
                    showError(error.message);
                });
            }
        } else {
            //there is no cache. get all conversation data from server
            getAllConversations().then(function(data) {
                if(!data.message.length) {
                    return;
                }

                CacheService.setCache("conversations", data.message, new Date());
                addConversationsToDom(data.message);
            }).catch(function(error) {
                showError(error.message);
            });
        }
    }

    function getAllConversations() {
        return new Promise(function(resolve, reject) {
            var userId = userData.data[0].user_id;
            var request = new XMLHttpRequest();

            request.open("GET", window.env.apiUrl + "/getAllConversations/" + userId, true);
            request.setRequestHeader("Content-Type", "application/json");
            request.send(null);

            request.onload = function() {
                var response = JSON.parse(request.responseText);

                if(request.status === 200) {
                    return resolve({ success: true, message: response });
                } else {
                    return reject({ success: false, message: response.message });
                }
            }

            request.onerror = function() {
                return reject({ success: false, message: "An error occurred getting conversations" });
            }
        });
    }

    function getNewConversations(conversationId) {
        return new Promise(function(resolve, reject) {
            var userId = userData.data[0].user_id;
            var request = new XMLHttpRequest();

            request.open("GET", window.env.apiUrl + "/getNewConversations/" + userId + "/" + conversationId, true);
            request.setRequestHeader("Content-Type", "application/json");
            request.send(null);

            request.onload = function() {
                var response = JSON.parse(request.responseText);

                if(request.status === 200) {
                    return resolve({ success: true, message: response });
                } else {
                    return reject({ success: false, message: response.message });
                }
            }

            request.onerror = function() {
                return reject({ success: false, message: "An error occurred getting conversations" });
            }
        });
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
                "<p class='conversation-timestamp'>" + DateService.formatDatetime(data[i].updated_at) + "</p>" +
            "</a>";

            conversationsContainer.appendChild(conversationContainer);
        }
    }
})();