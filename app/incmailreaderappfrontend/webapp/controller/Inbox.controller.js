sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/Fragment",
        "sap/m/MessageBox",
        "sap/m/MessageToast"
    ],
    function (Controller, Fragment, MessageBox, MessageToast) {
        "use strict";
        var oRouter;

        return Controller.extend("com.incresol.incmailreaderappfrontend.controller.Inbox", {
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

            onProceedIconPress: function (oEvent) {
                var oItem = oEvent.getSource().getParent();
                var oContext = oItem.getBindingContext();
                var oSelectedData = oContext.getObject();

                $.ajax({
                    url: '/odata/v4/mail-reader/cleardb',
                    method: 'POST',
                    contentType: 'application/json',
                    success: function () {
                        MessageToast.show('db cleared')
                        let oModel = this.getView().getModel();
                        let oBindList = oModel.bindList("/SelectedMail");

                        let oContext1 = oBindList.create({
                            useremail: oSelectedData.emailId,
                            password: oSelectedData.password,
                            host: oSelectedData.hostName,
                            port: oSelectedData.port,
                            tls: oSelectedData.connectionSecurity === 'TLS',
                            keywords: oSelectedData.keywords,
                            markRead: oSelectedData.markRead
                        });

                        oContext1.created().then(() => {
                            MessageToast.show("Configuration Selected successfully");
                            this.getOwnerComponent().getRouter().navTo("RouteMailBox");
                        }).catch((error) => {
                            MessageToast.show(`Error creating context: ${error}`);
                        });
                    }.bind(this),
                    error: function (jqXHR, textStatus, errorThrown) {
                        MessageToast.show(`Error: ${textStatus} - ${errorThrown}`);
                    }
                });

                // if (oContext) {
                //     var oSelectedData = oContext.getObject();

                //     MessageBox.confirm("Are you sure you want to proceed with the selected configuration for this email?", {
                //         actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                //         onClose: function (oAction) {
                //             if (oAction === MessageBox.Action.OK) {
                                
                //             }
                //         }.bind(this)
                //     });
                // }
            },

            formatKeywords: function (keywords) {
                if (Array.isArray(keywords)) {
                    return keywords.join(", ");
                }
                return keywords;
            },
        });
    }
);
