sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/Input",
    "sap/m/VBox",
    "sap/m/Button",
    "sap/ui/core/Item",
    "sap/m/Select",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast"
  ],
  function (Controller, Input, VBox, Button, Item, Select, Fragment, MessageToast) {
    "use strict";
    
    var oRouter;

    return Controller.extend("com.incresol.incmailreaderappfrontend.controller.User", {
      onInit: function () {
        oRouter = this.getOwnerComponent().getRouter();
      },

      handlePopoverPress: function (oEvent) {
        var oButton = oEvent.getSource(),
            oView = this.getView();

        if (!this._pPopover) {
          this._pPopover = Fragment.load({
            id: oView.getId(),
            name: "com.incresol.incmailreaderappfrontend.fragment.Popover",
            controller: this
          }).then(function (oPopover) {
            oPopover.setModel(sap.ui.getCore().getModel("data"), "data");
            oPopover.bindElement("data>/");
            oPopover.openBy(oButton);
            return oPopover;
          });
        }
        this._pPopover.then(function (oPopover) {
          oPopover.openBy(oButton);
        });
      },

      handlelogoutPress: function () {
        this.byId("myPopover").close();
        oRouter.navTo('RouteLoginPage');
      },

      onSubmit: function () {
        var oView = this.getView();
        var oName = oView.byId("userName");
        var oEmail = oView.byId("emailId");
        var oPassword = oView.byId("password");
        var oSwitch = oView.byId("mySwitch1");

        const namePattern = /^[A-Za-z0-9' \-]+$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        oName.setValueState("None");
        oEmail.setValueState("None");
        oPassword.setValueState("None");

        if (!oName.getValue()) {
          oName.setValueStateText("Name is mandatory");
          oName.setValueState("Error");
          return;
        }
        if (!namePattern.test(oName.getValue())) {
          oName.setValueStateText("Please enter a valid name");
          oName.setValueState("Error");
          return;
        }
        if (!oEmail.getValue()) {
          oEmail.setValueStateText("Email is mandatory");
          oEmail.setValueState("Error");
          return;
        }
        if (!emailPattern.test(oEmail.getValue())) {
          oEmail.setValueStateText("Please enter a valid email");
          oEmail.setValueState("Error");
          return;
        }
        if (!oPassword.getValue()) {
          oPassword.setValueStateText("Password is mandatory");
          oPassword.setValueState("Error");
          return;
        }

        var signUpPayload = {
          userName: oName.getValue(),
          emailId: oEmail.getValue(),
          password: oPassword.getValue(),
          isAdmin: oSwitch.getState(),
        };

        $.ajax({
          url: "/odata/v4/mail-reader/signup",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(signUpPayload),
          success: function (response) {
            let parsedResponse;
            try {
              parsedResponse = JSON.parse(response.value);
            } catch (e) {
              MessageToast.show("Failed to parse response.");
              return;
            }

            if (parsedResponse.status === 201 && parsedResponse.message === "signup successful!!") {
              MessageToast.show("User Added !!");
              this.refreshUserList();
             
            } else if (parsedResponse.status === 409) {
              MessageToast.show("Conflict! User already exists!");
            } else {
              MessageToast.show("Something went wrong!");
            }
          }.bind(this),
          error: function (error) {
            MessageToast.show("An error occurred: " + error.responseText);
          }
        });
      },refreshUserList: function() {
        var oTable = this.getView().byId("userTable");
        var oBinding = oTable.getBinding("items");
    
        // Refresh the binding
        if (oBinding) {
            oBinding.refresh();
        }
    },

      onDeleteUser: function (oEvent) {
        const oButton = oEvent.getSource();
        const oItem = oButton.getParent();
        const oBindingContext = oItem.getBindingContext();

        if (oBindingContext) {
          const emailId = oBindingContext.getProperty("emailId");
          const bDeleteConfirmed = confirm("Are you sure you want to delete the user with email: " + emailId + "?");
          if (bDeleteConfirmed) {
            const that = this;
            $.ajax({
              url: `/odata/v4/mail-reader/User('${(emailId)}')`,
              method: "DELETE",
              success: function () {
                that.getView().getModel().refresh();
                
                MessageToast.show("User deleted successfully.");
              },
              error: function (oError) {
                console.error("Delete Error:", oError);
                MessageToast.show("Error deleting user: " + oError.responseText);
              }
            });
          }
        } else {
          console.log("No binding context found.");
        }
      }
    });
  }
);
