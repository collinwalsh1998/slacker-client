(function() {
    "use strict";

    window.cacheService = function() {};

    cacheService.prototype.cacheExists = function(name) {
        return localStorage.getItem(name) === null ? false : true;
    }

    cacheService.prototype.getCache = function(name) {
        if(!localStorage.getItem(name)) {
            return false;
        }

        var cacheData = localStorage.getItem(name);
        cacheData = LZString.decompressFromUTF16(cacheData);
        cacheData = JSON.parse(cacheData);
        return cacheData;
    }

    //cached data will always be set in an array. this makes it easy to update an already cached object
    cacheService.prototype.setCache = function(name, data, timeCached) {
        var cacheData = {};
        cacheData.data = data;
        cacheData.timeCached = timeCached;
        cacheData = JSON.stringify(cacheData);
        cacheData = LZString.compressToUTF16(cacheData);
        localStorage.setItem(name, cacheData);
    }

    cacheService.prototype.updateCache = function(name, newData, newTimeCached) {
        var cacheData = this.getCache(name);

        cacheData.data.push(newData);
        cacheData.timeCached = newTimeCached;

        cacheData = JSON.stringify(cacheData);
        cacheData = LZString.compressToUTF16(cacheData);
        localStorage.setItem(name, cacheData);
    }

    cacheService.prototype.clearCache = function() {
        localStorage.clear();
    }

    cacheService.prototype.cacheExpired = function(timeCached) {
        var ttl = Math.round((((+new Date() - +new Date(timeCached)) % 86400000) % 3600000) / 60000);
        return ttl >= 10 ? true : false;
    }
})();