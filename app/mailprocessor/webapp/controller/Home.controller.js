sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.Home", {
        onInit: function () {
 
        },

        onHomeSelect: function () {
            this.getOwnerComponent().getRouter().navTo("RouteHomeDetail");
        },

        onEmailConfigSelect: function () {
            this._showTermsDialog();
        },

        _showTermsDialog: function () {
            var oView = this.getView();
            var oDialog = oView.byId("termsDialog");

            if (!oDialog) {
                oDialog = sap.ui.xmlfragment(oView.getId(), "com.mailprocessor.fragments.TermsDialog", this);
                oView.addDependent(oDialog);
            }
            
            oDialog.open();
        },

        onAcceptTermsPress: function () {
            var oDialog = this.getView().byId("termsDialog");
            if (oDialog) {
                oDialog.close();
            }
            this.getOwnerComponent().getRouter().navTo("RouteEmailAccountConfiguration");
        },

        onCancelTermsPress: function () {
            var oDialog = this.getView().byId("termsDialog");
            if (oDialog) {
                oDialog.close();
            }
            MessageToast.show("You need to accept the terms to proceed.");
            this.getOwnerComponent().getRouter().navTo("RouteHomeDetail");
        },

        onEmailReaderLog: function () {
            this.getOwnerComponent().getRouter().navTo("RouteEmailReaderLog");
        },

        onEmailProcessor: function () {
            this.getOwnerComponent().getRouter().navTo("RouteEmailProcessor");
        },

        onMailBox: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMailBox");
        },

        onEmailReaderPress: function () {
            this.getOwnerComponent().getRouter().navTo("RouteConfiguredMail");
        },

        onInvoiceApp: function () {
            this.getOwnerComponent().getRouter().navTo("RouteInvoiceApp");
        },

        // Function to store userType and login status after successful login
        onLoginPress: function () {
            var sUserType = this.byId("userType").getSelectedItem().getText();
            var sUsername = this.byId("username").getValue();
            var sPassword = this.byId("password").getValue();

            if (!sUsername || !sPassword) {
                MessageToast.show("Please enter both username and password.");
                return;
            }

            if (!sUserType) {
                MessageToast.show("Please select a user type.");
                return;
            }

            var oModel = this.getView().getModel("userModel");
            oModel.setProperty("/userType", sUserType);
            oModel.setProperty("/isLoggedIn", true); // Set login status to true

            // Store the userType and login status in localStorage
            localStorage.setItem("userType", sUserType);
            localStorage.setItem("isLoggedIn", "true");

            console.log("User type and login status set in local storage and model:", sUserType);

            // Navigate to the appropriate page based on userType
            if (sUserType === "Admin") {
                this.getOwnerComponent().getRouter().navTo("RouteEmailAccountConfiguration");
            } else if (sUserType === "User") {
                this.getOwnerComponent().getRouter().navTo("RouteConfiguredMail");
            }
        },

        // Logout functionality to clear userType and login status
        onLogout: function () {
            var oModel = sap.ui.getCore().getModel("userModel");
            oModel.setProperty("/userType", ""); // Clear model
            oModel.setProperty("/isLoggedIn", false); // Set login status to false
            localStorage.removeItem("userType"); // Clear userType from local storage
            localStorage.setItem("isLoggedIn", "false"); // Clear login status in local storage
            console.log("User type and login status cleared on logout.");

            // Navigate to login page
            this.getOwnerComponent().getRouter().navTo("RouteHomeDetail");
        }
    });
});
