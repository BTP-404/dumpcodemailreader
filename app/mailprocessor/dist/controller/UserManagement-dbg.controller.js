sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
function (Controller,JSONModel) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.AddUser", {
        onInit: function() {
            // Create a JSON model with sample data
            var oModel = new JSONModel({
                users: [
                    { userId: "1", name: "John Doe", email: "john.doe@example.com" },
                    { userId: "2", name: "Jane Smith", email: "jane.smith@example.com" }
                    // Add more users as needed
                ]
            });

            // Set the model to the view
            this.getView().setModel(oModel);
        },

        onAddUserPress: function() {
            // Logic to add a user
            // Example: Push new user data into the model
            var oModel = this.getView().getModel();
            var aUsers = oModel.getProperty("/users");
            aUsers.push({ userId: "3", name: "New User", email: "new.user@example.com" });
            oModel.setProperty("/users", aUsers);
        },

        onDeleteUserPress: function() {
            // Logic to delete a user
            // Example: Remove the selected user from the model
            var oModel = this.getView().getModel();
            var aUsers = oModel.getProperty("/users");
            if (aUsers.length > 0) {
                aUsers.pop(); // Just an example, implement your actual logic
                oModel.setProperty("/users", aUsers);
            }
        },

        onEditUserPress: function() {
            // Logic to edit a user
            // Example: Modify a user's data in the model
            var oModel = this.getView().getModel();
            var aUsers = oModel.getProperty("/users");
            if (aUsers.length > 0) {
                aUsers[0].name = "Updated Name"; // Just an example, implement your actual logic
                oModel.setProperty("/users", aUsers);
            }
        },

        onManageRolesPress: function() {
            // Logic to manage roles
            // Implement your role management logic here
        }
    });
});
