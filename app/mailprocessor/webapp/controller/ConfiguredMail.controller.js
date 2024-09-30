sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox"
], function (Controller, MessageBox) {
  "use strict";

  return Controller.extend("com.mailprocessor.controller.ConfiguredMail", {

    onInit: function () {
     // this._loadEmailConfiguration();
    },


    //==============SOC  HP+======================================================
    onSelectionChange: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("listItem");
      if (oSelectedItem) {
          var oContext = oSelectedItem.getBindingContext();
          var oSelectedData = oContext.getObject();
           let oModel = this.getView().getModel();
                    let oBindList = oModel.bindList("/SelectedMail");

          // Create the payload with all selected data from EmailConfiguration
          

          // Show confirmation dialog
          MessageBox.confirm("Are you sure you want to select this row?", {
              onClose: function (oAction) {
                  if (oAction === MessageBox.Action.OK) {
                   
                  let oContext =  oBindList.create({
                      useremail: oSelectedData.emailId,     
                      password: oSelectedData.password,       
                      protocol: oSelectedData.protocol,      
                      host: oSelectedData.hostName,          
                      port: oSelectedData.port,                
                      tls: oSelectedData.connectionSecurity === 'TLS', 
                      keywords: oSelectedData.keywords,       
                      markRead: oSelectedData.markRead        
                  
              });
              oContext.created().then(() => {
                MessageToast.show("Configuration Selected successfully");
                // Navigate to RouteConfiguredMail after success
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMailBox");
                
            }).catch((error) => {
                MessageToast.show(error);
            });
              
                      
                  } else {
                      // Deselect the item if the user cancels
                      oEvent.getSource().setSelectedItem(null);
                  }
              }
          });
      }
  },

  //===============================EOCHP+=============================================

    // _loadEmailConfiguration: function () {
    //   let oModel = this.getView().getModel();
    //   let oBindList = oModel.bindList("/EmailConfiguration");

    //   oBindList.requestContexts().then(function (aContexts) {
    //     // Log and set data in the view as needed
    //     const aEmailConfigs = aContexts.map(oContext => oContext.getObject());
    //     this.getView().getModel("emailConfigModel").setProperty("/value", aEmailConfigs);
    //   }.bind(this)).catch(function (error) {
    //     console.error("Error during read call for EmailConfiguration", error);
    //     MessageBox.error("Failed to retrieve EmailConfiguration data.");
    //   });
    // },

    // Formatter function to display keywords
    formatKeywords: function (keywords) {
      if (Array.isArray(keywords)) {
        return keywords.join(", "); // Join array elements with commas
      }
      return keywords; // Return as is if not an array
    },

    // onSelectionChange: function (oEvent) {
    //   var oSelectedItem = oEvent.getParameter("listItem");
    //   var sEmailId = oSelectedItem.getCells()[0].getText(); 
    //   console.log("sEmailId=>>>>>>>>>>>>",sEmailId);
      
    //   // Get the emailId from the selected row
    //   var oModel = this.getView().getModel("emailConfigModel");
    //   var aEmailConfigs = oModel.getProperty("/value");

    //   // Find the selected email configuration
    //   var oEmailConfig = aEmailConfigs.find(function (config) {
    //     return config.emailId === sEmailId;
    //   });

    //   if (oEmailConfig) {
    //     var oPayload = {
    //       useremail: oEmailConfig.emailId,
    //       password: oEmailConfig.password,
    //       host: oEmailConfig.hostName,
    //       port: oEmailConfig.port,
    //       tls: oEmailConfig.connectionSecurity === "TLS",
    //       keywords: oEmailConfig.keywords
    //     };

    //     MessageBox.confirm("Are you willing to proceed further?", {
    //       onClose: function (sAction) {
    //         if (sAction === MessageBox.Action.OK) {
    //           // Create a new entry in the SelectedMail set
    //           this.getView().getModel().create("/SelectedMail", oPayload, {
    //             success: function () {
    //               // Navigate to the mailbox route on success
    //               this.getOwnerComponent().getRouter().navTo("RouteMailBox");
    //             }.bind(this),
    //             error: function () {
    //               MessageBox.information("Selected Email has been already configured.");
    //             }
    //           });
    //         }
    //       }.bind(this)
    //     });
    //   } else {
    //     MessageBox.error("No EmailConfiguration found for the selected email.");
    //   }
    // }
  });
});
