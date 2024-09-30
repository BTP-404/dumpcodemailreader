sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.OrgnizationManagement", {
        onInit: function () {

        },
        onPressRegister:function(){
           
            this.getOwnerComponent().getRouter().navTo("RouteOrgRegister");
        },onPressManage : function(){
            this.getOwnerComponent().getRouter().navTo("RouteManageOrgnization");
        },onPressUser : function(){
            this.getOwnerComponent().getRouter().navTo("RouteUserManagement");
        }
    });
});
