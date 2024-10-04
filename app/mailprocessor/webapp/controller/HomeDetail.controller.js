sap.ui.define([ 
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, Fragment, JSONModel) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.HomeDetail", {
      onInit: function () {
    var oModel = sap.ui.getCore().getModel("userModel");
    if (!oModel) {
        oModel = new sap.ui.model.json.JSONModel({ userType: "", isLoggedIn: false });
        sap.ui.getCore().setModel(oModel, "userModel");
    }

    this.getView().setModel(oModel, "userModel");

    var sUserType = localStorage.getItem("userType");
    var bIsLoggedIn = localStorage.getItem("isLoggedIn") === "true"; // Retrieve login status
    if (sUserType && bIsLoggedIn) {
        oModel.setProperty("/userType", sUserType);
        oModel.setProperty("/isLoggedIn", bIsLoggedIn);
        console.log("User type and login status retrieved from local storage:", sUserType, bIsLoggedIn);
    } else {
        // When user is not logged in or userType is empty, keep the default model values
        console.warn("No userType or not logged in found in local storage.");
        oModel.setProperty("/userType", ""); // Set empty userType
        oModel.setProperty("/isLoggedIn", false); // Ensure the model reflects not logged in
    }
}
,

        onLoginPress: function () {
            // Get the user input data
            var sUsername = this.byId("username").getValue();
            var sPassword = this.byId("password").getValue();
            var sUserType = this.byId("userType").getSelectedKey();

            // Input validation
            if (!sUserType) {
                MessageToast.show("Please select a user type.");
                return;
            }

            if (!sUsername || !sPassword) {
                MessageToast.show("Please enter both username and password.");
                return;
            }

            // Assuming successful login, update the model
            var oModel = this.getView().getModel("userModel");
            oModel.setProperty("/userType", sUserType);
            oModel.setProperty("/isLoggedIn", true);

            // Store login details in localStorage for persistence
            localStorage.setItem("userType", sUserType);
            localStorage.setItem("isLoggedIn", "true");

            MessageToast.show("Login successful!");

            // Navigate based on user type
            if (sUserType === "Admin") {
                this._navigateTo("RouteEmailAccountConfiguration", sUserType);
            } else if (sUserType === "User") {
                this._navigateTo("RouteConfiguredMail", sUserType);
            }
        },

        onLogout: function () {
            // Clear login state
            var oModel = this.getView().getModel("userModel");
            oModel.setProperty("/userType", "");
            oModel.setProperty("/isLoggedIn", false);

            // Clear localStorage data
            localStorage.removeItem("userType");
            localStorage.removeItem("isLoggedIn");

            MessageToast.show("Logged out successfully!");

            // Redirect to login page
            this.getOwnerComponent().getRouter().navTo("RouteLogin");
        },

        onForgotPasswordPress: function () {
            MessageToast.show("Forgot password clicked!");
            // You can navigate to a forgot password page here
        },

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
            this._navigateTo("RouteEmailAccountConfiguration", sUserType);
        },

        onCancelTermsPress: function () {
            if (this._oTermsDialog) {
                this._oTermsDialog.close();
            }
            MessageToast.show("You need to accept the terms to proceed.");
            this._navigateTo("RouteHomeDetail");
        }
    });
});
