sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "./Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/PDFViewer",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, Formatter, JSONModel, Fragment, PDFViewer, Filter, FilterOperator) {
    "use strict";
    var oRouter;

    return Controller.extend("com.incresol.incmailreaderappfrontend.controller.MailBox", {
        formatter: Formatter,

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

        handlelogoutPress: function (oEvent) {
            this.byId("myPopover").close();
            oRouter.navTo('RouteLoginPage');
        },
        onButtonPress: function (oEvent) {

            const sButtonId = oEvent.getSource().getId();
            const sButtonKey = sButtonId.split("--").pop();


            switch (sButtonKey) {
                case "btnHome":
                    this.getOwnerComponent().getRouter().navTo("RouteHomePage");
                case "btnEmailConfig":
                    this.getOwnerComponent().getRouter().navTo("RouteEmailConfiguration");
                    let data;
                    data.setModel(sap.ui.getCore().getModel("data"), "data");
                    break;
                case "btnUserManagement":
                    this.getOwnerComponent().getRouter().navTo("RouteUser");
                    break;
                case "btnSelectMail":
                    this.getOwnerComponent().getRouter().navTo("RouteInbox");
                    break;
                case "btnMailBox":
                    this.getOwnerComponent().getRouter().navTo("RouteMailBox");
                    break;
                case "btnMailProcessor":
                    this.getOwnerComponent().getRouter().navTo("RouteMailProcessor");
                    break;
                case "btnInvoiceApp":
                    this.getOwnerComponent().getRouter().navTo("RouteInvoiceApp");
                    break;

            }
        },
     



       

     
      
       
       

    });
});
