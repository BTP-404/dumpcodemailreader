sap.ui.define(
  [
      "sap/ui/core/mvc/Controller",
      "sap/ui/core/Fragment"
  ],
  function(Controller, Fragment) {
      "use strict";

      return Controller.extend("com.mailprocessor.controller.EmailReaderLog", {
          onInit: function() {
          },

          onPressSuccessLog: function() {
              // Open Success Log Fragment
              this._openLogFragment("com.mailprocessor.fragments.SuccessLog");
          },

          onPressErrorLog: function() {
              // Open Error Log Fragment
              this._openLogFragment("com.mailprocessor.fragments.ErrorLog");
          },
          onClose: function(oEvent) {
            oEvent.getSource().getParent().close();
        },

        _openLogFragment: function(fragmentName) {
            // Check if the fragment is already loaded
            if (!this[fragmentName]) {
                // Load the fragment
                this[fragmentName] = Fragment.load({
                    id: this.getView().getId(),
                    name: fragmentName,
                    controller: this
                }).then(function(oFragment) {
                    this.getView().addDependent(oFragment);
                    oFragment.open();
                    return oFragment; // Return the loaded fragment
                }.bind(this));
            } else {
                // Resolve the Promise before calling open
                this[fragmentName].then(function(oFragment) {
                    oFragment.open();
                });
            }
        }
        
      });
  }
);
