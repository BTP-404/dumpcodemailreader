sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"  // Add JSONModel dependency
  ],
  function(BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("com.mailprocessor.controller.App", {
      onInit: function() {
        var oModel = sap.ui.getCore().getModel("userModel");

        // Check if the model exists, if not, create and set it
        if (!oModel) {
          oModel = new JSONModel({
            userType: ""  // Initialize with a default value if necessary
          });
          sap.ui.getCore().setModel(oModel, "userModel");
        }

        // Set the model to the view
        this.getView().setModel(oModel, "userModel");

        // Retrieve the userType from local storage and set it in the model if available
        var sUserType = localStorage.getItem("userType");
        if (sUserType) {
          oModel.setProperty("/userType", sUserType);
        }
      },
      onLogoutPress: function () {
        var oModel = this.getView().getModel("userModel");

        // Check if the model exists
        if (oModel) {
          oModel.setProperty("/userType", "");
        }

        // Clear userType from local storage
        localStorage.removeItem("userType");

        // Navigate to the login page or other appropriate page
        this.getOwnerComponent().getRouter().navTo("RouteHomeDetail");
      }
    });
  }
);
