# Test Plans
Writing **Test Plans** is very useful in order to get your app tested properly by the QA Engineers. In this article, I want to go over the few guidelines we have in order to write a proper test plan, and things to keep in mind when doing so.

A **Test Plan** is a collection of individual tests. In Monster, each Test Plan covers all the features/functionalities of its parent app. It is contained in the `%appRoot&/design/Test Plan` folder, as an Excel Spreadsheet. If an app require some specific requirement, please add a document in that folder called "Prerequisites", and link to it in the Test Plan under the **Pre-requisites** section

### Guidelines
Now on to the actual guidelines... When starting a new Test Plan, make sure to get the Test Plan from the Skeleton App if you haven't already, as it defines the default structure of your test plan.

Now that you're ready to write your app specific tests, please try to stick to those rules:

- Be concise and clear
- Remember that this document is for others to use, so make sure it's easy to understand and defines cleary what you have in mind
- Make sure to always file what the tester has to do and what the tester should expect (Actions and Expected column)
- If your app can be used with different roles (user, admin, reseller, ...), make sure to add columns to the test for each of them.
- Try to give a quick recap' of the unusual things of your application if it has some. Most of the apps are CRUD but some of them have details that are hard to understand.
- The Pass/Fail column is splitted into different categories, if a category doesn't apply to the ticket, you can write N/A in the cell so the tester knows he doesn't have to test it.
- Try to split a story in 2 for the best-case scenario and the error scenario. For the errors, create one test and each step of the test is a different error to test (for example if the UI shows a special message if a wrong MAC Address is typed, write a small step for it in the "Error Handling when Adding a User" test)