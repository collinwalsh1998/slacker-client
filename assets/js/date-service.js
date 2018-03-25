(function() {
    "use strict";

    window.dateService = function() {};
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    dateService.prototype.formatDatetime = function(dateString) {
        return this.formatDate(dateString) + " - " + this.formatTime(dateString);
    }

    dateService.prototype.formatDate = function(dateString) {
        var newDate = new Date(dateString);
        return months[newDate.getMonth()] + " " + newDate.getDate() + ", " + newDate.getFullYear();
    }

    dateService.prototype.formatTime = function(dateString) {
        var newDate = new Date(dateString);
        var hours = newDate.getHours();
        var minutes = newDate.getMinutes();
        var period = hours >= 12 ? "PM" : "AM";

        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        
        return hours + ":" + minutes + " " + period;
    }
})();