"title: isAuthorizedTopicForCrossSiteMessaging()

# monster.util.isAuthorizedTopicForCrossSiteMessaging()

## Syntax
```javascript
monster.util.isAuthorizedTopicForCrossSiteMessaging(topicName);
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`topicName` | Name of the topic to check for cross-site messaging authorization. | `String` | | `true`

### Return value
A `Boolean` value that indicates whether the topic is authorized for cross-site messaging.

## Description
The `monster.util.isAuthorizedTopicForCrossSiteMessaging()` method verifies whether a topic name is permitted for cross-site messaging in the Monster UI system. It checks the topic against a set list that includes categories like tabs for office, numbers, users, groups, strategies, call logs, devices, voicemail boxes, and feature codes. The function returns `true` if the topic is on the list, signifying authorization; otherwise, it returns `false`.
