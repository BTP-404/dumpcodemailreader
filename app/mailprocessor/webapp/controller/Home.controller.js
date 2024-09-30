sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.Home", {
        onInit: function () {
            // Retrieve the user model
            var oModel = sap.ui.getCore().getModel("userModel");
            if (!oModel) {
                console.error("User model not found."); // Log error if the model is not found
                return;
            }

            this.getView().setModel(oModel, "userModel");

            // Retrieve the userType from local storage and set it in the model if available
            var sUserType = localStorage.getItem("userType");
            if (sUserType) {
                oModel.setProperty("/userType", sUserType);
                console.log("User type retrieved from local storage:", sUserType); // Debugging log
            } else {
                console.warn("No userType found in local storage."); // Debugging log
            }

            // Attach route matched event
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteHomeDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Check the userType in the model to debug the visibility logic
            var userType = this.getView().getModel("userModel").getProperty("/userType");
            console.log("Current user type on route match:", userType); // Debugging log
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

            // Navigate to email configuration page
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

        // Function to store userType in local storage after login
        onLoginPress: function () {
            var sUserType = this.byId("userType").getSelectedItem().getText();

            // Store the userType in the model
            var oModel = this.getView().getModel("userModel");
            oModel.setProperty("/userType", sUserType);

            // Persist userType in local storage
            localStorage.setItem("userType", sUserType);
            console.log("User type set in local storage:", sUserType); // Debugging log
        },

        onInvoiceApp: function() {
            this.getOwnerComponent().getRouter().navTo("RouteInvoiceApp");
        },

        // Optional logout functionality to clear userType from local storage and model
        onLogout: function () {
            var oModel = sap.ui.getCore().getModel("userModel");
            oModel.setProperty("/userType", ""); // Clear model
            localStorage.removeItem("userType"); // Clear local storage
            console.log("User type cleared on logout."); // Debugging log
        }
    });
});
