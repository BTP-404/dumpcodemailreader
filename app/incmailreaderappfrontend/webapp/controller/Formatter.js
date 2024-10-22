sap.ui.define([], function() {
    return {
        formatEmail: function(sValue) {
            if (sValue) {
               
                var emailMatch = sValue.match(/<([^>]+)>/);
                return emailMatch ? emailMatch[1] : sValue; 
            }
            return sValue;
        }
    };
});