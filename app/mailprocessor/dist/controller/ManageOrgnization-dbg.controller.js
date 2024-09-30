sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.ManageOrgnization", {
        onInit: function () {
            var oModel = this.getView().getModel();
        },onIconPress : function(){
            alert("Hello")
        }
    });
});
