sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/ui/core/Fragment'
  ],
  function (BaseController, JSONModel, Fragment) {
    "use strict";
    var data;
    var oRouter;
    var userType;
    var userEmail;
    return BaseController.extend("com.incresol.incmailreaderappfrontend.controller.HomePage", {
      onInit: function () {
        oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("RouteHomePage").attachPatternMatched(this._onRouteMatched, this);
      }, _onRouteMatched: function (oEvent) {
        userType = oEvent.getParameter("arguments").isAdmin;
        userEmail = oEvent.getParameter("arguments").emailId;
        data = {
          userType,
          userEmail
        }
        console.log(typeof userType)
        if (userType==="true") {
          var config = this.getView().byId("_IDGenGenericTile");
          config.setVisible(true);
        }
        else if (userType==="false") {
          var config = this.getView().byId("_IDGenGenericTile");
          config.setVisible(false);
        }
        var oModel = new sap.ui.model.json.JSONModel(data);
        sap.ui.getCore().setModel(oModel, "data");
        // console.log("Model Data:", sap.ui.getCore().getModel("data").getData());
        // this.getView().setModel(oModel, "data");
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
        oRouter.navTo('RouteLoginPage')

      },
      onConfigurationSelect: function () {
        oRouter.navTo('RouteConfiguration')
      },onInboxSelect:function(){
        oRouter.navTo('RouteInbox')
      }
    });
  }
);
