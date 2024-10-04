sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/Input",
    "sap/m/VBox",
    "sap/m/Button",
    "sap/ui/core/Item",
    "sap/m/Select",
    "sap/ui/core/Fragment"

], function (Controller, MessageToast, Input, VBox, Button, Fragment, Item, Select) {
    "use strict";
    var oMarkRead;
    return Controller.extend("com.mailprocessor.controller.EmailAccountConfiguration", {

        onInit: function () {
            // Initialize the controller
        },

        onAfterRendering: function () {
            // Show the dialog after the view has been rendered
            this._showTermsDialog();
        },

        _showTermsDialog: function () {
            var oView = this.getView();

            // Check if the dialog is already created
            var oDialog = oView.byId("termsDialog");
            if (!oDialog) {
                // Load the fragment
                oDialog = sap.ui.xmlfragment(oView.getId(), "com.mailprocessor.fragments.TermsDialog", this);

                if (!oDialog) {
                    // Handle the case where the fragment could not be loaded
                    MessageToast.show("The TermsDialog fragment could not be loaded.");
                    return;
                }

                // Add the dialog to the view's dependent aggregation
                oView.addDependent(oDialog);
            }

            // Open the dialog
            oDialog.open();
        },

        onAcceptTermsPress: function () {
            var oView = this.getView();
            var oDialog = oView.byId("termsDialog");
            if (oDialog) {
                oDialog.close();
            }

            // Show the main content
            var oMainContentVBox = oView.byId("mainContentVBox");
            if (oMainContentVBox) {
                oMainContentVBox.setVisible(true);
            }
        },

        onCancelTermsPress: function () {
            var oDialog = this.getView().byId("termsDialog");
            if (oDialog) {
                oDialog.close();
            }

            // Optionally show a message or handle the cancel action
            MessageToast.show("You need to accept the terms to proceed.");

            setTimeout(function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteHomeDetail");
            }.bind(this), 600000);
        },


        // Initialize the markRead state as false
        oMarkRead: false,

        // Event handler for the switch toggle event
        onSwitchChange: function (oEvent) {
            // Get the switch state (true if selected, false if not)
            this.oMarkRead = oEvent.getParameter("state");
        },

        onSubmit: function () {
            var oView = this.getView();
            var oFields = {
                fullName: oView.byId("fullNameInput"),
                email: oView.byId("emailInput"),
                password: oView.byId("passwordInput"),
                protocol: oView.byId("protocolSelect"),
                auth: oView.byId("authSelect"),
                port: oView.byId("portInput"),
                security: oView.byId("securitySelect"),
                hostName: oView.byId("hostnameInput"),
                pollingFrequency: oView.byId("pollingFrequencyInput")
            };

            const namePattern = /^[A-Za-zÀ-ÖØ-ÿ' \-]+$/;
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Get selected keywords from the MultiComboBox
            var aSelectedKeywords = oView.byId("multiComboBoxId").getSelectedKeys();

            var isValid = true;

            // Validation logic for form inputs
            for (var key in oFields) {
                if (key === "fullName" && !oFields[key].getValue()) {
                    this.setFieldError(oFields[key], "name is mandatory");
                    isValid = false;
                } else if (key === "email" && !oFields[key].getValue()) {
                    this.setFieldError(oFields[key], "email is mandatory");
                    isValid = false;
                } else if (key === "email" && !emailPattern.test(oFields[key].getValue())) {
                    this.setFieldError(oFields[key], "please enter valid email");
                    isValid = false;
                } else if (key === "password" && !oFields[key].getValue()) {
                    this.setFieldError(oFields[key], "password is mandatory");
                    isValid = false;
                } else if (key === "port" && !oFields[key].getValue()) {
                    this.setFieldError(oFields[key], "port no is mandatory");
                    isValid = false;
                } else if (key === "port" && (oFields[key].getValue() < 0 || oFields[key].getValue() > 65535)) {
                    this.setFieldError(oFields[key], "port no is invalid");
                    isValid = false;
                } else if (key === "hostName" && !oFields[key].getValue()) {
                    this.setFieldError(oFields[key], "host is mandatory");
                    isValid = false;
                } else if (key === "pollingFrequency" && !oFields[key].getValue()) {
                    this.setFieldError(oFields[key], "polling frequency is mandatory");
                    isValid = false;
                } else if (key === "pollingFrequency" && oFields[key].getValue() < 0) {
                    this.setFieldError(oFields[key], "polling frequency is not valid");
                    isValid = false;
                }
            }

            if (isValid) {
                let oModel = this.getView().getModel();
                let oBindList = oModel.bindList("/EmailConfiguration");

                var payload = {
                    fullName: oFields.fullName.getValue(),
                    emailId: oFields.email.getValue(),
                    password: oFields.password.getValue(),
                    protocol: oFields.protocol.getSelectedKey(),
                    authenticationMethod: oFields.auth.getSelectedKey(),
                    port: parseInt(oFields.port.getValue(), 10),
                    connectionSecurity: oFields.security.getSelectedKey(),
                    hostName: oFields.hostName.getValue(),
                    pollingFrequency: parseInt(oFields.pollingFrequency.getValue(), 10),
                    markRead: this.oMarkRead,
                    keywords: aSelectedKeywords
                };

                var oContext = oBindList.create(payload, {
                    success: function () {
                        // Success handling, route to the Mail Reader
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("RouteConfiguredMail"); // Replace with your actual route name
                        MessageToast.show("Email account configuration submitted successfully!");
                    }.bind(this),
                    error: function () {
                        // Handle errors here
                        MessageToast.show("Error occurred while submitting the configuration.");
                    }.bind(this)
                });
            }
        },

        setFieldError: function (oField, sMessage) {
            oField.setValueState("Error");
            oField.setValueStateText(sMessage);
        },
        onPressCheckPrevious: function () {
            var oView = this.getView();

            // Check if the dialog is already created
            var oDialog = oView.byId("panelDialog1");
            if (!oDialog) {
                // Load the fragment
                oDialog = sap.ui.xmlfragment(oView.getId(), "com.mailprocessor.fragments.PanelFragment", this);

                // Check if fragment was loaded correctly
                if (!oDialog) {
                    sap.m.MessageToast.show("The PanelFragment could not be loaded.");
                    return;
                }

                // Add the dialog to the view's dependent aggregation
                // Ensure oDialog is an instance of sap.ui.core.Control
                if (oDialog instanceof sap.ui.core.Control) {
                    oView.addDependent(oDialog);
                } else {
                    sap.m.MessageToast.show("The loaded fragment is not a valid UI control.");
                    return;
                }
            }

            // Open the dialog
            oDialog.open();
        }, onClosePanelDialog: function () {
            var oView = this.getView();
            var oDialog = oView.byId("panelDialog1");
            oDialog.close();
        }


    });
});
