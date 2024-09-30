sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        'sap/m/MessageToast'
    ],
    function (Controller, MessageToast) {
        "use strict";
        var orgTypeSelect;
        return Controller.extend("com.mailprocessor.controller.RegisterNewOrg", {
            onInit: function () {
            },
            onOrganizationTypeChange: function (oEvent) {
                var oView = this.getView();
                var oSelect = oEvent.getSource();

                var sSelectedKey = oSelect.getSelectedKey();
                var oManualEntryInput = oView.byId("manualEntryInput1");
                orgTypeSelect = sSelectedKey;

                // Show or hide the manual entry input based on selection
                oManualEntryInput.setVisible(sSelectedKey === "Other");
            },
            
            onSubmitPress: function () {

                var oView = this.getView();
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                // Get input controls
                var oOrgInput = oView.byId("_IDGenInput1");
                var oOrgTypeSelect = oView.byId("organizationTypeSelect");
                var oManualEntryInput = oView.byId("manualEntryInput1");
                var oEmailInput = oView.byId("_IDGenInput3");
                var oContactInput = oView.byId("_IDGenInput4");
                var oAddressInput = oView.byId("_IDGenInput5");
                var oUserNameInput = oView.byId("_IDGenInput6");
                var oUserMailInput = oView.byId("_IDGenInput10");
                var oUserIdInput = oView.byId("_IDGenInput9");
                var oPasswordInput = oView.byId("_IDGenInput7");
                var oConfirmPasswordInput = oView.byId("_IDGenInput8");

                // Validate required fields
                if (oOrgInput.getValue()) {
                    oOrgInput.setValueState("None");
                    var selectedOrgType = oOrgTypeSelect.getSelectedKey();
                    var manualEntryValue = oManualEntryInput.getValue();

                    if (selectedOrgType || manualEntryValue) {
                        oOrgTypeSelect.setValueState("None");
                        oManualEntryInput.setValueState("None");

                        if (oEmailInput.getValue() && emailPattern.test(oEmailInput.getValue())) {
                            oEmailInput.setValueState("None");

                            if (oContactInput.getValue() && /^(\+?\d{1,4})?[-.\s]?(\(?\d{1,5}\)?)[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})(?:[-.\s]?(\d+))?$/.test(oContactInput.getValue())) {
                                oContactInput.setValueState("None");

                                if (oAddressInput.getValue()) {
                                    oAddressInput.setValueState("None");

                                    if (oUserNameInput.getValue() && /^[A-Za-zÀ-ÖØ-ÿ' \-]+$/.test(oUserNameInput.getValue())) {
                                        oUserNameInput.setValueState("None");

                                        if (oUserMailInput.getValue() && emailPattern.test(oUserMailInput.getValue())) {
                                            oUserMailInput.setValueState("None");

                                            if (oUserIdInput.getValue()) {
                                                oUserIdInput.setValueState("None");

                                                if (oPasswordInput.getValue()) {
                                                    oPasswordInput.setValueState("None");

                                                    if (oConfirmPasswordInput.getValue()) {
                                                        oConfirmPasswordInput.setValueState("None");

                                                        if (oPasswordInput.getValue() === oConfirmPasswordInput.getValue()) {
                                                            if (selectedOrgType === 'Other' && !manualEntryValue) {
                                                                MessageToast.show("Organization type is mandatory");
                                                                oOrgTypeSelect.setValueStateText("Specify organization type");
                                                                oOrgTypeSelect.setValueState("Error");
                                                                oManualEntryInput.setValueStateText("Specify organization type");
                                                                oManualEntryInput.setValueState("Error");
                                                            } else {
                                                                oOrgTypeSelect.setValueState("None");
                                                                oManualEntryInput.setValueState("None");

                                                                let oModel = this.getView().getModel();
                                                                let oBindList = oModel.bindList("/Organization");

                                                              var oContext=  oBindList.create(
                                                                    {
                                                                        organizationName: oOrgInput.getValue(),
                                                                        organizationType: selectedOrgType === 'Other' ? manualEntryValue : selectedOrgType,
                                                                        emailId: oEmailInput.getValue(),
                                                                        contactNo: oContactInput.getValue(),
                                                                        address: oAddressInput.getValue(),
                                                                        administrators: [
                                                                            {
                                                                                emailId: oUserMailInput.getValue(),
                                                                                userName: oUserNameInput.getValue(),
                                                                                userId: oUserIdInput.getValue(),
                                                                                password: oConfirmPasswordInput.getValue()
                                                                            }
                                                                        ]
                                                                    }

                                                                  );

                                                                  oContext.created().then( (oData) =>{
                                                                    MessageToast.show("Orgnization Created ");
                                                                    console.log(oData);
                                                                    this.getOwnerComponent().getRouter().navTo("RouteOrgDetail");
                                                                  }).catch((error) => {
                                                                    console.log(error);
                                                                    MessageToast.show(`${error}`);

                                                                  });
                                                                    


                                                            }
                                                        } else {
                                                            MessageToast.show("Passwords do not match");
                                                            oConfirmPasswordInput.setValueStateText("Passwords do not match");
                                                            oConfirmPasswordInput.setValueState("Error");
                                                        }
                                                    } else {
                                                        MessageToast.show("Confirm password is mandatory");
                                                        oConfirmPasswordInput.setValueStateText("Confirm password is mandatory");
                                                        oConfirmPasswordInput.setValueState("Error");
                                                    }
                                                } else {
                                                    MessageToast.show("Create password is mandatory");
                                                    oPasswordInput.setValueStateText("Create password is mandatory");
                                                    oPasswordInput.setValueState("Error");
                                                }
                                            } else {
                                                MessageToast.show("User ID is mandatory");
                                                oUserIdInput.setValueStateText("User ID is mandatory");
                                                oUserIdInput.setValueState("Error");
                                            }
                                        } else {
                                            MessageToast.show("User email is not valid");
                                            oUserMailInput.setValueStateText("User email is not valid");
                                            oUserMailInput.setValueState("Error");
                                        }
                                    } else {
                                        MessageToast.show("Name is not valid");
                                        oUserNameInput.setValueStateText("Name is not valid");
                                        oUserNameInput.setValueState("Error");
                                    }
                                } else {
                                    MessageToast.show("Address is mandatory");
                                    oAddressInput.setValueStateText("Address is mandatory");
                                    oAddressInput.setValueState("Error");
                                }
                            } else {
                                MessageToast.show("Contact number is not valid");
                                oContactInput.setValueStateText("Contact number is not valid");
                                oContactInput.setValueState("Error");
                            }
                        } else {
                            MessageToast.show("Email is not valid");
                            oEmailInput.setValueStateText("Email is not valid");
                            oEmailInput.setValueState("Error");
                        }
                    } else {
                        MessageToast.show("Organization type is mandatory");
                        oOrgTypeSelect.setValueStateText("Organization type is mandatory");
                        oOrgTypeSelect.setValueState("Error");
                        oManualEntryInput.setValueStateText("Specify organization type");
                        oManualEntryInput.setValueState("Error");
                    }
                } else {
                    MessageToast.show("Organization name is mandatory");
                    oOrgInput.setValueStateText("Organization name is mandatory");
                    oOrgInput.setValueState("Error");
                }
            }

        
            
            
         

            
        });
    }
);
