# monster.util.dataFlags
The `monster.util.dataFlags` object contains different methods used to easily access and change flags set by Monster on data objects.

This methods knows where the flag are stored and will get/add/delete the values for the developer. It is useful because the object where we store flags has changed a lot in the past, so we want to abstract it to make sure we use the same keys everywhere. As of today, we store flags in a `markers` object and add an additional `monster` namespace to make sure this is OUR object that other people won't update.

If it was decided to change the name "markers" to "uiFlags" for example, we could easily just change the helpers, and the UI would set and get the flags properly (in addition to running a script on the database to update the existing values).

### Methods
* [get()][get]
* [add()][add]
* [destroy()][destroy]

[get]: dataFlags/get().md
[add]: dataFlags/add().md
[destroy]: dataFlags/destroy().md
