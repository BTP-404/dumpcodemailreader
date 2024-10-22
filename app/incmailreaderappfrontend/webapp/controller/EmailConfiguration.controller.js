sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/Input",
    "sap/m/VBox",
    "sap/m/Button",
    "sap/ui/core/Item",
    "sap/m/Select",
    "sap/m/Slider",
    "sap/m/MultiComboBox",
    "sap/m/Switch",
    "sap/ui/core/Fragment"
  ],
  function (BaseController, MessageToast) {
    "use strict";
    var oRouter;
    return BaseController.extend("com.incresol.incmailreaderappfrontend.controller.EmailConfiguration", {
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
        var oName = oView.byId("fullNameInput");
        var oEmail = oView.byId("emailInput");
        var oPassword = oView.byId("passwordInput");
        var oHostName = oView.byId("hostnameInput");
        var oPort = oView.byId("portInput");
        var oPollingFrequency = oView.byId("pollingFrequencySlider");
        var oMultiComboBox = oView.byId("multiComboBoxId");
        var oConnectionSecurity = oView.byId("securitySelect");
        const namePattern = /^[A-Za-zÀ-ÖØ-ÿ' \-]+$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var aKeywords = oMultiComboBox.getSelectedKeys();
        if (oName.getValue()) {
          if (namePattern.test(oName.getValue())) {
            oName.setValueState("None");
            if (oEmail.getValue()) {
              if (emailPattern.test(oEmail.getValue())) {
                oEmail.setValueState("None");
                if (oPassword.getValue()) {
                  oPassword.setValueState("None");
                  if (oHostName.getValue()) {
                    oHostName.setValueState("None");
                    if (oPort.getValue()) {
                      oPort.setValueState("None");
                      if (oPort.getValue() >= 0 && oPort.getValue() <= 65535) {
                        oPort.setValueState("None");
                        var pollingFrequencyValue = oPollingFrequency.getValue();
                        if (pollingFrequencyValue >= 5 && pollingFrequencyValue <= 30) {
                          let oModel = this.getView().getModel();
                          let oBindList = oModel.bindList("/EmailConfiguration");
                          var portValue = parseInt(oPort.getValue(), 10);
                          var connectionSecurityValue = oConnectionSecurity.getSelectedKey();
                          var oContext = oBindList.create({
                            fullName: oName.getValue(),
                            emailId: oEmail.getValue(),
                            password: oPassword.getValue(),
                            hostName: oHostName.getValue(),
                            port: portValue,
                            keywords: aKeywords,
                            markRead: oView.byId("mySwitch").getState(),
                            pollingFrequency: pollingFrequencyValue,
                            connectionSecurity: connectionSecurityValue
                          });
                          oContext.created().then(() => {
                            MessageToast.show("Submitted successfully");
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                            oRouter.navTo("RouteConfiguredMail");
                          }).catch((error) => {
                            MessageToast.show(error);
                          });
                        } else {
                          MessageToast.show("Polling frequency must be between 5 and 30 seconds.");
                        }
                      } else {
                        oPort.setValueStateText("Port number is invalid");
                        oPort.setValueState("Error");
                      }
                    } else {
                      oPort.setValueStateText("Port number is mandatory");
                      oPort.setValueState("Error");
                    }
                  } else {
                    oHostName.setValueStateText("Host is mandatory");
                    oHostName.setValueState("Error");
                  }
                } else {
                  oPassword.setValueStateText("Password is mandatory");
                  oPassword.setValueState("Error");
                }
              } else {
                oEmail.setValueStateText("Please enter a valid email");
                oEmail.setValueState("Error");
              }
            } else {
              oEmail.setValueStateText("Email is mandatory");
              oEmail.setValueState("Error");
            }
          } else {
            oName.setValueStateText("Please enter a valid name");
            oName.setValueState("Error");
          }
        } else {
          oName.setValueStateText("Name is mandatory");
          oName.setValueState("Error");
        }
      },
      refreshData: function () {
        var oTable = this.getView().byId("emailTable");
        var oBinding = oTable.getBinding("items");
        if (oBinding) {
          oBinding.refresh();
        }
      },
      onPressCheckPrevious: function () {
        var oView = this.getView();
        var oModel = oView.getModel();
        var oDialog = oView.byId("panelDialog1");
        if (!oDialog) {
          oDialog = sap.ui.xmlfragment(oView.getId(), "com.incresol.incmailreaderappfrontend.fragment.PanelFragment", this);
          if (!oDialog) {
            MessageToast.show("The PanelFragment could not be loaded.");
            return;
          }
          if (oDialog instanceof sap.ui.core.Control) {
            oView.addDependent(oDialog);
          } else {
            MessageToast.show("The loaded fragment is not a valid UI control.");
            return;
          }
        }
        this.refreshData();
        oDialog.open();
      },
      onClosePanelDialog: function () {
        var oView = this.getView();
        var oDialog = oView.byId("panelDialog1");
        oDialog.close();
      }
    });
  }
);
