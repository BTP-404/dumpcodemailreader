sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/Fragment'
  ],
  function (BaseController, Fragment) {
    "use strict";
     var oRouter;
    return BaseController.extend("com.incresol.incmailreaderappfrontend.controller.Configuration", {
      onInit: function () {
        oRouter = this.getOwnerComponent().getRouter();
      }, handlePopoverPress: function (oEvent) {

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
      onEmailConfigurationSelect: function () {
        oRouter.navTo('RouteEmailConfiguration')
      },onUserSelect: function () {
        oRouter.navTo('RouteUser')
      }
    });
  }
);
