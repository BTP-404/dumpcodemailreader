sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageToast',
    'sap/ui/core/Fragment',
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, Fragment, JSONModel) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.HomeDetail", {
        // Initialize the model globally
        onInit: function () {
            var oModel = sap.ui.getCore().getModel("userModel");
            if (!oModel) {
                oModel = new JSONModel({
                    userType: "" // Default value
                });
                sap.ui.getCore().setModel(oModel, "userModel");
            }
        },

        // On Login press, capture and store the selected user type
        onLoginPress: function () {
            // Get user input
            var oUserTypeComboBox = this.byId("userType");
            var sUserType = oUserTypeComboBox.getSelectedItem() ? oUserTypeComboBox.getSelectedItem().getText() : "";
            var sUsername = this.byId("username").getValue();
            var sPassword = this.byId("password").getValue();

            // Get the global userModel
            var oModel = sap.ui.getCore().getModel("userModel");

            // Check if user type is selected
            if (!sUserType) {
                MessageToast.show("Please select a user type.");
                return; // Exit the function if user type is not selected
            }

            // Store the selected user type in the global model
            oModel.setProperty("/userType", sUserType);

            // Authentication logic (this is just for demonstration, modify as needed)
            if (sUsername && sPassword) {
                if (sUserType === "Admin") {
                    MessageToast.show("Logged in as Admin.");
                    this._navigateTo("RouteEmailAccountConfiguration", sUserType);
                } else if (sUserType === "User") {
                    MessageToast.show("Logged in as User.");
                    this._navigateTo("RouteConfiguredMail", sUserType);
                } else {
                    MessageToast.show("Invalid user type selected.");
                }
            } else {
                MessageToast.show("Please enter both username and password.");
            }
        },

        // Function to handle navigation after login
        _navigateTo: function (sRouteName, sUserType) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo(sRouteName, {
                userType: sUserType
            });
        },

        _showTermsDialog: function () {
            var oView = this.getView();
            if (!this._oTermsDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.mailprocessor.fragments.TermsDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oTermsDialog = oDialog;
                    oView.addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oTermsDialog.open();
            }
        },

        onAcceptTermsPress: function () {
            if (this._oTermsDialog) {
                this._oTermsDialog.close();
            }

            var oModel = this.getView().getModel("userModel");
            var sUserType = oModel.getProperty("/userType");
            this._oTermsDialog.open();
            this._navigateTo("RouteEmailAccountConfiguration", sUserType);
        },

        onCancelTermsPress: function () {
            if (this._oTermsDialog) {
                this._oTermsDialog.close();
            }

            MessageToast.show("You need to accept the terms to proceed.");
            this._navigateTo("home");
        }
    });
});
