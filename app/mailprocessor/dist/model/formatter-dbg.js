sap.ui.define([], function () {
    "use strict";

    return {
        isVisibleForUser: function (sUserType, sItemKey) {
            // Visibility rules for the Login Page
            if (!sUserType) {
                // On Login Page, only "Home" should be visible
                return sItemKey === "home";
            }

            // Visibility rules for Admin
            if (sUserType === "Admin") {
                // All items except "Home" should be visible for Admin
                return sItemKey !== "home";
            }

            // Visibility rules for User
            if (sUserType === "User") {
                // "Home" and "Email Accounts Configuration" should be hidden for User
                return sItemKey !== "home" && sItemKey !== "emailAccountsConfig";
            }

            // Default to hiding items if no conditions are met
            return false;
        }
    };
});
