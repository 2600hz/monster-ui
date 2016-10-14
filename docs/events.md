# Using Monster Events
**Monster UI** use [postal.js][postaljs] as a local message bus (pub/sub system). It is mostly used to subscribe and publish [Common Controls][common controls] into applications and is wrapped inside **Monster** methods to simplify their invocation.

### Subscribe
##### Named Functions
To subscribe to a specific function, the following steps need to be respected:
* in the `app` variable exists an object called subscribed; inside it link the function to subscribe to to a topic name:
```
subscribe: {
    'topicName': 'functionName'
}
```
* respect the [naming conventions ][naming conventions] and name the topic following this rule: `{appName}.{commonControl}.{functionName}`

#### Anonymous Functions
To subscribe to an anonymous function, the following steps need to be respected:
* call the **Monster** method:
```
monster.sub(topic, callback, context);
```
* respect the [naming conventions ][naming conventions] and name the topic following this rule: `'{appName}.{commonControl}.{functionName}'`
* the `context` parameter is optional and will be used as `this` in the `callback`

### Publish
Thanks to **Monster UI** core methods, publishing is really easy:
```
monster.pub(topic, data);
```
The topic should follow the rule: `'{appName}.{commonControl}.{functionName}'`
The `data` parameter can be a callback or an object containing a function used as callback.

[postaljs]: https://github.com/postaljs/postal.js "postal.js Github project"
[common controls]: commonControls.md "Common Controls Documentation"
[naming conventions]: codingStandards.md#naming "Naming Conventions"
