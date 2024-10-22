sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
],
    function (Controller, MessageToast) {
        "use strict";

        return Controller.extend("com.incresol.incmailreaderappfrontend.controller.LoginPage", {
            onInit: function () {

            }, onForgotPasswordPress: function () {
                alert("not implemented")
            }, onLoginPress: function () {
                const oRouter = this.getOwnerComponent().getRouter()
                let oEmail = this.getView().byId('emailid');
                let oPassword = this.getView().byId('password');

                let emailId = oEmail.getValue();
                let password = oPassword.getValue();
                oEmail.setValueStateText("None");
                oEmail.setValueState("None");
                oPassword.setValueStateText("None");
                oPassword.setValueState("None");
                if (!emailId) {
                    oEmail.setValueStateText("please enter email id");
                    oEmail.setValueState("Error");

                }
                if (!password) {
                    oPassword.setValueStateText("please enter password");
                    oPassword.setValueState("Error");
                }

                let oPayload = {
                    emailId,
                    password

                }
               
                $.ajax({
                    url: "/odata/v4/mail-reader/login",
                    method: "POST",
                    contentType:"application/json",
                    data:JSON.stringify(oPayload),
                    success: function (response) {
                        let parsedresponse = JSON.parse(response.value);
                        const loggedInUser  = parsedresponse.data;
                    
                       if(parsedresponse.status == 200 && parsedresponse.message == "Login successful!!")
                       {
                        oRouter.navTo('RouteHomePage',{isAdmin:loggedInUser.isAdmin,
                            emailId:loggedInUser.emailId
                        }
                      
                        );
                       }else{
                        oEmail.setValueState("Error");
                        oPassword.setValueState("Error");
                        MessageToast.show("Invalid Credentials");
                       }
                        

                    },
                    error: function (error) {
                        MessageToast.show(`${error}`);
                    }
                });
                
            
                
            }
        });
    });
